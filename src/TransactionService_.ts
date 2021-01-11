import Book from "./Book";
import { HttpBooksApiV3Request } from "./HttpApiRequest";

export async function createTransaction(bookId: string, transaction: bkper.Transaction): Promise<bkper.TransactionOperation> {
  var payload = JSON.stringify(transaction);
  var response = await new HttpBooksApiV3Request(`${bookId}/transactions`).setMethod('POST').setPayload(payload).fetch();
  return response.data;
}

export async function createTransactionsBatch(bookId: string, transactions: bkper.Transaction[]): Promise<bkper.Transaction[]> {

  let transactionList: bkper.TransactionList = {
    items: transactions
  }
  var payload = JSON.stringify(transactionList);

  let response = await new HttpBooksApiV3Request(`${bookId}/transactions/batch`)
    .setMethod('POST')
    .setPayload(payload)
    .fetch();

  transactionList = await response.data;
  return transactionList != null && transactionList.items != null ? transactionList.items : [];
}

export async function updateTransaction(bookId: string, transaction: bkper.Transaction): Promise<bkper.TransactionOperation> {
  var payload = JSON.stringify(transaction);
  var response = await new HttpBooksApiV3Request(`${bookId}/transactions`).setMethod('PUT').setPayload(payload).fetch();
  return response.data;
}

export async function postTransaction(bookId: string, transaction: bkper.Transaction): Promise<bkper.TransactionOperation> {
  var payload = JSON.stringify(transaction);
  var response = await new HttpBooksApiV3Request(`${bookId}/transactions/post`).setMethod('PATCH').setPayload(payload).fetch();
  return response.data;
}

export async function checkTransaction(bookId: string, transaction: bkper.Transaction): Promise<bkper.TransactionOperation> {
  var payload = JSON.stringify(transaction);
  var response = await new HttpBooksApiV3Request(`${bookId}/transactions/check`).setMethod('PATCH').setPayload(payload).fetch();
  return response.data;
}

export async function uncheckTransaction(bookId: string, transaction: bkper.Transaction): Promise<bkper.TransactionOperation> {
  var payload = JSON.stringify(transaction);
  var response = await new HttpBooksApiV3Request(`${bookId}/transactions/uncheck`).setMethod('PATCH').setPayload(payload).fetch();
  return response.data;
}

export async function removeTransaction(bookId: string, transaction: bkper.Transaction): Promise<bkper.TransactionOperation> {
  var payload = JSON.stringify(transaction);
  var response = await new HttpBooksApiV3Request(`${bookId}/transactions/remove`).setMethod('PATCH').setPayload(payload).fetch();
  return response.data;
}

export async function restoreTransaction(bookId: string, transaction: bkper.Transaction): Promise<bkper.TransactionOperation> {
  var payload = JSON.stringify(transaction);
  var response = await new HttpBooksApiV3Request(`${bookId}/transactions/restore`).setMethod('PATCH').setPayload(payload).fetch();
  return response.data;
}

export async function getTransaction(bookId: string, id: string): Promise<bkper.Transaction> {
  var response = await new HttpBooksApiV3Request(`${bookId}/transactions/${id}`).setMethod('GET').fetch();
  return response.data;
}

export async function searchTransactions(book: Book, query: string, limit: number, cursor?: string): Promise<bkper.TransactionList> {
  if (query == null) {
    query = "";
  }
  var request = new HttpBooksApiV3Request(`${book.getId()}/transactions`);
  request.addParam('query', query);
  request.addParam('limit', limit);
  if (cursor != null) {
    request.setHeader('cursor', cursor);
  }

  var response = await request.fetch();
  return response.data;
}
