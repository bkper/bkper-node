import { HttpApiRequest } from "./HttpApiRequest";

export async function updateApp(app: bkper.App): Promise<bkper.App> {
  var payload = JSON.stringify(app);
  var response = await new HttpApiRequest(`v3/apps`).setMethod('PUT').setPayload(payload).fetch();
  return response.data;
}





