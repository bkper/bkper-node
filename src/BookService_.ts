import Book from "./Book";
import { HttpBooksApiV3Request } from "./HttpApiRequest";

export async function listBooks(): Promise<bkper.Book[]> {

  var response = await new HttpBooksApiV3Request('').fetch();

  if (response == null) {
    return [];
  }

  var bookListPlain: bkper.BookList = await response.json();

  var booksJson = bookListPlain.items;

  if (booksJson == null) {
    return [];
  }

  booksJson.sort(function (a, b) {
    {
      var aName = a.name.toLowerCase();
      var bName = b.name.toLowerCase();
      if (aName < bName) {
        return -1;
      } else if (aName > bName) {
        return 1;
      } else {
        return 0;
      }
    }
  });
  return booksJson;
}

export async function loadBookWrapped(bookId: string): Promise<bkper.Book> {

  if (bookId == null) {
    throw new Error("Book id null!");
  }
  let response = await new HttpBooksApiV3Request(bookId).fetch();
  return response.json();
}

export async function updateBook(bookId: string, book: bkper.Book): Promise<bkper.Book> {
  var payload = JSON.stringify(book);
  var response = await new HttpBooksApiV3Request(`${bookId}`).setMethod('put').setPayload(payload).fetch();
  return response.json();
}

export async function audit(book: Book): Promise<void> {
  new HttpBooksApiV3Request(`${book.getId()}/audit`).setMethod('patch').fetch();
}




