/* eslint-disable class-methods-use-this */
/* eslint-disable no-underscore-dangle */
const request = require('sync-request');
const dayjs = require('dayjs');

class TestRailReporter {
  constructor(emitter, reporterOptions, options) {
    emitter.on('beforeDone', (err, args) => {
      this.onComplete(err, args);
    });
  }

  onComplete(err, args) {
    const requiredOptions = [
      'TESTRAIL_DOMAIN',
      'TESTRAIL_USERNAME',
      'TESTRAIL_APIKEY',
      'TESTRAIL_PROJECTID',
    ];
    const missingOption = requiredOptions.find(
      (option) => process.env[option] === undefined,
    );
    if (!missingOption) {
      this.domain = process.env.TESTRAIL_DOMAIN;
      this.username = process.env.TESTRAIL_USERNAME;
      this.apikey = process.env.TESTRAIL_APIKEY;
      this.projectId = process.env.TESTRAIL_PROJECTID;
      this.suiteId = process.env.TESTRAIL_SUITEID;
      this.version = process.env.TESTRAIL_VERSION;
      this.includeAll = process.env.TESTRAIL_INCLUDEALL;
      this.runId = process.env.TESTRAIL_RUNID;
      this.title = process.env.TESTRAIL_TITLE;
      this.milestoneId = process.env.TESTRAIL_MILESTONEID;
      this.verbose = process.env.VERBOSE || 'true';
      this.logging = process.env.TESTRAIL_LOGGING || 'full';
      this.customKeys = Object.keys(process.env).filter((key) =>
        key.startsWith('TESTRAIL_CUSTOM'),
      );
      this.url = '';
      this.results = [];

      this.jsonifyResults(args.summary.run.executions);
      this.pushToTestrail();
    } else {
      console.error(
        `\nA required environment variable ${missingOption} was not found.`,
      );
    }
  }

  _getLogging(execution) {
    const log = { url: '', request: '', response: '' };

    const urlObject = execution.request.url;
    let url = `${urlObject.protocol}://${urlObject.host.join('.')}${
      urlObject.path ? `/${urlObject.path.join('/')}` : ''
    }`;
    if (urlObject.query.members && urlObject.query.members.length) {
      const queryString = `?${urlObject.query.members
        .map((param) => `${param.key}=${param.value}`)
        .join('&')}`;
      url = url.concat(queryString);
    }
    log.url = `Request: ${execution.request.method} ${url}`;

    if (this.logging.toLowerCase() === 'none') return log;

    let requestLogging = `Headers:\n${execution.request.headers
      .map((header) => `${header.key}: ${header.value}`)
      .join('\n')}`;

    if (this.logging.toLowerCase() === 'headers') {
      log.request = requestLogging;
      return log;
    }

    if (execution.request.body && this.verbose.toLowerCase() !== 'false') {
      requestLogging = requestLogging.concat(
        `\nBody: ${execution.request.body.raw}`,
      );
    }
    log.request = requestLogging;

    let responseLogging = '';
    if (execution.response && this.verbose.toLowerCase() !== 'false') {
      responseLogging = `\n\nResponse: ${execution.response.code} ${
        execution.response.status
      }\nHeaders:\n${execution.response.headers
        .map((header) => `${header.key}: ${header.value}`)
        .join('\n')}`;

      if (execution.response.stream) {
        const responseBody = Buffer.from(execution.response.stream).toString();
        if (responseBody.length < 1048576) {
          responseLogging = responseLogging.concat(`\nBody: ${responseBody}`);
        } else {
          responseLogging = responseLogging.concat(
            `\n\nResponse body exceeds 1 mb.\nTrimmed response body: ${responseBody.substr(
              0,
              1048576 / 2,
            )}`,
          );
        }
      }
    } else if (execution.requestError) {
      responseLogging = `\n\nA request error has occurred.\n${JSON.stringify(
        execution.requestError,
        null,
        2,
      )}`;
    }
    log.response = responseLogging;

    return log;
  }

