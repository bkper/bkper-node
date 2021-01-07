import Book from "./Book";
import { HttpBooksApiV3Request } from "./HttpApiRequest";

export async function createTransaction(bookId: string, transaction: bkper.Transaction): Promise<bkper.TransactionOperation> {
  var payload = JSON.stringify(transaction);
  var response = await new HttpBooksApiV3Request(`${bookId}/transactions`).setMethod('post').setPayload(payload).fetch();
  return response.json();
}

export async function createTransactionsBatch(bookId: string, transactions: bkper.Transaction[]): Promise<bkper.Transaction[]> {

  let transactionList: bkper.TransactionList = {
    items: transactions
  }
  var payload = JSON.stringify(transactionList);

  let response = await new HttpBooksApiV3Request(`${bookId}/transactions/batch`)
    .setMethod('post')
    .setPayload(payload)
    .fetch();

  transactionList = await response.json();
  return transactionList != null && transactionList.items != null ? transactionList.items : [];
}

export async function updateTransaction(bookId: string, transaction: bkper.Transaction): Promise<bkper.TransactionOperation> {
  var payload = JSON.stringify(transaction);
  var response = await new HttpBooksApiV3Request(`${bookId}/transactions`).setMethod('put').setPayload(payload).fetch();
  return response.json();
}

export async function postTransaction(bookId: string, transaction: bkper.Transaction): Promise<bkper.TransactionOperation> {
  var payload = JSON.stringify(transaction);
  var response = await new HttpBooksApiV3Request(`${bookId}/transactions/post`).setMethod('patch').setPayload(payload).fetch();
  return response.json();
}

export async function checkTransaction(bookId: string, transaction: bkper.Transaction): Promise<bkper.TransactionOperation> {
  var payload = JSON.stringify(transaction);
  var response = await new HttpBooksApiV3Request(`${bookId}/transactions/check`).setMethod('patch').setPayload(payload).fetch();
  return response.json();
}

export async function uncheckTransaction(bookId: string, transaction: bkper.Transaction): Promise<bkper.TransactionOperation> {
  var payload = JSON.stringify(transaction);
  var response = await new HttpBooksApiV3Request(`${bookId}/transactions/uncheck`).setMethod('patch').setPayload(payload).fetch();
  return response.json();
}

export async function removeTransaction(bookId: string, transaction: bkper.Transaction): Promise<bkper.TransactionOperation> {
  var payload = JSON.stringify(transaction);
  var response = await new HttpBooksApiV3Request(`${bookId}/transactions/remove`).setMethod('patch').setPayload(payload).fetch();
  return response.json();
}

export async function restoreTransaction(bookId: string, transaction: bkper.Transaction): Promise<bkper.TransactionOperation> {
  var payload = JSON.stringify(transaction);
  var response = await new HttpBooksApiV3Request(`${bookId}/transactions/restore`).setMethod('patch').setPayload(payload).fetch();
  return response.json();
}

export async function getTransaction(bookId: string, id: string): Promise<bkper.Transaction> {
  var response = await new HttpBooksApiV3Request(`${bookId}/transactions/${id}`).setMethod('get').fetch();
  return response.json();
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
  return response.json();
}
