import { HttpBooksApiV5Request } from "./http-api-request";

export async function getBalances(bookId: string, query: string): Promise<bkper.Balances> {
  var response = await new HttpBooksApiV5Request(`${bookId}/balances`).addParam('query', query).addParam('time', Date.now()).fetch();
  return response.data;
}

