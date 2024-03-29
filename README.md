[Bkper REST API]: https://bkper.com/docs/#rest-apis

[![npm](https://img.shields.io/npm/v/bkper?color=%235889e4)](https://www.npmjs.com/package/bkper)

Bkper Node.js client provides a simple and secure way to access the [Bkper REST API] on [Node.js](https://nodejs.dev/)

It also provide a **command line** utility to create and update [Bkper Apps and Bots](https://bkper.com/docs/)

## Instalation

### Add the package:

```
npm i -S bkper
```
or
```
yarn add bkper
```

## Commands

- ```login```   - Logs the user in. Saves the client credentials to a ```~/.bkper-credentials.json``` file.
- ```logout```  - Logs out the user by deleting client credentials.
- ```app -c```  - Create a new App based on ```./bkperapp.json``` file.
- ```app -u```  - Update an existing App based on ```./bkperapp.json``` file.

### Examples
```
npm bkper login
```
```
yarn bkper login
```

### Environment Variables
The following environment variable is necessary in order to communicate with the Bkper REST API:

```
BKPER_API_KEY=XXXX
```

The ```app``` command also uses the following variables in order to perform App create/update operations:

```
BKPER_CLIENT_SECRET=YYYY
BKPER_USER_EMAILS="someone@gmail.com anotherone@altrostat.com"
BKPER_DEVELOPER_EMAIL=somedeveloer@mycompany.com
```

You can add a ```.env``` file at the root of your project with those variables and bkper will automatically load from it. Follow [these](https://bkper.com/docs/#rest-api-enabling) steps in order to configure a valid Bkper API key.

> WARNING: Never upload variables to the source code repository.

## Documentation

- [Developer Docs](https://bkper.com/docs)
- [API Reference](https://bkper.com/docs/bkper-node/)

