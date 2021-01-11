import { HttpBooksApiV3Request } from "./api/HttpApiRequest";

export async function getBalances(bookId: string, query: string): Promise<bkper.Balances> {
  var response = await new HttpBooksApiV3Request(`${bookId}/balances`).addParam('query', query).addParam('time', Date.now()).fetch();
  return response.data;
}

