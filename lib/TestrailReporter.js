/* eslint-disable class-methods-use-this */
/* eslint-disable no-underscore-dangle */
const request = require('sync-request');
const dayjs = require('dayjs');
const environment = require('./environment');
const TestRailApi = require('./testRailApi');
const Logger = require('./logger');

class TestRailReporter {
  constructor(emitter, reporterOptions, options) {
    emitter.on('beforeDone', (err, args) => {
      this.onComplete(err, args);
    });
  }

  onComplete(err, args) {
    this.env = environment;
    const requiredOptions = ['domain', 'username', 'apikey', 'projectId'];

    let hasMissingOptions = false;
    requiredOptions.forEach((option) => {
      if (this.env[option] === undefined) {
        console.error(
          `\nnewman-reporter-testrail: A required environment variable ${option} was not found.`,
        );
        hasMissingOptions = true;
      }
    });

    if (!hasMissingOptions) {
      this.results = [];
      this.jsonifyResults(args.summary.run.executions);
      this.pushToTestrail(args.summary);
    }
  }

  jsonifyResults(executions) {
    // Minor optimization: filter out test cases with no tests to report
    const filteredExecutions = executions.filter((testExecution) => {
      return testExecution.assertions && testExecution.assertions.length > 0;
    });

    // If we're matching by full title, transform the names to use C123 titles
    //   so we don't have to modify follow up code
    if (this.env.useTitles.toLowerCase() === 'true') {
      const testRailApi = new TestRailApi();
      const allCases = testRailApi.getCases();

      filteredExecutions.forEach((execution) => {
        execution.assertions.forEach((assertion) => {
          const match = allCases.find(
            (testCase) =>
              testCase.title === assertion.assertion || 
              testCase.title === execution.item.name ||
              new RegExp(`^C${testCase.id}\\b`).test(execution.item.name)
          );

          if (match)
            // eslint-disable-next-line no-param-reassign
            assertion.assertion = `C${match.id} ${assertion.assertion}`;
        });
      });
    }

    const testCaseRegex = /\bC(\d+)\b/;
    const duplicateFailingCases = [];
    filteredExecutions.forEach((execution) => {
      const logger = new Logger();
      const log = logger.getLogging(execution);

      // Keep track of the assertions for this particular request so that
      //   if we find duplicate test cases for it, we don't duplicate logging
      const currentRequestsAssertions = [];

      execution.assertions.forEach((assertion) => {
        // Split and match instead of a regex with /g to match only
        // leading cases and not ones referenced later in the assertion
        const strings = assertion.assertion.split(' ');

        let i = 0;
        while (i < strings.length && strings[i].match(testCaseRegex)) {
          // Test case found
          const currentResult = {
            case_id: strings[i].match(testCaseRegex)[1],
          };
          currentResult.comment = assertion.assertion;

          if (assertion.skipped === true) {
            currentResult.status_id = this.env.skipped_id;
          } else {
            if (assertion.error) {
              currentResult.comment = currentResult.comment.concat(
                `\nError: ${JSON.stringify(assertion.error.message)}`,
              );
              currentResult.status_id = this.env.fail_id;
              if (
                this.results
                  .map((result) => result.case_id)
                  .includes(currentResult.case_id) &&
                !duplicateFailingCases.includes(currentResult.case_id)
              ) {
                duplicateFailingCases.push(currentResult.case_id);
              }
            } else currentResult.status_id = this.env.pass_id;

            if (this.env.logging.toLowerCase() === 'none')
              currentResult.comment = assertion.assertion;
            // Don't duplicate logging if request and assertion are the same
            if (
              (!currentRequestsAssertions.includes(currentResult.case_id) &&
                this.env.logging.toLowerCase() !== 'none') ||
              this.env.steps.toLowerCase() !== 'false'
            ) {
              currentResult.comment = currentResult.comment.concat(
                `\n${log.url}`,
              );
              currentResult.comment = currentResult.comment.concat(
                `\n\n${log.request}`,
              );
              currentResult.comment = currentResult.comment.concat(
                `\n\n${log.response}`,
              );
            }

            currentRequestsAssertions.push(currentResult.case_id);
          }

          if (this.env.version) currentResult.version = this.env.version;
          currentResult.elapsed = `${
            execution.response && execution.response.responseTime
              ? Math.round(execution.response.responseTime / 1000) || 1
              : 1
          }s`;

          // If user has custom testrail fields, parse from process.env and push values
          if (this.env.customKeys.length) {
            this.env.customKeys.forEach((key) => {
              const testrailKey = key.replace('TESTRAIL_CUSTOM_', '');
              currentResult[testrailKey] = process.env[key];
            });
          }

          if (this.env.steps.toLowerCase() !== 'true') {
            this.results.push(currentResult);
          } else {
            // If test steps are enabled, we should create a new parent case object if it doesn't currently exist
            const currentStepResult = currentResult;
            const parentIndex = this.results.findIndex(
              (result) => result.case_id === currentResult.case_id,
            );
            if (parentIndex === -1) {
              currentStepResult[this.env.stepResultKey] = [
                {
                  status_id: currentStepResult.status_id,
                  content: currentStepResult.comment,
                },
              ];
              delete currentStepResult.comment;
              this.results.push(currentStepResult);
            } else {
              // If a parent case exists, we can just push the new result to custom_step_results
              this.results[parentIndex][this.env.stepResultKey].push({
                status_id: currentStepResult.status_id,
                content: currentStepResult.comment,
              });
            }
          }

          i += 1;
        }
      });
    });

    //
    // Behavior when duplicate results for one test case are found:
    // Keep all results to preserve test logging, but push
    //    a final failing result at the end if any failed to ensure failing status.
    if (this.env.steps.toLowerCase() !== 'true') {
      duplicateFailingCases.forEach((testCase) => {
        this.results.push({
          case_id: testCase,
          status_id: this.env.fail_id,
        });
      });
    }
    // When step reporting is enabled, calculate final parent test status by failing case if
    //   A failure was found, and passing case otherwise
    else {
      this.results = this.results.map((result) => {
        if (
          result[this.env.stepResultKey].some(
            (step) => step.status_id === this.env.fail_id,
          )
        ) {
          return { ...result, status_id: this.env.fail_id };
        }
        return { ...result, status_id: this.env.pass_id };
      });
    }
  }

