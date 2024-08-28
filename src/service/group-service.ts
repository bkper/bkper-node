import { HttpBooksApiV5Request } from "./http-api-request";

export async function createGroup(bookId: string, group: bkper.Group): Promise<bkper.Group> {
  var response = await new HttpBooksApiV5Request(`${bookId}/groups`).setMethod('POST').setPayload(group).fetch();
  return response.data;
}

export async function updateGroup(bookId: string, group: bkper.Group): Promise<bkper.Group> {
  var response = await new HttpBooksApiV5Request(`${bookId}/groups`).setMethod('PUT').setPayload(group).fetch();
  return response.data;
}

export async function deleteGroup(bookId: string, group: bkper.Group): Promise<bkper.Group> {
  var response = await new HttpBooksApiV5Request(`${bookId}/groups/${group.id}`).setMethod('DELETE').fetch();
  return response.data;
}


export async function getGroupsByAccountId(bookId: string, accountId: string): Promise<bkper.Group[]> {
  var response = await new HttpBooksApiV5Request(`${bookId}/accounts/${accountId}/groups`).setMethod('GET').fetch();
  return response?.data?.items || [];
}

export async function getGroups(bookId: string): Promise<bkper.Group[]> {
  var response = await new HttpBooksApiV5Request(`${bookId}/groups`).setMethod('GET').fetch();
  var groupsPlain = response.data;
  if (!groupsPlain?.items) {
    return [];
  }
  return groupsPlain.items;
}

export async function getGroup(bookId: string, idOrName: string): Promise<bkper.Group> {
    var response = await new HttpBooksApiV5Request(`${bookId}/groups/${encodeURIComponent(idOrName)}`).setMethod('GET').fetch();
    return response.data;
}

export async function getAccounts(bookId: string, idOrName: string): Promise<bkper.Account[]> {
  var response = await new HttpBooksApiV5Request(`${bookId}/groups/${encodeURIComponent(idOrName)}/accounts`).setMethod('GET').fetch();
  var accountsPlain = response.data;
  if (!accountsPlain?.items) {
    return [];
  }
  return accountsPlain.items;
}