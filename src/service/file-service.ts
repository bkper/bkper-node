import { HttpBooksApiV5Request } from "./http-api-request";

export async function createFile(bookId: string, file: bkper.File): Promise<bkper.File> {
  var response = await new HttpBooksApiV5Request(`${bookId}/files`).setMethod('POST').setPayload(file).fetch();
  return response.data;
}

export async function getFile(bookId: string, id: string): Promise<bkper.File> {
  var response = await new HttpBooksApiV5Request(`${bookId}/files/${id}`).setMethod('GET').fetch();
  return response.data;
}  
