import { HttpApiV5Request } from "./HttpApiRequest";

export async function getUser(): Promise<bkper.User> {
  const res = await new HttpApiV5Request(`user`).setMethod('GET').fetch()
  return res.data;
}