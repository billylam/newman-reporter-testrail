# newman-reporter-testrail

TestRail reporter for Newman.

## Installation

```
npm install newman-reporter-testrail --global
```

## Usage

### Prefix all test assertions you wish to map with the test number.
Include the letter C. You may map more than one test case to an assertion.
```
pm.test("C226750 C226746 Status code is 200", function () {
    pm.response.to.have.status(200);
});
```

### Export the following environment variables.

* TESTRAIL_DOMAIN
TestRail domain.  Do not include protocol.
* TESTRAIL_USERNAME
TestRail username / email.
* TESTRAIL_APIKEY
TestRail [API key](http://docs.gurock.com/testrail-api2/accessing#username_and_api_key).
* TESTRAIL_PROJECTID
TestRail project id.
* TESTRAIL_SUITEID (optional)
TestRail suite id.  Mandatory in multi-suite projects.  Do not use in single-suite projects. 
* TESTRAIL_TITLE (optional)
Title of test run to create.

You can use [direnv](https://github.com/direnv/direnv) to easily maintain directory-specific options.

You may also set some or all of these variables using bash exports.

### Run newman with the reporter option
```
-r testrail
```

Example:

```
TESTRAIL_TITLE='Dev API Tests Automation' newman run my-collection.postman_collection.json -e dev-environment.postman_environment.json -d dev-data.csv -r testrail,cli
```