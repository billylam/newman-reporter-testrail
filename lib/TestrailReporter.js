const request = require('sync-request');

class TestRailReporter {
  constructor(emitter, reporterOptions, options) {
    const results = [];

    emitter.on('beforeDone', (err, args) => {
      if (results.length > 0) {
        const domain = process.env.TESTRAIL_DOMAIN;
        const username = process.env.TESTRAIL_USERNAME;
        const apikey = process.env.TESTRAIL_APIKEY;
        const projectId = process.env.TESTRAIL_PROJECTID;
        const suiteId = process.env.TESTRAIL_SUITEID;
        const auth = Buffer.from(`${username}:${apikey}`).toString('base64');
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
            results,
          },
        });
        if (response.statusCode >= 300) console.error(response.getBody());
        console.log(`\n${url}`);
      } else {
        console.error('\nnewman-reporter-testrail: No test cases were found.');
      }
    });

    emitter.on('assertion', (err, args) => {
      // Split and match instead of a regex with /g to match only
      // leading cases and not ones referenced later in the assertion
      const strings = args.assertion.split(' ');
      const testCaseRegex = /\bC(\d+)\b/;
      for (let i = 0; i < strings.length; i++) {
        const matches = strings[i].match(testCaseRegex);
        if (matches) {
          const lastResult = {
            case_id: matches[1],
          };
          if (err) {
            lastResult.comment = `Request: ${args.item.request.method} ${args.item.request.url.host}/${args.item.request.url.path.join('/')}\nQuery: ${JSON.stringify(args.item.request.url.query, null, 2)}\nHeaders: ${JSON.stringify(args.item.request.headers)}\nBody: ${JSON.stringify(args.item.request.body)}\n\nResponse: ${JSON.stringify(args.item.response, null, 2)}\nError message: ${err.message}`;
            lastResult.status_id = 5;
          } else if (args.skipped === true) {
            lastResult.status_id = 4;
          } else lastResult.status_id = 1;
          
          // If the user maps multiple matching TestRail cases,
          // we need to fail all of them if one fails
          const matchingResultIndex = results.findIndex(prevResult =>
            prevResult.case_id === lastResult.case_id);
          if (matchingResultIndex > -1) {
            if (lastResult.status_id === 5 && results[matchingResultIndex].status_id !== 5) {
              results[matchingResultIndex] = lastResult;
            }
          } else {
            results.push(lastResult);
          }
        }
      }
    });
  }
}

module.exports = TestRailReporter;
