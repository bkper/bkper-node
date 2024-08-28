import { HttpApiV5Request } from "./http-api-request";

export async function getConnection(id: string): Promise<bkper.Connection> {
  const res = await new HttpApiV5Request(`user/connections/${id}`)
    .setMethod('GET')
    .fetch()
  return res.data;

}

export async function listConnections(): Promise<bkper.Connection[]> {
  const res = await new HttpApiV5Request(`user/connections`)
    .setMethod('GET')
    .fetch()
  return res?.data?.items || [];
}

export async function createConnection(connection: bkper.Connection): Promise<bkper.Connection> {
  const res = await new HttpApiV5Request(`user/connections`)
    .setPayload(connection)
    .setMethod('POST')
    .fetch()
  return res.data;
}

export async function updateConnection(connection: bkper.Connection): Promise<bkper.Connection> {
  const res = await new HttpApiV5Request(`user/connections`)
    .setPayload(connection)
    .setMethod('PUT')
    .fetch()
  return res.data;
}

export async function deleteConnection(id: string): Promise<bkper.Connection> {
  const res = await new HttpApiV5Request(`user/connections/${id}`)
    .setMethod('DELETE')
    .fetch()
  return res.data;
}

export async function listIntegrations(connectionId: string): Promise<bkper.Integration[]> {
  const res = await new HttpApiV5Request(`user/connections/${connectionId}/integrations`)
  .setMethod('GET')
  .fetch()
  return res?.data?.items || [];
}