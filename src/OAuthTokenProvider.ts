/**
 * Interface to provide OAuth2 tokens upon calling the API.
 * 
 * Implement your own if you need to use one other than the default built-in [ScriptApp](https://developers.google.com/apps-script/reference/script/script-app#getoauthtoken).
 * 
 * Its specially usefull on environments where you can use the built-in ScriptApp services such as [Custom Functions in Google Sheets](https://developers.google.com/apps-script/guides/sheets/functions).
 * 
 * Learn more how to [OAuth 2 library](https://github.com/gsuitedevs/apps-script-oauth2) for Google Apps Script
 * 
 * @public
 */
export default interface OAuthTokenProvider {

  /**
   * A valid OAuth2 access token with **email** scope authorized.
   */
  (): string;
}