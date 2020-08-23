### 1.0.28 (2020-08-23)
* Deduplicate logging in cases where same request has duplicate test cases

### 1.0.27 (2020-08-22)
* Log test case and request even if DNS error occurs

### 1.0.26 (2020-08-06)
* Pass user agent on testrail requests

### 1.0.25 (2020-07-16)
* Dependency update

### 1.0.24 (2020-06-26)
* Trim response body logging if response body exceeds 1 mb.

### 1.0.23 (2020-06-01)
* Fix query strings

### 1.0.22 (2020-05-28)
* Better duplicate test case handling.  Minor refactoring.

### 1.0.21 (2020-05-21)
* Human readable request and response headers in TestRail comment

### 1.0.20 (2020-05-20)
* Add error message, if any, to TestRail comment

### 1.0.19 (2020-04-13)
* Allow TESTRAIL_INCLUDEALL option

### 1.0.18 (2020-04-11)
* Pass in seconds instead of ms until TestRail properly supports ms

### 1.0.17 (2020-04-11)
* Fix DNS error issues

### 1.0.16 (2020-03-18)
* Fix minimist vulnerability (https://npmjs.com/advisories/1179)

### 1.0.15 (2020-03-18)
* Allow fixed custom params on command line

### 1.0.14 (2020-01-30)
* Allow optional VERSION field

### 1.0.13 (2020-01-30)
* Pass elapsed times, response headers

### 1.0.12 (2020-01-15)
* Fix comments/logging

### 1.0.11 (2020-01-13)
* Fix a bug when testing a top level domain

### 1.0.10 (2020-01-12)
* Better comments, support for pm.test.skip

### 1.0.9 (2019-07-16)
* Option to update old runs instead of creating new runs

### 1.0.8 (2019-07-15)
* Update out-of-date dependencies

### 1.0.7 (2018-07-11)
* Add support for duplicate test numbers

### 1.0.6 (2018-04-29)
* README.md update

### 1.0.5 (2018-04-29)
* Specify test titles with environment variable

### 1.0.4 (2018-04-24)
* Add support for mapping multiple tests to one assertion

### 1.0.3 (2018-04-16)
* README.md and linter update

### 1.0.2 (2018-04-03)
* Fix console error logging bug

### 1.0.1 (2018-03-30)
* Fix error checking responses

### 1.0.0 (2018-03-30)
* Initial commit
