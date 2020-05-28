module.exports = function generateJson({
  caseNumbers = 'C01', error = false, skipped = false, tldOnly = false,
} = {}) {
  const json = {
    cursor: {},
    item: {
      id: '',
      name: 'Test',
      request: {
        url: {
          host: [
            'www',
            'test',
            'com',
          ],
          query: [],
          variable: [],
        },
        headers: [
          {
            key: 'Content-Type',
            value: 'application/json',
          },
        ],
        method: 'GET',
      },
      response: [],
      event: [
        {
          listen: 'test',
          script: {
            id: '0c4a8e66-51c0-4066-a94c-8f33c518e8b8',
            type: 'text/javascript',
            exec: [
              `pm.test(${caseNumbers}+ " Status code is 400", function () {`,
              '    pm.response.to.have.status(400);',
              '});',
              '',
            ],
            _lastExecutionId: '4fa3a7a9-284d-4c75-b659-92ee637e3aac',
          },
        },
      ],
    },
    request: {
      url: {
        protocol: 'https',
        host: [
          'www',
          'test',
          'com',
        ],
        query: [],
        variable: [],
      },
      headers: [
        {
          key: 'Content-Type',
          value: 'application/json',
        },
      ],
      method: 'GET',
    },
    response: {
      id: '9683db0d-9e48-4503-afe6-c745fa6f068c',
      status: 'Bad Request',
      code: 400,
      headers: [
        {
          key: 'Connection',
          value: 'close',
        },
      ],
      stream: {
        type: 'Buffer',
        data: [
          10,
        ],
      },
    },
    id: '59395a21-ad0a-4baf-b452-beddb3d471a4',
    assertions: [
      {
        assertion: `${caseNumbers} Status code is 400`,
        skipped,
      },
    ],
  };
  if (error) {
    json.assertions[0].error = {
      name: 'AssertionError',
      index: 0,
      test: `${caseNumbers} Status code is 400`,
      message: 'expected response to have status code 400 but got 200',
      stack: 'AssertionError: expected response to have status code 400 but got 200\n   at Object.eval sandbox-script.js:1:10)',
    };
  }

  if (!tldOnly) {
    json.item.request.url.path =
      [
        'test',
        'v1',
      ];
    json.request.url.path =
      [
        'test',
        'v1',
      ];
  }

  return [json];
};
