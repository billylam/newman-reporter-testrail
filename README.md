# newman-reporter-testrail

Improved TestRail reporter for Newman with test cases filtering capability, based on the original https://github.com/billylam/newman-reporter-testrail.

## Installation

```
npm install git+https://github.com/nagornyi/newman-reporter-testrail.git -g
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
* TESTRAIL_TYPE (optional)
Type of test cases to add to the test run.

You can use [direnv](https://github.com/direnv/direnv) to easily maintain directory-specific options.

You may also set some or all of these variables using bash exports.

### Run newman with the reporter option
```
-r testrail
```

Example:

```
TESTRAIL_DOMAIN="mycompany.testrail.net"
TESTRAIL_USERNAME="me@mycompany.com"
TESTRAIL_APIKEY="myapikey"
TESTRAIL_PROJECTID="1"
TESTRAIL_TITLE="Dev-API Regression"
TESTRAIL_TYPE="Automated"
newman run my-collection.postman_collection.json -r testrail,cli --bail
```