  jsonifyResults(executions) {
    const testCaseRegex = /\bC(\d+)\b/;

    const duplicateFailingCases = [];
    const filteredExecutions = executions.filter((testExecution) => {
      return testExecution.assertions && testExecution.assertions.length > 0;
    });

    filteredExecutions.forEach((execution) => {
      const log = this._getLogging(execution);

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
            currentResult.status_id = 4;
          } else {
            if (assertion.error) {
              currentResult.comment = currentResult.comment.concat(
                `\nError: ${JSON.stringify(assertion.error.message)}`,
              );
              currentResult.status_id = 5;
              if (
                this.results
                  .map((result) => result.case_id)
                  .includes(currentResult.case_id) &&
                !duplicateFailingCases.includes(currentResult.case_id)
              ) {
                duplicateFailingCases.push(currentResult.case_id);
              }
            } else currentResult.status_id = 1;

            // Don't duplicate logging if request and assertion are the same
            if (
              !currentRequestsAssertions.includes(currentResult.case_id) &&
              this.logging.toLowerCase() !== 'none'
            ) {
              currentResult.comment = currentResult.comment.concat(
                `\n${log.url}`,
              );
              currentResult.comment = currentResult.comment.concat(
                `\n\n${log.request}`,
              );
              currentResult.comment = currentResult.comment.concat(
                `$\n\n${log.response}`,
              );
            }

            currentRequestsAssertions.push(currentResult.case_id);
          }

          if (this.version) currentResult.version = this.version;
          currentResult.elapsed = `${
            execution.response && execution.response.responseTime
              ? Math.round(execution.response.responseTime / 1000) || 1
              : 1
          }s`;

          // If user has custom testrail fields, parse from process.env and push values
          if (this.customKeys.length) {
            this.customKeys.forEach((key) => {
              const testrailKey = key.replace('TESTRAIL_CUSTOM_', '');
              currentResult[testrailKey] = process.env[key];
            });
          }

          this.results.push(currentResult);
          i += 1;
        }
      });
    });

    //
    // Behavior when duplicate results for one test case are found:
    // Keep all results to preserve test logging, but push
    //    a final failing result at the end if any failed to ensure failing status.
    duplicateFailingCases.forEach((testCase) => {
      this.results.push({
        case_id: testCase,
        status_id: 5,
      });
    });
  }

  pushToTestrail() {
    if (this.results.length > 0) {
      const auth = Buffer.from(`${this.username}:${this.apikey}`).toString(
        'base64',
      );
      const headers = {
        'User-Agent': 'newman-reporter-testrail',
        'Content-Type': 'application/json',
        Authorization: `Basic ${auth}`,
      };

      let response;
      // Create a title using project name if no better title is specified
      if (!this.title) {
        const path = this.suiteId
          ? `get_suite/${this.suiteId}`
          : `get_project/${this.projectId}`;
        response = request(
          'GET',
          `https://${this.domain}/index.php?/api/v2/${path}`,
          { headers },
        );
        if (response.statusCode >= 300) console.error(response.getBody());
        this.title = `${
          JSON.parse(response.getBody()).name
        }: Automated Test Run ${dayjs().format('YYYY-MM-DD HH:mm:ss')}`;
      }

      if (this.runId) {
        // Get first run id from get_runs if latest specified
        if (this.runId.toLowerCase() === 'latest') {
          response = request(
            'GET',
            `https://${this.domain}/index.php?/api/v2/get_runs/${this.projectId}`,
            { headers },
          );
          this.runId = JSON.parse(response.getBody())[0].id;
        }
        // Get url from get_run
        response = request(
          'GET',
          `https://${this.domain}/index.php?/api/v2/get_run/${this.runId}`,
          { headers },
        );
      } else {
        // Add a new test run if no run id was specified
        const json = {
          name: this.title,
          suite_id: this.suiteId,
          milestone_id: this.milestoneId,
        };
        // Handle include all flag
        if (
          this.includeAll !== undefined &&
          this.includeAll.toLowerCase() === 'false'
        ) {
          json.include_all = false;
          json.case_ids = this.results.map((result) => result.case_id);
        }
        response = request(
          'POST',
          `https://${this.domain}/index.php?/api/v2/add_run/${this.projectId}`,
          {
            headers,
            json,
          },
        );
        if (response.statusCode >= 300) console.error(response.getBody());
        this.runId = JSON.parse(response.getBody()).id;
      }
      this.url = JSON.parse(response.getBody()).url;

      // Add results
      response = request(
        'POST',
        `https://${this.domain}/index.php?/api/v2/add_results_for_cases/${this.runId}`,
        {
          headers,
          json: {
            results: this.results,
          },
        },
      );
      if (response.statusCode >= 300) console.error(response.getBody());
      console.log(`\n${this.url}`);
    } else {
      console.error('\nnewman-reporter-testrail: No test cases were found.');
    }
  }
}

module.exports = TestRailReporter;
