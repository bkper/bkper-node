import {HttpBooksApiV3Request} from './api/HttpApiRequest';

export async function createAccount(bookId: string, account: bkper.Account): Promise<bkper.Account> {
  var payload = JSON.stringify(account);
  var response = await new HttpBooksApiV3Request(`${bookId}/accounts`).setMethod('POST').setPayload(payload).fetch();
  return response.data;
}

export async function updateAccount(bookId: string, account: bkper.Account): Promise<bkper.Account> {
  var payload = JSON.stringify(account);
  var response = await new HttpBooksApiV3Request(`${bookId}/accounts`).setMethod('PUT').setPayload(payload).fetch();
  return response.data;
}

export async function deleteAccount(bookId: string, account: bkper.Account): Promise<bkper.Account> {
  var response = await new HttpBooksApiV3Request(`${bookId}/accounts/${account.id}`).setMethod('DELETE').fetch();
  return response.data;
}

export async function createAccounts(bookId: string, accounts: bkper.Account[]): Promise<bkper.Account[]> {
  let accountList: bkper.AccountList = {
    items: accounts
  };
  var accountSaveBatchJSON = JSON.stringify(accountList);
  var response = await new HttpBooksApiV3Request(`${bookId}/accounts/batch`).setMethod('POST').setPayload(accountSaveBatchJSON).fetch();
  var accountsPlain = await response.data;
  if (accountsPlain.items == null) {
    return [];
  }
  return accountsPlain;

}