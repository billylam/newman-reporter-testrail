# newman-reporter-testrail

TestRail reporter for Newman.

## Installation

```
npm install newman-reporter-testrail --global
```

## Usage

### Prefix all test assertions you wish to map with the test number.
```
pm.test("C226750 Status code is 200", function () {
    pm.response.to.have.status(200);
});
```
### Export the following environment variables.

It is recommended you use [direnv](https://github.com/direnv/direnv) to easily maintain directory-specific options.

* TESTRAIL_DOMAIN
TestRail domain.  Do not include protocol.
* TESTRAIL_USERNAME
TestRail username / email.
* TESTRAIL_APIKEY
TestRail [API key](http://docs.gurock.com/testrail-api2/accessing#username_and_api_key).
* TESTRAIL_PROJECTID
TestRail project id.
* TESTRAIL_SUITEID (optional)
TestRail suite id.  Mandatory in multi-suite projects, but optional in single-suite projects. 

### Run newman with the reporter option
```
-r testrail
```