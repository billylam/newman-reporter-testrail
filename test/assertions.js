/* eslint-disable no-undef */
/* eslint-disable prefer-arrow-callback */
/* eslint-disable func-names */
const { assert } = require('chai');
const TestrailReporter = require('../lib/TestrailReporter');

describe('Test assertions', function () {
  it('Should handle a test case', function () {
    const reporter = new TestrailReporter({ on: () => null });
    reporter.handleTests(null, {
      assertion: 'C01 Status code is 200',
      skipped: false,
      error: null,
      item: {
        id: '7fea4c93-df98-4aab-a3bd-bec4f0671aec',
        name: 'Test case 01',
        request: {
          url: {
            protocol: 'https',
            host: [
              'www',
              'google',
              'com',
            ],
            query: [],
            variable: [],
          },
          method: 'GET',
        },
        response: [],
      },
    });
    assert.lengthOf(reporter.results, 1);
    assert.equal(reporter.results[0].case_id, '01');
    assert.equal(reporter.results[0].status_id, 1);
  });

  it('Should handle multiple mapped test cases', function () {
    const reporter = new TestrailReporter({ on: () => null });
    reporter.handleTests(null, {
      assertion: 'C01 C02 Status code is 200',
      skipped: false,
      error: null,
      item: {
        id: '7fea4c93-df98-4aab-a3bd-bec4f0671aec',
        name: 'Test case 01',
        request: {
          url: {
            protocol: 'https',
            host: [
              'www',
              'google',
              'com',
            ],
            query: [],
            variable: [],
          },
          method: 'GET',
        },
        response: [],
      },
    });
    assert.lengthOf(reporter.results, 2);
    assert.equal(reporter.results[0].case_id, '01');
    assert.equal(reporter.results[0].status_id, 1);
    assert.equal(reporter.results[1].case_id, '02');
    assert.equal(reporter.results[1].status_id, 1);
  });

  it('Should handle two test cases', function () {
    const reporter = new TestrailReporter({ on: () => null });
    reporter.handleTests(null, {
      assertion: 'C01 Status code is 200',
      skipped: false,
      error: null,
      item: {
        id: '7fea4c93-df98-4aab-a3bd-bec4f0671aec',
        name: 'Test case 01',
        request: {
          url: {
            protocol: 'https',
            host: [
              'www',
              'google',
              'com',
            ],
            query: [],
            variable: [],
          },
          method: 'GET',
        },
        response: [],
      },
    });
    reporter.handleTests(null, {
      assertion: 'C02 Status code is 200',
      skipped: false,
      error: null,
      item: {
        id: '7fea4c93-df98-4aab-a3bd-bec4f0671aec',
        name: 'Test case 02',
        request: {
          url: {
            path: [
              'test',
              'v1',
            ],
            protocol: 'https',
            host: [
              'www',
              'google',
              'com',
            ],
            query: [],
            variable: [],
          },
          method: 'GET',
        },
        response: [],
      },
    });
    assert.lengthOf(reporter.results, 2);
    assert.equal(reporter.results[0].case_id, '01');
    assert.equal(reporter.results[0].status_id, 1);
    assert.equal(reporter.results[1].case_id, '02');
    assert.equal(reporter.results[1].status_id, 1);
  });

  it('Should handle a failure', function () {
    const reporter = new TestrailReporter({ on: () => null });
    reporter.handleTests({
      name: 'AssertionError',
      message: 'expected { Object (id, _details, ...) } to have property \'code\'',
      showDiff: false,
      actual: {
        id: 'd9a84783-2643-4573-8680-8be4f91909ce',
        header: [],
        cookie: [],
      },
      stack: 'AssertionError: some test failed',
    }, {
      assertion: 'C01 Status code is 500',
      skipped: false,
      error: {
        name: 'AssertionError',
        message: 'expected { Object (id, _details, ...) } to have property \'code\'',
        showDiff: false,
        actual: {
          id: 'd9a84783-2643-4573-8680-8be4f91909ce',
          header: [],
          cookie: [],
        },
        stack: 'AssertionError: some test failed',
      },
      item: {
        id: '7fea4c93-df98-4aab-a3bd-bec4f0671aec',
        name: 'Failed case',
        request: {
          url: {
            path: [
              'test',
              'v1',
            ],
            protocol: 'https',
            host: [
              'www',
              'google',
              'com',
            ],
            query: [],
            variable: [],
          },
          method: 'GET',
        },
        response: [],
      },
    });
    assert.lengthOf(reporter.results, 1);
    assert.equal(reporter.results[0].case_id, '01');
    assert.equal(reporter.results[0].status_id, 5);
  });

  it('Should handle a skip', function () {
    const reporter = new TestrailReporter({ on: () => null });
    reporter.handleTests(null, {
      assertion: 'C01 Status code is 500',
      skipped: true,
      error: null,
      item: {
        id: '7fea4c93-df98-4aab-a3bd-bec4f0671aec',
        name: 'Failed case',
        request: {
          url: {
            path: [
              'test',
              'v1',
            ],
            protocol: 'https',
            host: [
              'www',
              'google',
              'com',
            ],
            query: [],
            variable: [],
          },
          method: 'GET',
        },
        response: [],
      },
    });
    assert.lengthOf(reporter.results, 1);
    assert.equal(reporter.results[0].case_id, '01');
    assert.equal(reporter.results[0].status_id, 4);
  });

  it('Should work on tld with no path', function () {
    const reporter = new TestrailReporter({ on: () => null });
    reporter.handleTests({
      name: 'AssertionError',
      message: 'expected { Object (id, _details, ...) } to have property \'code\'',
      showDiff: false,
      actual: {
        id: 'd9a84783-2643-4573-8680-8be4f91909ce',
        header: [],
        cookie: [],
      },
      stack: 'AssertionError: some test failed',
    }, {
      assertion: 'C01 Status code is 500',
      skipped: false,
      error: {
        name: 'AssertionError',
        message: 'expected { Object (id, _details, ...) } to have property \'code\'',
        showDiff: false,
        actual: {
          id: 'd9a84783-2643-4573-8680-8be4f91909ce',
          header: [],
          cookie: [],
        },
        stack: 'AssertionError: some test failed',
      },
      item: {
        id: '7fea4c93-df98-4aab-a3bd-bec4f0671aec',
        name: 'Failed case',
        request: {
          url: {
            protocol: 'https',
            host: [
              'www',
              'google',
              'com',
            ],
            query: [],
            variable: [],
          },
          method: 'GET',
        },
        response: [],
      },
    });
    assert.lengthOf(reporter.results, 1);
    assert.equal(reporter.results[0].case_id, '01');
    assert.equal(reporter.results[0].status_id, 5);
  });


  it('Should skip an unmarked case', function () {
    const reporter = new TestrailReporter({ on: () => null });
    reporter.handleTests({
      name: 'AssertionError',
      message: 'expected { Object (id, _details, ...) } to have property \'code\'',
      showDiff: false,
      actual: {
        id: 'd9a84783-2643-4573-8680-8be4f91909ce',
        header: [],
        cookie: [],
      },
      stack: 'AssertionError: some test failed',
    }, {
      assertion: 'Status code is 500',
      skipped: false,
      error: {
        name: 'AssertionError',
        message: 'expected { Object (id, _details, ...) } to have property \'code\'',
        showDiff: false,
        actual: {
          id: 'd9a84783-2643-4573-8680-8be4f91909ce',
          header: [],
          cookie: [],
        },
        stack: 'AssertionError: some test failed',
      },
      item: {
        id: '7fea4c93-df98-4aab-a3bd-bec4f0671aec',
        name: 'Failed case',
        request: {
          url: {
            protocol: 'https',
            host: [
              'www',
              'google',
              'com',
            ],
            query: [],
            variable: [],
          },
          method: 'GET',
        },
        response: [],
      },
    });
    assert.lengthOf(reporter.results, 0);
  });
});
