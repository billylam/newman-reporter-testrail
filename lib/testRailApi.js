const request = require('sync-request');
const dayjs = require('dayjs');
const environment = require('./environment');

class TestRailApi {
  constructor() {
    this.env = environment;
    this.auth = Buffer.from(`${this.env.username}:${this.env.apikey}`).toString(
      'base64',
    );
    this.headers = {
      'User-Agent': 'newman-reporter-testrail',
      'Content-Type': 'application/json',
      Authorization: `Basic ${this.auth}`,
    };
  }

  getProjectInfo() {
    const path = this.env.suiteId
      ? `get_suite/${this.env.suiteId}`
      : `get_project/${this.env.projectId}`;

    return this.get(path);
  }

  getRuns() {
    return this.get(`get_runs/${this.env.projectId}`);
  }

  getRun(runId) {
    return this.get(`get_run/${runId}`);
  }

  addRun(title, results) {
    const json = {
      name: title,
      suite_id: this.env.suiteId,
      milestone_id: this.env.milestoneId,
    };
    if (
      this.env.includeAll !== undefined &&
      this.env.includeAll.toLowerCase() === 'false'
    ) {
      json.include_all = false;
      json.case_ids = results.map((result) => result.case_id);
    }
    return this.post(`add_run/${this.env.projectId}`, json);
  }

  addResults(runId, results) {
    return this.post(`add_results_for_cases/${runId}`, { results });
  }

  get(path) {
    const response = request(
      'GET',
      `https://${this.env.domain}/index.php?/api/v2/${path}`,
      { headers: this.headers },
    );
    if (response.statusCode >= 300) console.error(response.getBody());
    return response;
  }

  post(path, json) {
    const response = request(
      'POST',
      `https://${this.env.domain}/index.php?/api/v2/${path}`,
      {
        headers: this.headers,
        json,
      },
    );
    if (response.statusCode >= 300) console.error(response.getBody());
    return response;
  }
}

module.exports = TestRailApi;
