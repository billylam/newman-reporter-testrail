/* eslint-disable no-undef */
/* eslint-disable prefer-arrow-callback */
/* eslint-disable func-names */
const { assert } = require('chai');
const TestrailReporter = require('../lib/TestrailReporter');
const generateJson = require('./lib');

// Note these tests need to be refactored after main lib was refactored
describe('Test assertions', function () {
  it('Should handle a test case', function () {
    const reporter = new TestrailReporter({ on: () => null });
    reporter.handleTests(generateJson());
    assert.lengthOf(reporter.results, 1);
    assert.equal(reporter.results[0].case_id, '01');
    assert.equal(reporter.results[0].status_id, 1);
  });

  it('Should handle multiple mapped test cases', function () {
    const reporter = new TestrailReporter({ on: () => null });
    reporter.handleTests(generateJson({ caseNumbers: 'C01 C02' }));
    assert.lengthOf(reporter.results, 2);
    assert.equal(reporter.results[0].case_id, '01');
    assert.equal(reporter.results[0].status_id, 1);
    assert.equal(reporter.results[1].case_id, '02');
    assert.equal(reporter.results[1].status_id, 1);
  });

  it('Should handle two test cases', function () {
    const reporter = new TestrailReporter({ on: () => null });
    reporter.handleTests(
      generateJson().concat(generateJson({ caseNumbers: 'C02' })),
    );
    assert.lengthOf(reporter.results, 2);
    assert.equal(reporter.results[0].case_id, '01');
    assert.equal(reporter.results[0].status_id, 1);
    assert.equal(reporter.results[1].case_id, '02');
    assert.equal(reporter.results[1].status_id, 1);
  });

  it('Should handle a failure', function () {
    const reporter = new TestrailReporter({ on: () => null });
    reporter.handleTests(generateJson({ error: true }));
    assert.lengthOf(reporter.results, 1);
    assert.equal(reporter.results[0].case_id, '01');
    assert.equal(reporter.results[0].status_id, 5);
  });

  it('Should handle a skip', function () {
    const reporter = new TestrailReporter({ on: () => null });
    reporter.handleTests(generateJson({ skipped: true }));
    assert.lengthOf(reporter.results, 1);
    assert.equal(reporter.results[0].case_id, '01');
    assert.equal(reporter.results[0].status_id, 4);
  });

  it('Should work on tld with no path', function () {
    const reporter = new TestrailReporter({ on: () => null });
    reporter.handleTests(generateJson({ tldOnly: true }));
    assert.lengthOf(reporter.results, 1);
    assert.equal(reporter.results[0].case_id, '01');
    assert.equal(reporter.results[0].status_id, 1);
  });

  it('Should skip an unmarked case', function () {
    const reporter = new TestrailReporter({ on: () => null });
    reporter.handleTests(generateJson({ caseNumbers: '' }));
    assert.lengthOf(reporter.results, 0);
  });

  it('Should parse custom keys', function () {
    process.env.TESTRAIL_CUSTOM_customenvvar = '123';
    const reporter = new TestrailReporter({ on: () => null });
    reporter.handleTests(generateJson());
    assert.equal(reporter.results[0].customenvvar, '123');
  });
});
