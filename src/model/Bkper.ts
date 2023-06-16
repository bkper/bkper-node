import { Book } from "./Book";
import { App } from "./App";
import * as BookService from '../service/book-service';
import * as UserService from '../service/user-service';
import { HttpApiRequest } from '../service/HttpApiRequest';
import { User } from "./User";
import { Config } from "./Config";

/**
 * This is the main Entry Point of the [bkper-node](https://www.npmjs.com/package/bkper) library.
 * 
 * @public
 */
export class Bkper {

  /**
   * Gets the [[Book]] with the specified bookId from url param.
   *
   * @param id - The universal book id - The same bookId param of URL you access at app.bkper.com
   * 
   */
  public static async getBook(id: string): Promise<Book> {
    let book = await BookService.loadBook(id);
    return new Book(book);
  }

  /**
   * Gets the current logged [[User]].
   */  
  public static async getUser(): Promise<User> {
    let user = await UserService.getUser();
    return new User(user);
  }


  /**
   * Sets the API [[Config]] object.
   */
  public static setConfig(config: Config) {
    HttpApiRequest.config = config;
  }

  /**
   * @deprecated Use `setConfig()` instead
   */
  public static setApiKey(key: string): App {
    HttpApiRequest.config.apiKeyProvider = async () => key;
    return new App();
  }

  /**
   * @deprecated Use `setConfig()` instead
   */
  public static async setOAuthTokenProvider(oauthTokenProvider: () => Promise<string>) {
    HttpApiRequest.config.oauthTokenProvider = oauthTokenProvider;
  }

}