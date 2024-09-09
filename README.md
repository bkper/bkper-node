[Bkper REST API]: https://bkper.com/docs/#rest-apis

A **command line** utility to create and update [Bkper Apps and Bots](https://bkper.com/docs/)

## Instalation

### Add the package:

```
npm i bkper
```
or
```
yarn add bkper
```
or
```
bun add bkper
```

Optionally, you can install it globally to be able to use the ```bkper``` command line utility:

```
npm i -g bkper
```
or
```
yarn global add bkper
```

## Commands

- ```login```   - Logs the user in. Saves the client credentials to a ```~/.bkper-credentials.json``` file.
- ```logout```  - Logs out the user by deleting client credentials.
- ```app -c```  - Create a new App based on ```./bkperapp.yaml``` file.
- ```app -u```  - Update an existing App based on ```./bkperapp.yaml``` file.

### Examples
```
npm bkper login
```
```
yarn bkper login
```

### Environment Variables
The following environment variable is necessary in order to communicate with the [Bkper REST API]:

```
BKPER_API_KEY=XXXX
```

The ```app``` command also uses the following variables in order to perform App create/update operations:

```
BKPER_CLIENT_SECRET=YYYY
BKPER_USER_EMAILS="someone@gmail.com anotherone@altrostat.com"
BKPER_DEVELOPER_EMAIL=somedeveloer@mycompany.com
```

You can add a ```.env``` file at the root of your project with those variables and bkper will automatically load from it. 
Follow [these](https://bkper.com/docs/#rest-api-enabling) steps in order to configure a valid Bkper API key.

> WARNING: Never upload variables to the source code repository.


### ```./bkperapp.yaml``` Reference

```yaml
id: "The App agent id. It can NOT be changed after the App created."
name: "The name of the App or Bot."
logoUrl: "Set your logo url from public host. Best fit 200x200 px. Use https://"

# Context menu configuration
menuUrl: "The menu url to open in the popup window. See reference bellow."
menuUrlDev: "The menu url to open in the popup window, when opened by the developer user."
menuText: "The context menu call to action."
menuPopupWidth: 500 # width in pixels. Default to 80% of screen width.
menuPopupHeight: 300 # height in pixels. Default to 90% of screen height.

# Bot events configuration
events:
  - "TRANSACTION_POSTED"
  - "TRANSACTION_CHECKED"
  - "TRANSACTION_UNCHECKED"
  - "TRANSACTION_UPDATED"
  - "TRANSACTION_DELETED"
  - "TRANSACTION_RESTORED"
  - "ACCOUNT_CREATED"
  - "ACCOUNT_UPDATED"
  - "ACCOUNT_DELETED"
  - "GROUP_CREATED"
  - "GROUP_UPDATED"
  - "GROUP_DELETED"
  - "FILE_CREATED"
  - "BOOK_UPDATED"

filePatterns:
  - "The file patterns the Bot is capable of process. It accepts wildcard. E.g."
  - "radiusbank*.ofx"
  - "-*.qif"

# Bot configuration only when additional scopes, other than email, is needed
# If not specified, a default valid token with the email scope is sent in the http header
clientId: "The Client ID from GCP project Web Application OAuth Credential"
scopes:
  - "The Google OAuth scopes used. E.g."
  - "https://www.googleapis.com/auth/userinfo.email"
  - "https://www.googleapis.com/auth/script.external_request"

# Google Apps Script bot configuration
scriptId: "The Google Apps Script ID"
deploymentId: "The Google Apps Script API Deployment ID"

# Webhook bot configuration
webhookUrl: "The production webhook url"
webhookUrlDev: "The development webhook url"

# Schema to provide autocompletion
propertiesSchema:
  book:
    keys:
      - "key1"
      - "key2"
    values:
      - "value2"
      - "value2"
  group:
    keys:
      - "key1"
      - "key2"
    values:
      - "value2"
      - "value2"
  account:
    keys:
      - "key1"
      - "key2"
    values:
      - "value2"
      - "value2"
  transaction:
    keys:
      - "key1"
      - "key2"
    values:
      - "value2"
      - "value2"

```

#### Accepted expressions in menuUrl property:

  - ```${book.id}``` - the current book id
  - ```${book.properties.xxxxx}``` - any property value from the current book
  - ```${transactions.query}``` - the current query being executed on transactions list
  - ```${transactions.ids}``` - the ids of selected transactions, splitted by comma
  - ```${account.id}``` - the current account being filterd
  - ```${account.properties.xxxxx}``` - any property value from the current account being filtered
  - ```${group.id}``` - the current group being filterd
  - ```${group.properties.xxxxx}``` - any property value from the current group being filtered

#### Example:

```json
"menuUrl": "https://app.bkper.com/b/#transactions:bookId=${book.id}"
```

#### Library

The ```getOAuthToken``` returns a Promise that resolves to a valid OAuth token, to be used by the [```bkper-js```](https://github.com/bkper/bkper-js) library

Example:

```javascript
import { Bkper } from 'bkper-js';
import { getOAuthToken } from 'bkper';

Bkper.setConfig({
  oauthTokenProvider: async () => getOAuthToken(),
})
```



## Documentation

- [Developer Docs](https://bkper.com/docs)

