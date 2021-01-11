import { HttpBooksApiV3Request } from "./api/HttpApiRequest";

export async function getSavedQueries(bookId: string): Promise<bkper.Query[]> {
  var responseJSON = await new HttpBooksApiV3Request(`${bookId}/queries`).fetch();
  var savedQueriesPlain = await responseJSON.data;
  if (savedQueriesPlain == null || savedQueriesPlain.items == null) {
    return [];
  } else {
    return savedQueriesPlain.items;
  }
}