const environment = require('./environment');

class Logger {
  getLogging(execution) {
    this.env = environment;
    const log = { url: '', request: '', response: '' };

    const urlObject = execution.request.url;
    let url = `${urlObject.protocol}://${urlObject.host.join('.')}${
      urlObject.path ? `/${urlObject.path.join('/')}` : ''
    }`;
    if (urlObject.query.members && urlObject.query.members.length) {
      const queryString = `?${urlObject.query.members
        .map((param) => `${param.key}=${param.value}`)
        .join('&')}`;
      url = url.concat(queryString);
    }
    log.url = `Request: ${execution.request.method} ${url}`;

    if (this.env.logging.toLowerCase() === 'none') return log;

    let requestLogging = `Headers:\n${execution.request.headers
      .map((header) => `${header.key}: ${header.value}`)
      .join('\n')}`;

    if (this.env.logging.toLowerCase() === 'headers') {
      log.request = requestLogging;
      return log;
    }

    if (execution.request.body) {
      requestLogging = requestLogging.concat(
        `\nBody: ${execution.request.body}`,
      );
    }
    log.request = requestLogging;

    let responseLogging = '';
    if (execution.response) {
      responseLogging = `\n\nResponse: ${execution.response.code} ${
        execution.response.status
      }\nHeaders:\n${execution.response.headers
        .map((header) => `${header.key}: ${header.value}`)
        .join('\n')}`;

      if (execution.response.stream) {
        const responseBody = Buffer.from(execution.response.stream).toString();
        if (responseBody.length < 1048576) {
          responseLogging = responseLogging.concat(`\nBody: ${responseBody}`);
        } else {
          responseLogging = responseLogging.concat(
            `\n\nResponse body exceeds 1 mb.\nTrimmed response body: ${responseBody.substr(
              0,
              1048576 / 2,
            )}`,
          );
        }
      }
    } else if (execution.requestError) {
      responseLogging = `\n\nA request error has occurred.\n${JSON.stringify(
        execution.requestError,
        null,
        2,
      )}`;
    }
    log.response = responseLogging;
    return log;
  }
}
module.exports = Logger;
