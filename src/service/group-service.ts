import { HttpBooksApiV3Request } from "./api/HttpApiRequest";

export async function createGroup(bookId: string, group: bkper.Group): Promise<bkper.Group> {
  var payload = JSON.stringify(group);
  var response = await new HttpBooksApiV3Request(`${bookId}/groups`).setMethod('POST').setPayload(payload).fetch();
  return response.data;
}

export async function updateGroup(bookId: string, group: bkper.Group): Promise<bkper.Group> {
  var payload = JSON.stringify(group);
  var response = await new HttpBooksApiV3Request(`${bookId}/groups`).setMethod('PUT').setPayload(payload).fetch();
  return response.data;
}

export async function deleteGroup(bookId: string, group: bkper.Group): Promise<bkper.Group> {
  var response = await new HttpBooksApiV3Request(`${bookId}/groups/${group.id}`).setMethod('DELETE').fetch();
  return response.data;
}


export async function createGroups(bookId: string, groups: bkper.Group[]): Promise<bkper.Group[]> {

  let groupList: bkper.GroupList = {
    items: groups
  };

  var groupsBatchJSON = JSON.stringify(groupList);

  var response = await new HttpBooksApiV3Request(`${bookId}/groups/batch`).setMethod('POST').setPayload(groupsBatchJSON).fetch();

  if (response == null ) {
    return [];
  }

  var groupsPlain = await response.data;
  if (groupsPlain.items == null) {
    return [];
  }
  return groupsPlain.items;
}