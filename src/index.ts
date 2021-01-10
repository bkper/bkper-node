import Book from "./Book";
import { HttpApiRequest } from './HttpApiRequest';
import OAuthTokenProvider from "./OAuthTokenProvider";

/**
 * Gets the [[Book]] with the specified bookId from url param.
 *
 * This is the main Entry Point to start interacting with Bkper.
 *
 * Example:
 *
 * ```js
 * var book = bkper.getBook("agtzfmJrcGVyLWhyZHITCxIGTGVkZ2VyGICAgIDggqALDA");
 * book.record("#fuel for my Land Rover 126.50 28/01/2013");
 * ```
 *
 * @param id The universal book id - The same bookId param of URL you access at app.bkper.com
 * 
 * @public
 */
export function getBook(id: string): Book {
  return new Book(id);
}


/**
 * Sets the API key to identify the agent.
 * 
 * API keys are intended for agent identification only, not for authentication. [Learn more](https://cloud.google.com/endpoints/docs/frameworks/java/when-why-api-key)
 * 
 * See how to create your api key [here](https://cloud.google.com/docs/authentication/api-keys).
 *
 * @param key The key from GCP API & Services Credentials console.
 * 
 * @public
 */
export function setApiKey(key: string): void {
  HttpApiRequest.API_KEY_ = key;
}


/**
 * Sets the [[OAuthTokenProvider]].
 * 
 * OAuthTokenProvider issue a valid OAuth token upon calling the Bkper Rest API. 
 * 
 * @param tokenProvider The [[OAuthTokenProvider]] implementation.
 * 
 * @public
 */
export function setOAuthTokenProvider(tokenProvider: OAuthTokenProvider) {
  HttpApiRequest.OAUTH_TOKEN_PROVIDER_ = tokenProvider;
}