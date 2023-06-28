
/**
 * This class defines the [[Bkper]] API Config.
 * 
 * @public
 */
export interface Config {

  /**
   * The API key to identify the agent.
   * 
   * API keys are intended for agent identification only, not for authentication. [Learn more](https://cloud.google.com/endpoints/docs/frameworks/java/when-why-api-key)
   * 
   * See how to create your api key [here](https://cloud.google.com/docs/authentication/api-keys).
   */
  apiKeyProvider?: () => Promise<string>;

  /**
   * Issue a valid OAuth2 access token with **https://www.googleapis.com/auth/userinfo.email** scope authorized.
   */
  oauthTokenProvider?: () => Promise<string>;

  /**
   * Provides additional headers to append to the API request
   */
  requestHeadersProvider?: () => Promise<{ [key: string]: string }>;

  /**
   * Custom request error handler
   */
  requestErrorHandler?: (error: any) => any;

  /**
   * Sets the base api url. Default to https://app.bkper.com/_ah/api/bkper
   */
  apiBaseUrl?: string

}
