/* eslint-disable no-underscore-dangle */
const request = require('sync-request');

class TestRailReporter {
  get results() {
    return this._results;
  }

  set results(results) {
    this._results = results;
  }

  constructor(emitter, reporterOptions, options) {
    this.results = [];

    emitter.on('beforeDone', (err, args) => {
      this.handleCompletion(err, args);
    });
  }

  handleCompletion(err, args) {
    this.handleTests(args.summary.run.executions);
    if (this.results.length > 0) {
      const domain = process.env.TESTRAIL_DOMAIN;
      const username = process.env.TESTRAIL_USERNAME;
      const apikey = process.env.TESTRAIL_APIKEY;
      const projectId = process.env.TESTRAIL_PROJECTID;
      const suiteId = process.env.TESTRAIL_SUITEID;
      const auth = Buffer.from(`${username}:${apikey}`).toString('base64');
      const version = process.env.TESTRAIL_VERSION;
      let runId = process.env.TESTRAIL_RUNID;
      let title = process.env.TESTRAIL_TITLE;
      let url = '';

      let response;
      // Create a title using project name if no better title is specified
      if (!title) {
        const path = (suiteId) ? `get_suite/${suiteId}` : `get_project/${projectId}`;
        response = request('GET', `https://${domain}/index.php?/api/v2/${path}`, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Basic ${auth}`,
          },
        });
        if (response.statusCode >= 300) console.error(response.getBody());
        title = process.env.TESTRAIL_TITLE || `${JSON.parse(response.getBody()).name}: Automated Test Run`;
      }

      if (runId) {
        // Get first run id from get_runs if latest specified
        if (runId.toLowerCase() === 'latest') {
          response = request('GET', `https://${domain}/index.php?/api/v2/get_runs/${projectId}`, {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Basic ${auth}`,
            },
          });
          runId = JSON.parse(response.getBody())[0].id;
        }
        // Get url from get_run
        response = request('GET', `https://${domain}/index.php?/api/v2/get_run/${runId}`, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Basic ${auth}`,
          },
        });
      } else {
      // Add a new test run if no run id was specified
        response = request('POST', `https://${domain}/index.php?/api/v2/add_run/${projectId}`, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Basic ${auth}`,
          },
          json: {
            name: title,
            suite_id: suiteId,
          },
        });
        if (response.statusCode >= 300) console.error(response.getBody());
        runId = JSON.parse(response.getBody()).id;
      }
      ({ url } = JSON.parse(response.getBody()));

      // Add results
      response = request('POST', `https://${domain}/index.php?/api/v2/add_results_for_cases/${runId}`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${auth}`,
        },
        json: {
          results: this.results,
        },
      });
      if (response.statusCode >= 300) console.error(response.getBody());
      console.log(`\n${url}`);
    } else {
      console.error('\nnewman-reporter-testrail: No test cases were found.');
    }
  }

  handleTests(executions) {
    const testCaseRegex = /\bC(\d+)\b/;
    const customKeys = Object.keys(process.env).filter((key) => key.startsWith('TESTRAIL_CUSTOM'));

    executions.forEach((execution) => {
      if (execution.assertions) {
        execution.assertions.forEach((assertion) => {
          // Split and match instead of a regex with /g to match only
          // leading cases and not ones referenced later in the assertion
          const strings = assertion.assertion.split(' ');
          for (let i = 0; i < strings.length; i++) {
            const matches = strings[i].match(testCaseRegex);
            if (matches) {
              const { url } = execution.request;
              const lastResult = {
                case_id: matches[1],
              };

              if (assertion.skipped === true) {
                lastResult.status_id = 4;
              } else {
                lastResult.comment = `Request: ${execution.request.method} ${url.protocol}://${url.host.join('.')}${url.path ? `/${url.path.join('/')}` : ''}`;
                if (url.query && url.query.length) lastResult.comment = lastResult.comment.concat(`\nQuery: ${url.query}`);
                if (url.body) lastResult.comment = lastResult.comment.concat(`\nQuery: ${url.body.raw}`);
                lastResult.comment = lastResult.comment.concat(`\nHeaders: ${JSON.stringify(execution.request.headers)}`);
                if (execution.request.body) lastResult.comment = lastResult.comment.concat(`\nBody: ${JSON.stringify(execution.request.body.raw)}`);

                // Handle DNS errors
                if (execution.response) {
                  console.log(execution.response);
                  lastResult.comment = lastResult.comment.concat(`\n\nResponse: ${execution.response.code} ${execution.response.status}`);
                  lastResult.comment = lastResult.comment.concat(`\nHeaders: ${JSON.stringify(execution.response.headers)}`);
                  if (execution.response.stream) lastResult.comment = lastResult.comment.concat(`\nBody: ${Buffer.from(execution.response.stream).toString()}`);
                } else if (execution.requestError) lastResult.comment = JSON.stringify(execution.requestError, null, 2);

                if (assertion.error) lastResult.status_id = 5;
                else lastResult.status_id = 1;
              }

              if (process.env.TESTRAIL_VERSION) lastResult.version = process.env.TESTRAIL_VERSION;
              lastResult.elapsed = `${execution.response && execution.response.responseTime ? Math.round(execution.response.responseTime / 1000) || 1 : 1}s`;

              // If user has custom testrail fields, parse from process.env and push values
              if (customKeys.length) {
                customKeys.forEach((key) => {
                  const testrailKey = key.replace('TESTRAIL_CUSTOM_', '');
                  lastResult[testrailKey] = process.env[key];
                });
              }

              // If the user maps multiple matching TestRail cases,
              // we need to fail all of them if one fails
              const matchingResultIndex = this.results.findIndex((prevResult) => prevResult.case_id === lastResult.case_id);
              if (matchingResultIndex > -1) {
                if (lastResult.status_id === 5 && this.results[matchingResultIndex].status_id !== 5) {
                  this.results[matchingResultIndex] = lastResult;
                }
              } else {
                this.results.push(lastResult);
              }
            }
          }
        });
      }
    });
  }
}

module.exports = TestRailReporter;
