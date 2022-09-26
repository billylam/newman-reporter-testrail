### 1.0.51 (2021-09-25)
* Merge PR to support refs
### 1.0.50 (2021-08-15)
* Merge PR to support plans
### 1.0.49 (2021-04-29)
* Merge PR to propagate test ids from parent name to child assertions when title matching is true.
### 1.0.48 (2021-03-22)
* Fix bug (closing runs due to falsiness check).
### 1.0.47 (2021-03-18)
* Merge PR for close run option.
### 1.0.46 (2021-02-23)
* Merge PRs for beta header, matching via request name.
### 1.0.45 (2021-02-01)
* Always add test case name in comments.
### 1.0.44 (2021-01-06)
* Fix bug with "latest" runId option.
### 1.0.43 (2021-12-26)
* Merge PR to fix an issue that caused excess api calls in large suites.  Also update some dev dependencies for security update.
### 1.0.42 (2021-11-30)
* Initial support for case name matching instead as alternative to ids.
### 1.0.41 (2021-08-18)
* Merge PR for custom step field names.
### 1.0.40 (2021-08-13)
* Initial support for test steps.
### 1.0.39 (2021-07-24)
* Log non-raw request POST bodies.  Also remove VERBOSE flag.
### 1.0.38 (2021-07-08)
* Merge PR for custom pass, fail, skip statuses
### 1.0.37 (2021-07-08)
* Dependency update
### 1.0.36 (2021-05-11)
* Bugfix - "none" logging option no longer logs error messages or test assertions
### 1.0.35 (2021-05-11)
* Dependency update
### 1.0.34 (2021-04-12)
* Change logging options to add a zero logging option.
### 1.0.33 (2021-03-31)
* Merge PR for security update.
### 1.0.32 (2021-03-26)
* Add a verbose flag for request/response logging.
### 1.0.31 (2021-03-19)
* Move dayjs to dependencies.
### 1.0.30 (2021-03-17)
* Merge PR for date time in default test run titles.

### 1.0.29 (2020-08-25)
* Merge PR for milestone id option.

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
