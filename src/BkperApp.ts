import Book from "./Book";

/**
 * Gets the [[Book]] with the specified bookId from url param.
 *
 * This is the main Entry Point to start interacting with BkperApp
 *
 * Example:
 *
 * ```js
 * var book = BkperApp.getBook("agtzfmJrcGVyLWhyZHITCxIGTGVkZ2VyGICAgIDggqALDA");
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
