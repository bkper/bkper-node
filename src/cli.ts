#!/usr/bin/env node

import program from 'commander';
import { login, logout } from './auth/local-auth-service';

program
    .command('login')
    .action(async (todo) => {
      login()
    });

program
    .command('logout')
    .action((todo) => {
     logout()
    });

program.parse(process.argv);