#!/usr/bin/env node

import { App, Bkper } from 'bkper-js';
import program from 'commander';
import fs from 'fs';
import { login, logout } from './auth/local-auth-service.js';
import { getBkperLocalConfig } from './index.js';

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
       Bkper.setConfig(getBkperLocalConfig())
       const json: bkper.App = JSON.parse(fs.readFileSync('./bkperapp.json', 'utf8'));
       let app = new App(json)
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