
export interface Config {

  /**
   * The API key to identify the agent.
   * 
   * API keys are intended for agent identification only, not for authentication. [Learn more](https://cloud.google.com/endpoints/docs/frameworks/java/when-why-api-key)
   * 
   * See how to create your api key [here](https://cloud.google.com/docs/authentication/api-keys).
   */  
  apiKey?: string;

  /*
   * Issue a valid OAuth2 access token with **https://www.googleapis.com/auth/userinfo.email** scope authorized.
   */
  oauthTokenProvider?: () => Promise<string>;

  /*
   * Cookie header provider
   */
  cookieHeaderProvider?: () => string;

  /*
   *
   */
  requestErrorHandler?: (error: any) => any;

  /**
   * Sets the base api url. Default to https://app.bkper.com/_ah/api/bkper
   */  
  apiBaseUrl?: string

}