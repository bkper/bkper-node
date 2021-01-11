import { HttpBooksApiV3Request } from "./api/HttpApiRequest";

export async function loadBookWrapped(bookId: string): Promise<bkper.Book> {

  if (bookId == null) {
    throw new Error("Book id null!");
  }
  let response = await new HttpBooksApiV3Request(bookId).fetch();
  return response.data;
}

export async function updateBook(bookId: string, book: bkper.Book): Promise<bkper.Book> {
  var payload = JSON.stringify(book);
  var response = await new HttpBooksApiV3Request(`${bookId}`).setMethod('PUT').setPayload(payload).fetch();
  return response.data;
}

export async function audit(bookId: string): Promise<void> {
  new HttpBooksApiV3Request(`${bookId}/audit`).setMethod('PATCH').fetch();
}




