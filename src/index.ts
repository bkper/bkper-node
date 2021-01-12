import Book from "./model/Book";
import * as BookService from './service/book-service';
import { HttpApiRequest } from './service/HttpApiRequest';
import OAuthTokenProvider from './auth/OAuthTokenProvider';

export default class Bkper {

  /**
   * Gets the [[Book]] with the specified bookId from url param.
   *
   * This is the main Entry Point to start interacting with Bkper.
   *
   * @param id The universal book id - The same bookId param of URL you access at app.bkper.com
   * 
   * @public
   */
  public static async getBook(id: string): Promise<Book> {
    let book = await BookService.loadBookWrapped(id);
    return new Book(book);
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
  public static setApiKey(key: string): void {
    HttpApiRequest.API_KEY = key;
  }


  /**
   * Sets the [[OAuthTokenProvider]].
   * 
   * OAuthTokenProvider issue a valid OAuth token upon calling the Bkper Rest API. 
   * 
   * @param oauthTokenProvider The [[OAuthTokenProvider]] implementation.
   * 
   * @public
   */
  public static setOAuthTokenProvider(oauthTokenProvider: OAuthTokenProvider) {
    HttpApiRequest.OAUTH_TOKEN_PROVIDER = oauthTokenProvider;
  }

}