import  {authenticate} from '@google-cloud/local-auth';
import fs from 'fs';
import { Credentials, OAuth2Client } from "google-auth-library";
import os from 'os';
import { createRequire } from "module";
import { fileURLToPath } from 'url';
import path from 'path';

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url); // get the resolved path to the file
const __dirname = path.dirname(__filename); // get the name of the directory

const keys = require(`${__dirname}/keys.json`);

let storedCredentials: Credentials;

const storedCredentialsPath = `${os.homedir}/.bkper-credentials.json`;

try {
  let credentialsJson = fs.readFileSync(storedCredentialsPath, 'utf8');
  storedCredentials = JSON.parse(credentialsJson);
} catch (err) {
  console.log('No local credentials found.');
}

export async function login() {
  if (storedCredentials) {
    console.log('Bkper already logged in.');
  }
  await getOAuthToken();
}

export function logout() {
  if (fs.existsSync(storedCredentialsPath)) {
    fs.rmSync(storedCredentialsPath);
  }
  console.log('Bkper logged out.');
}

export function isLoggedIn() {
  return storedCredentials != null;
}

/**
 * @returns A promise that resolves to a valid OAuth token.
 */
export async function getOAuthToken(): Promise<string> {

    let localAuth: OAuth2Client

    if (storedCredentials) {
      localAuth = new OAuth2Client(
        keys.installed.client_id,
        keys.installed.client_secret,
        keys.installed.redirect_uris[0]
      );
      localAuth.setCredentials(storedCredentials);
    } else {
      localAuth = await authenticate({
        scopes: ['https://www.googleapis.com/auth/userinfo.email'],
        keyfilePath: `${__dirname}/keys.json`,
      });
      storeCredentials(localAuth.credentials);
    }

    localAuth.on('tokens', (tokens) => {
      if (tokens.refresh_token) {
        // store the refresh_token in my database!
        storeCredentials(tokens)
      }
    });
    
    let token = await localAuth.getAccessToken();

    return token.token || '';
    
  }

  function storeCredentials(credentials: Credentials) {
    storedCredentials = credentials;
    fs.writeFileSync(storedCredentialsPath, JSON.stringify(credentials, null, 4), 'utf8');
  }