  pushToTestrail(summary) {
    if (this.results.length > 0) {
      const testRailApi = new TestRailApi();
      let response;

      let { title } = this.env;
      // Create a title using project name if no better title is specified
      if (!title) {
        response = testRailApi.getProjectInfo();
        title = `${
          JSON.parse(response.getBody()).name
        }: Automated Test Run ${dayjs().format('YYYY-MM-DD HH:mm:ss')}`;
      }

      let { runId } = this.env;
      if (runId) {
        // Get first run id from get_runs if latest specified
        if (this.env.runId.toLowerCase() === 'latest') {
          response = testRailApi.getRuns();
          runId = JSON.parse(response.getBody()).runs[0].id;
        }
        response = testRailApi.getRun(runId);
      } else {
        // Add a new test run if no run id was specified
        response = testRailApi.addRun(title, this.results);
        runId = JSON.parse(response.getBody()).id;
      }
      const { url } = JSON.parse(response.getBody());

      summary.testrail = {
        run_id: runId,
        results: this.results
      }
      response = testRailApi.addResults(runId, this.results);
      console.log(`\n${url}`);

      const { closeRun } = this.env;
      if (closeRun.toLowerCase() !== 'false') {
        console.log('Closing run.');
        response = testRailApi.closeRun(runId);
      }
    } else {
      console.error('\nnewman-reporter-testrail: No test cases were found.');
    }
  }
}

module.exports = TestRailReporter;
