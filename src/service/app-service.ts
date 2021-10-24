import { HttpApiRequest } from "./HttpApiRequest";

export async function createApp(app: bkper.App): Promise<bkper.App> {
  var payload = JSON.stringify(app);
  var response = await new HttpApiRequest(`v5/apps`).setMethod('POST').setPayload(payload).fetch();
  return response.data;
}

export async function updateApp(app: bkper.App): Promise<bkper.App> {
  var payload = JSON.stringify(app);
  var response = await new HttpApiRequest(`v5/apps`).setMethod('PUT').setPayload(payload).fetch();
  return response.data;
}

export async function patchApp(app: bkper.App): Promise<bkper.App> {
  var payload = JSON.stringify(app);
  var response = await new HttpApiRequest(`v5/apps`).setMethod('PATCH').setPayload(payload).fetch();
  return response.data;
}

