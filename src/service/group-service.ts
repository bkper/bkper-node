import { HttpBooksApiV4Request } from "./HttpApiRequest";

export async function createGroup(bookId: string, group: bkper.Group): Promise<bkper.Group> {
  var payload = JSON.stringify(group);
  var response = await new HttpBooksApiV4Request(`${bookId}/groups`).setMethod('POST').setPayload(payload).fetch();
  return response.data;
}

export async function updateGroup(bookId: string, group: bkper.Group): Promise<bkper.Group> {
  var payload = JSON.stringify(group);
  var response = await new HttpBooksApiV4Request(`${bookId}/groups`).setMethod('PUT').setPayload(payload).fetch();
  return response.data;
}

export async function deleteGroup(bookId: string, group: bkper.Group): Promise<bkper.Group> {
  var response = await new HttpBooksApiV4Request(`${bookId}/groups/${group.id}`).setMethod('DELETE').fetch();
  return response.data;
}


export async function createGroups(bookId: string, groups: bkper.Group[]): Promise<bkper.Group[]> {

  let groupList: bkper.GroupList = {
    items: groups
  };

  var groupsBatchJSON = JSON.stringify(groupList);

  var response = await new HttpBooksApiV4Request(`${bookId}/groups/batch`).setMethod('POST').setPayload(groupsBatchJSON).fetch();

  if (response == null ) {
    return [];
  }

  var groupsPlain = response.data;
  if (groupsPlain.items == null) {
    return [];
  }
  return groupsPlain.items;
}

export async function getGroupsByAccountId(bookId: string, accountId: string): Promise<bkper.Group[]> {
  var response = await new HttpBooksApiV4Request(`${bookId}/accounts/${accountId}/groups`).setMethod('GET').fetch();
  var groupsPlain = response.data;
  if (groupsPlain.items == null) {
    return [];
  }
  return groupsPlain.items;
}

export async function getGroups(bookId: string): Promise<bkper.Group[]> {
  var response = await new HttpBooksApiV4Request(`${bookId}/groups`).setMethod('GET').fetch();
  var groupsPlain = response.data;
  if (groupsPlain.items == null) {
    return [];
  }
  return groupsPlain.items;
}

export async function getGroup(bookId: string, idOrName: string): Promise<bkper.Group> {
  try {
    var response = await new HttpBooksApiV4Request(`${bookId}/groups/${encodeURIComponent(idOrName)}`).setMethod('GET').fetch();
    return response.data;
  } catch (error) {
    return null;
  }
}

export async function getAccounts(bookId: string, idOrName: string): Promise<bkper.Account[]> {
  var response = await new HttpBooksApiV4Request(`${bookId}/groups/${encodeURIComponent(idOrName)}/accounts`).setMethod('GET').fetch();
  var accountsPlain = response.data;
  if (accountsPlain.items == null) {
    return [];
  }
  return accountsPlain.items;
}