
import { getOAuthToken, isLoggedIn } from '../auth/local-auth-service';
import { GaxiosError, request, GaxiosResponse } from 'gaxios';
import https from 'https';
import { NODE_ENV_DEV } from '../utils';
import { Config } from '../model/Config';
import { config } from 'dotenv/types';

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
const httpsAgent = new https.Agent({ keepAlive: true });

export interface HttpError {
  errors:
  {
    domain: string,
    reason: string,
    message: string
  }[]
  code: number,
  message: string
}

export interface HttpResponse {
  data: any
}

export class HttpApiRequest {

  private params: Array<{ name: string, value: string }> = [];
  private url: string;
  private headers: { [key: string]: string } = {};
  private method: HttpMethod = 'GET';
  private payload: any = null;

  public static config: Config = {}

  constructor(path: string) {
    this.url = `${HttpApiRequest.config.apiBaseUrl || "https://app.bkper.com/_ah/api/bkper"}/${path}`;
  }

  public setMethod(method: HttpMethod) {
    this.method = method;
    return this;
  }

  public setHeader(name: string, value: string) {
    if (value) {
      this.headers[name] = value;
    }
    return this;
  }

  public addParam(name: string, value: any) {
    if (value) {
      this.params.push({ name, value });
    }
    return this;
  }


  public setPayload(payload: any) {
    this.payload = typeof payload === "string" ? payload : JSON.stringify(payload);
    return this;
  }

  /**
 * Gets the result url, with query params appended.
 */
  private getUrl(): string {
    let url = this.url;
    if (this.params != null) {
      let i = 0
      if (url.indexOf('?') < 0) {
        url += '?';
      } else {
        i++;
      }
      for (const param of this.params) {
        if (i > 0) {
          url += "&";
        }
        var key = param.name;
        var value = param.value;
        if (value != null) {
          url += key + "=" + encodeURIComponent(value);
          i++;
        }
      }

    }
    return url
  }


  async fetch(): Promise<HttpResponse> {
    this.addCustomHeaders();
    this.headers['Authorization'] = `Bearer ${await getAccessToken()}`;
    this.addParam('key', await getApiKey());
    // this.httpRequest.setMuteHttpExceptions(true);
    const url = this.getUrl();
    try {
      return await request({
        url: url,
        method: this.method,
        headers: this.headers,
        body: this.payload,
        agent: url.startsWith('https') ?  httpsAgent : null,
        retryConfig: {
          httpMethodsToRetry: ['GET', 'PUT', 'POST', 'PATCH', 'HEAD', 'OPTIONS', 'DELETE'],
          statusCodesToRetry: [[100, 199], [429, 429], [500, 599]],
          retry: process.env.NODE_ENV == NODE_ENV_DEV ? 0 : 6,
          onRetryAttempt: (err: GaxiosError) => { console.log(`${err.message} - Retrying... `) },
          retryDelay: 1000
        }
      })
    } catch (e) {
      const customError = HttpApiRequest.config.requestErrorHandler ? HttpApiRequest.config.requestErrorHandler(e) : undefined;
      if (customError) {
        throw customError
      } else {
        //Default error handler
        let error: HttpError = e.response.data?.error
        if (error) {
          if (error.code == 404) {
            return { data: null };
          } else {
            throw error.message;
          }
        } else {
          throw e.message;
        }
      }
    }
  }

  private async addCustomHeaders() {
    if (HttpApiRequest.config.requestHeadersProvider) {
      const headers = await HttpApiRequest.config.requestHeadersProvider();
      Object.entries(headers).forEach(([key, value]) => this.setHeader(key, value));
    }
  }
}


async function getApiKey() {
  if (HttpApiRequest.config.apiKeyProvider) {
    return await HttpApiRequest.config.apiKeyProvider()
  }
  return null;
}

async function getAccessToken() {
  let token: string = null;
  if (HttpApiRequest.config.oauthTokenProvider) {
    token = await HttpApiRequest.config.oauthTokenProvider();
  }

  if (isLoggedIn() && token == null) {
    token = await getOAuthToken();
  }

  if (token) {
    token = token.replace('Bearer ', '')
    token = token.replace('bearer ', '')
  }

  return token;
}

export class HttpBooksApiV5Request extends HttpApiRequest {
  constructor(service: string) {
    super(`v5/books/${service}`)
  }
}

export class HttpApiV5Request extends HttpApiRequest {
  constructor(service: string) {
    super(`v5/${service}`)
  }
}
