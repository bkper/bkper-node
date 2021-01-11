/**
 * Interface to provide OAuth2 tokens upon calling the API.
 * 
 * @public
 */
export default interface OAuthTokenProvider {

  /**
   * A valid OAuth2 access token with **email** scope authorized.
   */
  (): string;
}