const request = require('sync-request');

class TestRailReporter {
  constructor(emitter, reporterOptions, options) {
    const results = [];

    emitter.on('beforeDone', () => {
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
      const title = JSON.parse(response.getBody()).name;

      response = request('POST', `https://${domain}/index.php?/api/v2/add_run/${projectId}`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${auth}`,
        },
        json: {
          name: `${title}: Automated Test Run`,
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
    });

    emitter.on('assertion', (err, args) => {
      const testCaseRegex = /\bC(\d+)\b/;
      const matches = args.assertion.match(testCaseRegex);
      if (matches) {
        results.push({
          case_id: matches[1],
          status_id: (err) ? 5 : 1,
        });
      }
    });
  }
}

module.exports = TestRailReporter;
