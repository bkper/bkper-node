import { HttpApiRequest } from "./http-api-request";

export async function createApp(app: bkper.App): Promise<bkper.App> {
  var response = await new HttpApiRequest(`v5/apps`).setMethod('POST').setPayload(app).fetch();
  return response.data;
}

export async function updateApp(app: bkper.App): Promise<bkper.App> {
  var response = await new HttpApiRequest(`v5/apps`).setMethod('PUT').setPayload(app).fetch();
  return response.data;
}

export async function patchApp(app: bkper.App): Promise<bkper.App> {
  var response = await new HttpApiRequest(`v5/apps`).setMethod('PATCH').setPayload(app).fetch();
  return response.data;
}

