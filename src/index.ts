import { Config } from 'bkper-js';
import { getOAuthToken } from './auth/local-auth-service.js';
import dotenv from 'dotenv';
dotenv.config()

export function getBkperLocalConfig(): Config {
  return {
    apiKeyProvider: async () => process.env.BKPER_API_KEY || '',
    oauthTokenProvider: () => getOAuthToken()
  }
}