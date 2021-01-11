import { HttpBooksApiV3Request } from "./api/HttpApiRequest";

export async function createFile(bookId: string, file: bkper.File): Promise<bkper.File> {
  var payload = JSON.stringify(file);
  var response = await new HttpBooksApiV3Request(`${bookId}/files`).setMethod('POST').setPayload(payload).fetch();
  return response.data;
}

export async function getFile(bookId: string, id: string): Promise<bkper.File> {
  var response = await new HttpBooksApiV3Request(`${bookId}/files/${id}`).setMethod('GET').fetch();
  return response.data
}  
