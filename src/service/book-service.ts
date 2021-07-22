import { HttpBooksApiV4Request } from "./HttpApiRequest";

export async function loadBook(bookId: string): Promise<bkper.Book> {

  if (bookId == null) {
    throw new Error("Book id null!");
  }
  let response = await new HttpBooksApiV4Request(bookId).fetch();
  return response.data;
}

export async function updateBook(bookId: string, book: bkper.Book): Promise<bkper.Book> {
  var payload = JSON.stringify(book);
  var response = await new HttpBooksApiV4Request(`${bookId}`).setMethod('PUT').setPayload(payload).fetch();
  return response.data;
}

export async function audit(bookId: string): Promise<void> {
  new HttpBooksApiV4Request(`${bookId}/audit`).setMethod('PATCH').fetch();
}



