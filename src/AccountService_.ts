import { HttpBooksApiV3Request, HttpBooksApiV2Request } from "./HttpApiRequest";

export async function createAccount(bookId: string, account: bkper.Account): Promise<bkper.Account> {
  var payload = JSON.stringify(account);
  var response = await new HttpBooksApiV3Request(`${bookId}/accounts`).setMethod('post').setPayload(payload).fetch();
  return response.json();
}

export async function updateAccount(bookId: string, account: bkper.Account): Promise<bkper.Account> {
  var payload = JSON.stringify(account);
  var response = await new HttpBooksApiV3Request(`${bookId}/accounts`).setMethod('put').setPayload(payload).fetch();
  return response.json();
}

export async function deleteAccount(bookId: string, account: bkper.Account): Promise<bkper.Account> {
  var response = await new HttpBooksApiV3Request(`${bookId}/accounts/${account.id}`).setMethod('delete').fetch();
  return response.json();
}

export async function createAccounts(bookId: string, accounts: bkper.Account[]): Promise<bkper.Account[]> {
  let accountList: bkper.AccountList = {
    items: accounts
  };
  var accountSaveBatchJSON = JSON.stringify(accountList);
  var response = await new HttpBooksApiV3Request(`${bookId}/accounts/batch`).setMethod('post').setPayload(accountSaveBatchJSON).fetch();
  var accountsPlain = await response.json();
  if (accountsPlain.items == null) {
    return [];
  }
  return accountsPlain;

}