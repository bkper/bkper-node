import { HttpBooksApiV4Request } from "./HttpApiRequest";

export async function createFile(bookId: string, file: bkper.File): Promise<bkper.File> {
  var payload = JSON.stringify(file);
  var response = await new HttpBooksApiV4Request(`${bookId}/files`).setMethod('POST').setPayload(payload).fetch();
  return response.data;
}

export async function getFile(bookId: string, id: string): Promise<bkper.File> {
  var response = await new HttpBooksApiV4Request(`${bookId}/files/${id}`).setMethod('GET').fetch();
  return response.data;
}  
