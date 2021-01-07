import { HttpBooksApiV3Request } from "./HttpApiRequest";

export async function createGroup(bookId: string, group: bkper.Group): Promise<bkper.Group> {
  var payload = JSON.stringify(group);
  var response = await new HttpBooksApiV3Request(`${bookId}/groups`).setMethod('post').setPayload(payload).fetch();
  return response.json();
}

export async function updateGroup(bookId: string, group: bkper.Group): Promise<bkper.Group> {
  var payload = JSON.stringify(group);
  var response = await new HttpBooksApiV3Request(`${bookId}/groups`).setMethod('put').setPayload(payload).fetch();
  return response.json();
}

export async function deleteGroup(bookId: string, group: bkper.Group): Promise<bkper.Group> {
  var response = await new HttpBooksApiV3Request(`${bookId}/groups/${group.id}`).setMethod('delete').fetch();
  return response.json();
}


export async function createGroups(bookId: string, groups: bkper.Group[]): Promise<bkper.Group[]> {

  let groupList: bkper.GroupList = {
    items: groups
  };

  var groupsBatchJSON = JSON.stringify(groupList);

  var response = await new HttpBooksApiV3Request(`${bookId}/groups/batch`).setMethod('post').setPayload(groupsBatchJSON).fetch();

  if (response == null ) {
    return [];
  }

  var groupsPlain = await response.json();
  if (groupsPlain.items == null) {
    return [];
  }
  return groupsPlain.items;
}