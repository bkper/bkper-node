import { HttpBooksApiV5Request } from "./http-api-request";

export async function createTransaction(bookId: string, transaction: bkper.Transaction): Promise<bkper.TransactionOperation> {
  var response = await new HttpBooksApiV5Request(`${bookId}/transactions`).setMethod('POST').setPayload(transaction).fetch();
  return response.data;
}

export async function createTransactionsBatch(bookId: string, transactions: bkper.Transaction[]): Promise<bkper.Transaction[]> {

  let transactionList: bkper.TransactionList = {
    items: transactions
  }
  var payload = JSON.stringify(transactionList);

  let response = await new HttpBooksApiV5Request(`${bookId}/transactions/batch`)
    .setMethod('POST')
    .setPayload(payload)
    .fetch();

  transactionList = await response.data;
  return transactionList != null && transactionList.items != null ? transactionList.items : [];
}

export async function trashTransactionsBatch(bookId: string, transactions: bkper.Transaction[]): Promise<void> {

  let transactionList: bkper.TransactionList = {
    items: transactions
  }
  var payload = JSON.stringify(transactionList);

  let response = await new HttpBooksApiV5Request(`${bookId}/transactions/trash/batch`)
    .setMethod('PATCH')
    .setPayload(payload)
    .fetch();

  transactionList = await response.data;
}

export async function updateTransaction(bookId: string, transaction: bkper.Transaction): Promise<bkper.TransactionOperation> {
  var response = await new HttpBooksApiV5Request(`${bookId}/transactions`).setMethod('PUT').setPayload(transaction).fetch();
  return response.data;
}

export async function postTransaction(bookId: string, transaction: bkper.Transaction): Promise<bkper.TransactionOperation> {
  var response = await new HttpBooksApiV5Request(`${bookId}/transactions/post`).setMethod('PATCH').setPayload(transaction).fetch();
  return response.data;
}

export async function checkTransaction(bookId: string, transaction: bkper.Transaction): Promise<bkper.TransactionOperation> {
  var response = await new HttpBooksApiV5Request(`${bookId}/transactions/check`).setMethod('PATCH').setPayload(transaction).fetch();
  return response.data;
}

export async function uncheckTransaction(bookId: string, transaction: bkper.Transaction): Promise<bkper.TransactionOperation> {
  var response = await new HttpBooksApiV5Request(`${bookId}/transactions/uncheck`).setMethod('PATCH').setPayload(transaction).fetch();
  return response.data;
}

export async function trashTransaction(bookId: string, transaction: bkper.Transaction): Promise<bkper.TransactionOperation> {
  var response = await new HttpBooksApiV5Request(`${bookId}/transactions/trash`).setMethod('PATCH').setPayload(transaction).fetch();
  return response.data;
}

export async function restoreTransaction(bookId: string, transaction: bkper.Transaction): Promise<bkper.TransactionOperation> {
  var response = await new HttpBooksApiV5Request(`${bookId}/transactions/restore`).setMethod('PATCH').setPayload(transaction).fetch();
  return response.data;
}

export async function getTransaction(bookId: string, id: string): Promise<bkper.Transaction> {
  var response = await new HttpBooksApiV5Request(`${bookId}/transactions/${id}`).setMethod('GET').fetch();
  return response.data;
}

export async function searchTransactions(bookId: string, query: string, limit: number, cursor?: string): Promise<bkper.TransactionList> {
  if (query == null) {
    query = "";
  }
  var request = new HttpBooksApiV5Request(`${bookId}/transactions`);
  request.addParam('query', query);
  request.addParam('limit', limit);
  if (cursor != null) {
    request.setHeader('cursor', cursor);
  }

  var response = await request.fetch();
  return response.data;
}
