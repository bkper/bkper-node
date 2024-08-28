import { HttpBooksApiV5Request } from "./http-api-request";

export async function listIntegrations(bookId: string): Promise<bkper.Integration[]> {
  const res = await new HttpBooksApiV5Request(`${bookId}/integrations`)
  .setMethod('GET')
  .fetch()
  return res?.data?.items || [];
}

export async function createIntegration(bookId: string, integration: bkper.Integration): Promise<bkper.Integration> {
  const res = await new HttpBooksApiV5Request(`${bookId}/integrations`)
  .setPayload(integration)
  .setMethod('POST')
  .fetch()
  return res.data;
}

export async function updateIntegration(bookId: string, integration: bkper.Integration): Promise<bkper.Integration> {
  const res = await new HttpBooksApiV5Request(`${bookId}/integrations`)
  .setPayload(integration)
  .setMethod('PUT')
  .fetch()
  return res.data;
}

export async function deleteIntegration(bookId: string, id: string): Promise<bkper.Integration> {
  const res = await new HttpBooksApiV5Request(`${bookId}/integrations/${id}`)
  .setMethod('DELETE')
  .fetch()
  return res.data;
}  
