function getEnv() {
  const env = {};
  env.domain = process.env.TESTRAIL_DOMAIN;
  env.username = process.env.TESTRAIL_USERNAME;
  env.apikey = process.env.TESTRAIL_APIKEY;
  env.projectId = process.env.TESTRAIL_PROJECTID;
  env.suiteId = process.env.TESTRAIL_SUITEID;
  env.version = process.env.TESTRAIL_VERSION;
  env.runId = process.env.TESTRAIL_RUNID;
  env.title = process.env.TESTRAIL_TITLE;
  env.refs = process.env.TESTRAIL_REFS;
  env.milestoneId = process.env.TESTRAIL_MILESTONEID;
  env.testPlanId = process.env.TESTRAIL_PLANID;
  env.closeRun = process.env.TESTRAIL_CLOSE_RUN || 'false';
  env.includeAll = process.env.TESTRAIL_INCLUDEALL || 'true';
  env.steps = process.env.TESTRAIL_STEPS || 'false';
  env.logging = process.env.TESTRAIL_LOGGING || 'full';
  env.pass_id = process.env.TESTRAIL_PASSED_ID || 1;
  env.fail_id = process.env.TESTRAIL_FAILED_ID || 5;
  env.skipped_id = process.env.TESTRAIL_SKIPPED_ID || 4;
  env.useTitles = process.env.TESTRAIL_TITLE_MATCHING || 'false';
  env.betaApi = process.env.TESTRAIL_BETA_API || 'false';
  env.stepResultKey = `custom_${
    process.env.TESTRAIL_STEPRESULT_KEY || 'step_results'
  }`;
  env.customKeys = Object.keys(process.env).filter((key) =>
    key.startsWith('TESTRAIL_CUSTOM'),
  );
  return env;
}

module.exports = getEnv();
