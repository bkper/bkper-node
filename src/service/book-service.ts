import { HttpBooksApiV5Request } from "./http-api-request";

export async function loadBook(bookId: string): Promise<bkper.Book> {

  if (bookId == null) {
    throw new Error("Book id null!");
  }
  let response = await new HttpBooksApiV5Request(bookId).fetch();
  return response.data;
}

export async function updateBook(bookId: string, book: bkper.Book): Promise<bkper.Book> {
  var response = await new HttpBooksApiV5Request(`${bookId}`).setMethod('PUT').setPayload(book).fetch();
  return response.data;
}

export async function audit(bookId: string): Promise<void> {
  new HttpBooksApiV5Request(`${bookId}/audit`).setMethod('PATCH').fetch();
}



