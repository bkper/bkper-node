import { HttpApiV5Request } from "./http-api-request";

export async function getUser(): Promise<bkper.User> {
  const res = await new HttpApiV5Request(`user`).setMethod('GET').fetch()
  return res.data;
}