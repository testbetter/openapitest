# Openapitest Framework

The purpose of this openapitest framework is to simplify authoring, organizing, executing, and reporting result of API tests using API specification. It runs on node.js and distributed via npm. Add this module to your node.js project as a development dependency and start writing API or Integration tests using YAML language.


[![Build Status](https://travis-ci.org/testbetter/openapitest.svg?branch=master)](https://travis-ci.org/testbetter/openapitest)

### Installation
----
```npm install --save-dev openapitest```

### Writing tests for your project
----
See below example for one of several ways tests can be added and organized.
The `test-integration` folder is where all YAML test suites name with `.spec.yaml`, relevant resources like shared and test specific data are organized into sub-folders. The `shared-data` folder is optional, used only to store common configuration and test data that are used by more than one test suites. Test-suite specific data are stored next to test spec file. The test data file can be `.data.js` or `.data.yaml`. 

```
ProjectCoolThing
├─ test-integration
   ├─ config
   |   ├─ common.config.js
   |   └─ testenvironment.config.yaml
   ├─ data
   |   ├─ testusers.data.js
   |   └─ testenvironment.data.yaml
   └─ test-suites
       ├─ cool-features-group1
       |   ├─ coolTest1.spec.yaml
       |   ├─ coolTest1.data.yaml
       |   ├─ coolTest2.spec.yaml
       |   ├─ coolTest2.data.js
       ├─ cool-features-group2
           ├─ coolTestg2.spec.yml
           └─ coolTestg2.data.yaml
           
├─ test-unit
├─ test-e2e
├─ server
├─ api-spec
├─ README.md
├─ package.json
├─ .gitignore
├─ ...
```

### Executing tests
----
npm script can be added to execute all tests, or different suite of tests to the `package.json`:
``` 
"test-int": "openapitest -o api-spec/pct-api.json -t test-integration -s test-integration/shared-data -u  https://localhost:9000"

```
Run the tests by calling : `npm run test-int `.
The test results are are saved to the root directory by default.

**More Help:**
```sh
openapitest --help

Options:
  -V, --version            Output the version number
  -o, --openapi  [path]    Open API relative/ absolute path. e.g: <path>/openapi.json
  -t, --testDir  [path]    Test folder relative/ absolute path.  e.g: <path>/test-spec
  -d, --dataDir  [path]    Test data folder. Defaults to a folder called "data" that is a sibling to the test-suites folder
  -s, --sharedir [path]    Shared Test data folder relative/ absolute path.  e.g: <path>/share_data
  -c, --dataConfig [path]  Common Test data config folder relative/ absolute path.  e.g: <path>/config
  -g, --globalConfig [path]  Global Test data config folder relative/ absolute path.  e.g: <path>/global-config
  -u, --url [url]          Server URL. e.g: http://localhost:9000
  -r, --report <n>         Will generate the html report or not. Default 0; e.g: 1 or 0
  -p, --proxy [proxy]      The Proxy URL, e.g: http://127.0.0.1:8080
  -a, --tag [tag]          Comma seperated tags to run the test, leave empty to run all
  -h, --help               output usage information
```

<br />

# Documentation
### File naming convention:
--- 
**Test spec file name:** should be ending with `.spec.yaml`. 

Example: `user.spec.yaml`

**Test data file name:** should be ending with `.data.yaml` or `.data.js`. 

Example: `login.data.yaml`

### Config priority:
---
We have 3 types of config support here:
* **Config:** This one will stay inside the test folder. If we have same config name, framework will take this value as first priority. 
* **Data Config:** This one will stay outside of test folder. If we have same config name, framework will take this value as second priority.
* **Global Config:** Any where.  If we have same config name, framework will take this value as last priority.

### Tags:
----
* [apiCalls](#apiCalls)
	* [name](#suiteName)
	* [swagger](#swagger)
		* [name](#endpointName)
		* [call](#call)
		* [parameters](#parameters)
		* [header](#header)
		* [query](#query)		
		* [data](#data)
			* [$file](#dataFile)
		* [basicAuth](#basicAuth)
			* [$file](#basicAuthFile)
		* [conditions](#conditions)
		* [save](#save)
		* [print](#print)
		* [only](#only)
		* [skip](#skip)
		* [repeat](#repeat)
		* [before](#before)
		* [after](#after)
		* [expect](#expect)
			* [json](#expect)
			* [headers](#expect)
			* [status](#expect)
			* [error](#expect)
* [tests](#tests)
	* [name](#testsName)
	* [expects](#expects)

----
## <a name='apiCalls'>`apiCalls`</a>

The purpose of `apiCalls` is to call endpoint and return response. Under the `apiCalls`, we can use two tag such as `name` and `swagger`. 

#### <a name='suiteName'>`name:` </a>
The value of the `name` tag will be test suite name. Example:

```sh
name: testing user services
```
<br />


## <a name='swagger'>`Swagger:`</a>
The purpose of `swagger` is to call all endpoints one by one and return response of the endpoint. Supported tags: `name`, `call`, `header`, `query`, `data`, `basicAuth`, `save` and `expect`
<br />

**<a name='endpointName'>`name:` </a>** 
The value of the `name` tag will be endpoint name. Example:
```sh
name: calling login endpoint - expecting success
```
<br />

**<a name='call'>`call:`</a>** 
The keys of the call can be `operationId` of the endpoint. We can find endpoints with `operationId` in `openapi.json` (openapi specification file). Example:
```sh
call: post_users_login
```
<br />


**<a name='parameters'>`parameters:`</a>** 
We can define parameter under the `parameters` tag. There is no file support here. Example:
```sh
parameters: 	
    userId: 123456
    otherId: ${otherId}
    other: $config.common.other
```
<br />


**<a name='header'>`header:`</a>**
If we need to send any header information during the endpoint call, we can define under the `header` tag. There is no file support here. Example:
```sh
header:
  Accept: application/json
  Authorization: Bearer sessionToken
  other: $config.common.other
```
<br />

**<a name='query'>`query:`</a>**
We can define query/ get value under `query` tag. There is no file support here. Example:
```sh
query:
  id: 1212
  otherId: 1234
  other: $config.common.other
```
<br />

**<a name='data'>`data:`</a>**
`data` is responsible to send request data or form data to endpoint. Value of the data can be 2 types like as `key-value` pair and `file` base. We can create 2 types of file with `.yaml` and `.js` extension.

**`key-value pair example:`**
```sh
data:
  email: test@localhost.com
  password: "123"
  other: $config.common.other
```
**<a name='dataFile'>`file example:`**</a>
```sh
data:
   $file: login
```
**`YAML base:`** `example: login.data.yaml`
```sh
email: test@localhost.com
password: "123"
```
**`JS base:`** `example: login.data.js`
```sh
module.exports = {
  "email": "test@localhost.com",
  "password": "123"
}
```
<br />

**<a name='basicAuth'>`basicAuth:`</a>**
We can define the basic auth information here. We can set basic auth with 2 format such as `key-value` pair and `file` same as `data` tag.
 
**`key-value pair example:`**
```sh
basicAuth:
   email: test@localhost.com
   password: "123"
   other: $config.common.other
```

**<a name='basicAuthFile'>`file example:`</a>**
```sh
basicAuth:
   $file: basicAuth
```

**`YAML base:`** `example: basicAuth.data.yaml`
```sh
basicAuth:
   email: test@localhost.com
   password: "123"
```

**`JS base:`** `example: basicAuth.data.js`
```sh
module.exports = {
  "email": "test@localhost.com",
  "password": "123"
}
```
<br />

**<a name='conditions'>`conditions:`</a>**
If we want to give any condition for response/ result value then we can do that by using `conditions` tag. Example:
```sh
conditions:
  util: 
    expect:
      json:
        - status: to.be.eql complete
      headers:
        - server: to.be.eql nginx 
      interval: 5000
      limit: 10    
```
Here we added `until` condition. This endpoint will be called until `status` is `complete` and `server` is `nginx`. We can set condition for json response and headers.

`limit`: Failure limit, representing the maximum number of falsey returns from result or response that will be permitted before invocation is deemed to have failed. A negative number indicates that the attempt should never fail, instead continuing for as long as result or response have returned truthy values.

`interval`: The retry interval, in milliseconds. A negative number indicates that each subsequent retry should wait for twice the interval from the preceding iteration (i.e. exponential backoff). The default value is -1000, signifying that the initial retry interval should be one second and that each subsequent attempt should wait for double the length of the previous interval.

<br />

**<a name='print'>`print:`</a>**
If we want to print the response or error then we can do that by using `print` tag. Example:
```sh
print: 1
```
<br />

**<a name='only'>`only:`</a>**
If you want to run only a subset of tests by using `only` tag. Example:
```sh
only: true
```
<br />

**<a name='skip'>`skip:`</a>**
If you want to skip one or more tests, use the `skip` Example:
```sh
skip: true
```
<br />

**<a name='repeat'>`repeat:`</a>**
If you want to run a test more than once without repeating the all test data you can use the `repeat` Example:
```sh
repeat: 10 
```
In the case above the same test would be repeated 10 times

<br />

**<a name='before'>`before:`</a>**
With its default "BDD"-style interface, openapitest, provides the hooks before, these should be used to set up preconditions or debug before your tests.
```js
/**
*
* @param testData holds all the test data you can use in before code
* @param {expect} testData.expect chaijs expect API e.g: `expec(true).to.be.equal(false);//Will fail`, for full documentation see `https://www.chaijs.com/api/bdd/
* @param {array[Spec]} testData.specs array of specs in the running suite e.g: `[ [ { name: 'Login - success', only: false, save: [Object] },...]`, can be used to modify other tests behavior
* @param {object} testData.op operation definition comming from open api spec file, e.g: `{ tags: [ 'User' ], summary: 'login', requestBody: {...} responses: {...}'
* @param {object|undefined} testData.body the request body to be sent, in get request it may be undefined
* @param testData.basicAuth auth information to be used in the auth header
* 
*/
before: !!js/function "function(testData){  /** runs before the test */;   }"
```
<br />

**<a name='after'>`after:`</a>**
With its default "BDD"-style interface, openapitest, provides the hooks after, these should be used to clean up after your tests or doing custum expecs that the openapitest APi does not provide.
```js
/**
*
* @param testData holds all the test data you can use in after code
* @param {expect} testData.expect chaijs expect API e.g: `expec(true).to.be.equal(false);//Will fail`, for full documentation see `https://www.chaijs.com/api/bdd/
* @param {array[Spec]} testData.specs array of specs in the running suite e.g: `[ [ { name: 'Login - success', only: false, save: [Object] },...]`, can be used to modify other tests behavior
* @param {object} testData.op operation definition comming from open api spec file, e.g: `{ tags: [ 'User' ], summary: 'login', requestBody: {...} responses: {...}'
* @param {object|undefined} testData.body the request body to be sent, in get request it may be undefined
* @param {object} testData.basicAuth auth information to be used in the auth header
* @param {SuperagentResponse} testData.res server response to full documentation check `http://visionmedia.github.io/superagent/#response-properties`. If get the error, testData.res value will be empty object
* @param {object} testData.error error object. For successful response, error value will be empty object and other case will get error object
*
*/
after: !!js/function "function(testData){  /** runs after the test */;   }"
```
<br />


**<a name='save'>`save:`</a>**
After calling the endpoint, If we want to save response for next endpoint or for assert the test then we can do that by set under `save` tag. The response type can be `text` or `json`. Example: Saving session token
```sh
save:
   sessionToken: json.sessionToken
   other: $config.common.other
```

Example: Returning full response
```ah
save:
   userResponse: json
```

We can save value from file as well. Example: save `username` from `basicAuth` file. From `config` folder. File name will be `common.config.(js/yaml)`
```sh
save:
   username: $file.basicAuth.email
   other: $config.common.other
```
We can parse any value from response using `regular expression`.

`Format:`
```sh
<which.response.value.want.to.parse>: <$regex regularExpression>
```
Example: parsing user id from url: `http://host:port/users/12345`
```sh
save:
   userId: 
      json.user.url: $regex ([a-z\d]+)$
```
<br />

**<a name='expect'>`expect:`</a>**
We can do some assertion test here like `status`, `response`, `headers` and `error` text. To test response, we do under `json`/ `text` tag and for headers, we do under `headers` tag and to test status, we use `status` tag. Status's value can be list or single value.

`Format:`
```sh
<response.value (actual value)>: <operator> <expected value>
```
Here `<operator>` is optional. If we do not provide `<operator>` then default `<operator>` will be `equal`. Example:
```sh
expect:
  json:
    - user: to.be.an object
    - user: to.have.key _id
    - sessionToken: to.contain session
  headers:
    - content-type: application/json; charset=utf-8
    - x-powered-by: Express
  status:
    - 200
    - 201
  error: Forbidden
```
or
```
expect:
  status: 200
```
<br />

**`Example of swagger section: more than one endpoint:`**
```sh
swagger:
- name: Calling login endpoint - expecting success
  call: post_users_login
  data:
    $file: login
  header:
    Accept: application/json
  save:
    sessionToken: json.sessionToken
  expect:
    json:
      - user: to.be.an object
      - user: to.have.key _id
      - sessionToken: to.contain session:
    headers:
      - content-type: application/json; charset=utf-8
      - x-powered-by: Express
    status: 200
    
- name: call demployment post endpoint - expecting success      
- call: post_company
  header:
    Accept: application/json
    Authorization: Bearer {$sessionToken}
  data:
    $file: compnay
  save:
    responseObj: json
  expect:
    json:
      - user: to.be.an object
      - user: to.have.key _id
      - sessionToken: to.contain session:
    headers:
      - content-type: application/json; charset=utf-8
      - x-powered-by: Express
    status: 200
```
Here, we can see that `login endpoint (post_users_login)` returning `sessionToken` and in the `deployment` section, we are using the `sessionToken's` value under `Authentication` key.

<br />

## <a name='tests'>`tests:`</a>
We will write all test assertion rules in here. Each test start with **"-"** dash sign. Under the `tests`, we can use tags like `name`, `expects`.

**<a name='testsName'>`name:`</a>**
`name` tag will be name of the test/ step. Example:
```sh
name: session token exists
```
<br />

**<a name='expects'>`expects:`<a/>**
Expecting assertion will go here. This value will come from endpoint's response under the `save` tag. 

`Example:`
```sh
expects: 
   - user: to.have.key _id
```
`Format:`
```sh
<response.value (actual value)>: <operator> <expected value>
```

`Full example of tests:`
```sh
tests:
- name: user is an object
  expects: 
    - sessionResponseObj.1.user.href: ${userResponse.user.href}
    - user: to.be.an object
    - user: to.have.key href
    
- name: user session and logout url check 
  expects: 
    - sessionToken: to.contain session
    - logout.href: to.contain /users/logout
```

<br /><br />
## `Full Example: user.spec.yaml`
```sh
apiCalls:
  name: login to the system
  swagger:
  - name: Login fail - try with empty credentials 
    call: post_users_login
    data:
      email: ''
      password: ''
    query:
      allow-redirect: 0
    expect:
      status: 400
      error: email must be a valid email or username

  - name: Login fail - try with wrong password
    call: post_users_login
    data:
      $file: wrongPassword
    query:
      allow-redirect: 0
    expect:
      status: 403
      error: Forbidden

  - name: Login fail - try with without allow-redirect
    call: post_users_login
    data:
      $file: login
    expect:
      status: 
      - 200
      - 403
      error: Forbidden

  - name: Login - success
    call: post_users_login
    data:
      $file: login
    query:
      allow-redirect: 0
    expect:
      headers:
        - content-type: application/json; charset=utf-8
        - x-powered-by: Express

      json:
        - user: to.be.an object
        - user: to.have.key _id
        
      status: 200
        
tests:  
- name: user session and logout url check 
  expects: 
    - sessionToken: to.contain session
    - logout.href: to.contain /users/logout

```
<br /><br />

## Fake data
Sometime you may want to randomize the tests to create more realistic Test Scenarios. For that, we provide an   Out of
the box [Faker.js API](http://marak.github.io/faker.js/index.html). 

Faker is a massive amount of fake data generator.
All you need to do is to add in any field the type `!faker ["faker.api.you.want", "scope"]`, and it will be replaced by the randomized value. Next, we are going to present some examples, if you need the complete documentation, please read [Faker.js
docs](http://marak.github.io/faker.js/index.html).

```yaml
apiCalls:
  name: login to the system
  swagger:
  - name: Login fail - try with wrong password
    call: post_users_login
    data:
      email: !faker ["internet.email"]
      password: !faker ["internet.password"]
    query:
      allow-redirect: 0
    expect:
      status: 403
      error: Forbidden
```

In the example above, the fields, `email` and `password` will be diferent for each test execution, onde Faker.js will
generate a diferent valid email for each time it runs.

## Fake data scope


There are tree scopes for the `!faker` calls, they are `global`, `file` or `test`. If you do not provide a scope, the
framework will use `global` as default. 

* Global scope will be evaluated once the file is loaded, and therefore will not change in the all test execution
* File scope will be evaluated for before start the test, so it will have a different value for each test execution
* Test scope will be evaluated for before start the `it` execution, so it will have a different value for each spec

<br /><br />
