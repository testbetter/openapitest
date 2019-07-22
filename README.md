# Openapitest Framework
The purpose of this openapitest framework is to simplify authoring, organizing, executing, and reporting result of API tests using API specification. It runs on node.js and distributed via npm. Add this module to your node.js project as a development dependency and start writing API or Integration tests using YAML language.


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
   ├─ shared-data
   |   ├─ testusers.data.js
   |   └─ testenvironment.data.yaml
   └─ test-suites
       ├─ cool-features-group1
       |   ├─ coolTest1.spec.yaml
       |   ├─ coolTest1.data.yaml
       |   ├─ coolTest2.spec.yaml
       |   ├─ coolTest2.data.js
       |   └─ coolTest2.util.js
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
  -V, --version          Output the version number
  -o, --openapi  [path]  Open API relative/ absolute path. e.g: <path>/openapi.json
  -t, --testDir  [path]  Test folder relative/ absolute path.  e.g: <path>/test-spec
  -d, --dataDir  [path]  Test data folder. Defaults to a folder called "data" that is a sibling to the test-suites folder
  -s, --sharedir [path]  Shared Test data folder relative/ absolute path.  e.g: <path>/share_data
  -u, --url [url]        Server URL. e.g: http://localhost:9000
  -h, --help             output usage information
```

<br />

# Documentation
### File naming convention:
--- 
**Test spec file name:** should be ending with `.spec.yaml`. 

Example: `user.spec.yaml`

**Test data file name:** should be ending with `.data.yaml` or `.data.js`. 

Example: `login.data.yaml`

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
		* [save](#save)
		* [print](#print)
		* [only](#only)
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
```
<br />


**<a name='header'>`header:`</a>**
If we need to send any header information during the endpoint call, we can define under the `header` tag. There is no file support here. Example:
```sh
header:
  Accept: application/json
  Authorization: Bearer sessionToken
```
<br />

**<a name='query'>`query:`</a>**
We can define query/ get value under `query` tag. There is no file support here. Example:
```sh
query:
  id: 1212
  otherId: 1234
```
<br />

**<a name='data'>`data:`</a>**
`data` is responsible to send request data or form data to endpoint. Value of the data can be 2 types like as `key-value` pair and `file` base. We can create 2 types of file with `.yaml` and `.js` extension.

**`key-value pair example:`**
```sh
data:
  email: test@localhost.com
  password: "123"
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

**<a name='print'>`print:`</a>**
If we want to print the response or error then we can do that by using `print` tag. Example:
```sh
print: 1
```
<br />

**<a name='only'>`only:`</a>**
If we want to run only a subset of tests by using `only` tag. Example:
```sh
only: true
```
<br />


**<a name='save'>`save:`</a>**
After calling the endpoint, If we want to save response for next endpoint or for assert the test then we can do that by set under `save` tag. The response type can be `text` or `json`. Example: Saving session token
```sh
save:
   sessionToken: json.sessionToken
```

Example: Returning full response
```ah
save:
   userResponse: json
```

We can save value from file as well. Example: save `username` from `basicAuth` file.
```sh
save:
   username: $file.basicAuth.email
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