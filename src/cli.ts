#!/usr/bin/env node

import program from 'commander';
import { login, logout } from './auth/local-auth-service';
import { Bkper } from './model/Bkper';
import { NODE_ENV_DEV } from './utils';
import { App } from './model/App';
var fs = require('fs');
require('dotenv').config();

process.env.NODE_ENV=NODE_ENV_DEV;

program
  .command('login')
  .description('Login Bkper')
  .action(async () => {
    await login()
  });

program
  .command('logout')
  .description('Logout Bkper')
  .action((todo) => {
    logout()
  });

program
  .command('app')
  .description('Create/Update an App')
  .option('-u, --update', 'Update the App')
  .option('-c, --create', 'Create a new App')
  .action(async (options) => {

    try {
       Bkper.setConfig({apiKey:process.env.BKPER_API_KEY})
       let app = new App()
       app.setJson(JSON.parse(fs.readFileSync('./bkperapp.json', 'utf8')))
        .setReadme(fs.readFileSync('./README.md', 'utf8'))
        .setClientSecret(process.env.BKPER_CLIENT_SECRET)
        .setDeveloperEmail(process.env.BKPER_DEVELOPER_EMAIL)
        .setUserEmails(process.env.BKPER_USER_EMAILS);
      if (options.update) {
        app = await app.update();
        console.log(`Updated ${app.getId()} sucessfully.`)
      } else if (options.create) {
        app = await app.create();
        console.log(`Created ${app.getId()} sucessfully.`)

      }
    } catch (err) {
      console.log(err)
    }

  });


program.parse(process.argv);