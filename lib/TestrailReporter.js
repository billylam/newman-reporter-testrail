/* eslint-disable no-underscore-dangle */
const request = require('sync-request');

class TestRailReporter {
  constructor(emitter, reporterOptions, options) {
    emitter.on('beforeDone', (err, args) => {
      this.onComplete(err, args);
    });
  }

  onComplete(err, args) {
    const requiredOptions = ['TESTRAIL_DOMAIN', 'TESTRAIL_USERNAME', 'TESTRAIL_APIKEY', 'TESTRAIL_PROJECTID'];
    const missingOption = requiredOptions.find((option) => process.env[option] === undefined);
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
      this.customKeys = Object.keys(process.env).filter((key) => key.startsWith('TESTRAIL_CUSTOM'));
      this.url = '';
      this.results = [];

      this.jsonifyResults(args.summary.run.executions);
      this.pushToTestrail();
    } else {
      console.error(`\nA required environment variable ${missingOption} was not found.`);
    }
  }

  jsonifyResults(executions) {
    const testCaseRegex = /\bC(\d+)\b/;
    const duplicateFailingCases = [];
    executions.forEach((execution) => {
      if (execution.assertions) {
        execution.assertions.forEach((assertion) => {
          // Split and match instead of a regex with /g to match only
          // leading cases and not ones referenced later in the assertion
          const strings = assertion.assertion.split(' ');
          for (let i = 0; i < strings.length; i++) {
            const matches = strings[i].match(testCaseRegex);
            if (matches) {
              // Test case found
              const { url } = execution.request;
              const currentResult = {
                case_id: matches[1],
              };

              currentResult.comment = assertion.assertion;

              if (assertion.skipped === true) {
                currentResult.status_id = 4;
              } else {
                if (assertion.error) {
                  currentResult.comment = currentResult.comment.concat(`\nError: ${JSON.stringify(assertion.error.message)}`);
                  currentResult.status_id = 5;
                  if (this.results.map((result) => result.case_id).includes(currentResult.case_id) && !duplicateFailingCases.includes(currentResult.case_id)) duplicateFailingCases.push(currentResult.case_id);
                } else currentResult.status_id = 1;

                currentResult.comment = currentResult.comment.concat(`\n\nRequest: ${execution.request.method} ${url.protocol}://${url.host.join('.')}${url.path ? `/${url.path.join('/')}` : ''}`);
                if (url.query && url.query.length) currentResult.comment = currentResult.comment.concat(`\nQuery: ${url.query}`);
                if (url.body) currentResult.comment = currentResult.comment.concat(`\nQuery: ${url.body.raw}`);
                currentResult.comment = currentResult.comment.concat(`\nHeaders:\n${execution.request.headers.map((header) => `${header.key}: ${header.value}`).join('\n')}`);
                if (execution.request.body) currentResult.comment = currentResult.comment.concat(`\nBody: ${(execution.request.body.raw)}`);

                // Handle DNS errors
                if (execution.response) {
                  currentResult.comment = currentResult.comment.concat(`\n\nResponse: ${execution.response.code} ${execution.response.status}`);
                  currentResult.comment = currentResult.comment.concat(`\nHeaders:\n${execution.response.headers.map((header) => `${header.key}: ${header.value}`).join('\n')}`);
                  if (execution.response.stream) currentResult.comment = currentResult.comment.concat(`\nBody: ${Buffer.from(execution.response.stream).toString()}`);
                } else if (execution.requestError) currentResult.comment = JSON.stringify(execution.requestError, null, 2);
              }

              if (process.env.TESTRAIL_VERSION) currentResult.version = process.env.TESTRAIL_VERSION;
              currentResult.elapsed = `${execution.response && execution.response.responseTime ? Math.round(execution.response.responseTime / 1000) || 1 : 1}s`;

              // If user has custom testrail fields, parse from process.env and push values
              if (this.customKeys.length) {
                this.customKeys.forEach((key) => {
                  const testrailKey = key.replace('TESTRAIL_CUSTOM_', '');
                  currentResult[testrailKey] = process.env[key];
                });
              }

              this.results.push(currentResult);
            }
          }
        });
      }
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
      const auth = Buffer.from(`${this.username}:${this.apikey}`).toString('base64');
      const headers = {
        'Content-Type': 'application/json',
        Authorization: `Basic ${auth}`,
      };

      let response;
      // Create a title using project name if no better title is specified
      if (!this.title) {
        const path = (this.suiteId) ? `get_suite/${this.suiteId}` : `get_project/${this.projectId}`;
        response = request('GET', `https://${this.domain}/index.php?/api/v2/${path}`, { headers });
        if (response.statusCode >= 300) console.error(response.getBody());
        this.title = process.env.TESTRAIL_TITLE || `${JSON.parse(response.getBody()).name}: Automated Test Run`;
      }

      if (this.runId) {
        // Get first run id from get_runs if latest specified
        if (this.runId.toLowerCase() === 'latest') {
          response = request('GET', `https://${this.domain}/index.php?/api/v2/get_runs/${this.projectId}`, { headers });
          this.runId = JSON.parse(response.getBody())[0].id;
        }
        // Get url from get_run
        response = request('GET', `https://${this.domain}/index.php?/api/v2/get_run/${this.runId}`, { headers });
      } else {
      // Add a new test run if no run id was specified
        const json = {
          name: this.title,
          suite_id: this.suiteId,
        };
        // Handle include all flag
        if (this.includeAll !== undefined && this.includeAll.toLowerCase() === 'false') {
          json.include_all = false;
          json.case_ids = this.results.map((result) => result.case_id);
        }
        response = request('POST', `https://${this.domain}/index.php?/api/v2/add_run/${this.projectId}`, {
          headers,
          json,
        });
        if (response.statusCode >= 300) console.error(response.getBody());
        this.runId = JSON.parse(response.getBody()).id;
      }
      this.url = JSON.parse(response.getBody()).url;

      // Add results
      response = request('POST', `https://${this.domain}/index.php?/api/v2/add_results_for_cases/${this.runId}`, {
        headers,
        json: {
          results: this.results,
        },
      });
      if (response.statusCode >= 300) console.error(response.getBody());
      console.log(`\n${this.url}`);
    } else {
      console.error('\nnewman-reporter-testrail: No test cases were found.');
    }
  }
}

module.exports = TestRailReporter;
