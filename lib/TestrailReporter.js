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

        const path = (suiteId) ? `get_suite/${suiteId}` : `get_project/${projectId}`;
        let response = request('GET', `https://${domain}/index.php?/api/v2/${path}`, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Basic ${auth}`,
          },
        });
        if (response.statusCode >= 300) console.error(response.getBody());
        const title = process.env.TESTRAIL_TITLE || `${JSON.parse(response.getBody()).name}: Automated Test Run`;

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
        const runId = JSON.parse(response.getBody()).id;

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
          const result = {
            case_id: matches[1],
            status_id: (err) ? 5 : 1,
          };
          if (err) result.comment = `Test failed: ${err.message}`;
          results.push(result);
        } else {
          break;
        }
      }
    });
  }
}

module.exports = TestRailReporter;
