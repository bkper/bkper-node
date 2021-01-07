import { HttpBooksApiV3Request } from "./HttpApiRequest";

export async function createFile(bookId: string, file: bkper.File): Promise<bkper.File> {
  var payload = JSON.stringify(file);
  var response = await new HttpBooksApiV3Request(`${bookId}/files`).setMethod('post').setPayload(payload).fetch();
  return response.json();
}

export async function getFile(bookId: string, id: string): Promise<bkper.File> {
  var response = await new HttpBooksApiV3Request(`${bookId}/files/${id}`).setMethod('get').fetch();
  return response.json()
}  
