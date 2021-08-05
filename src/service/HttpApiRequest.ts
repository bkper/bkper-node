
import { getOAuthToken, isLoggedIn } from '../auth/local-auth-service';
import { GaxiosError, request, GaxiosResponse } from 'gaxios';
import { OAuthTokenProvider } from '../auth/OAuthTokenProvider';
import https from 'https';
import { NODE_ENV_DEV } from '../utils';

type HttpMethod = "GET"|"POST"|"PUT"|"PATCH"|"DELETE";
const httpsAgent = new https.Agent({keepAlive: true});

interface HttpError {
  error: {
    errors:
      {
        domain: string,
        reason: string,
        message: string
      }[]
    code: number,
    message: string
  }
}

export class HttpApiRequest  {

  private params: Array<{name: string, value: string}> = [];
  private url: string;
  private headers: {[key: string]: string} = {};
  private method: HttpMethod = 'GET';
  private payload: any = null;

  public static API_KEY: string;
  public static OAUTH_TOKEN_PROVIDER: OAuthTokenProvider;
  
  constructor(path: string) {
    this.url = `https://app.bkper.com/_ah/api/bkper/${path}`;
  }

  public setMethod(method: HttpMethod) {
    this.method = method;
    return this;
  }

  public setHeader(name: string, value: string) {
    this.headers[name] = value;
    return this;
  }

  public addParam(name: string, value: any) {
    this.params.push({name, value});
    return this;
  }


  public setPayload(payload: any) {
    this.payload = payload;
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


  async fetch(): Promise<GaxiosResponse> {

    this.headers['Authorization'] = `Bearer ${await getAccessToken()}`;
    this.addParam('key', HttpApiRequest.API_KEY);
    // this.httpRequest.setMuteHttpExceptions(true);
    const url = this.getUrl();
    try {
      return await request({
        url: url,
        method: this.method,
        headers: this.headers,
        body: this.payload,
        agent: httpsAgent,
        retryConfig: {
          httpMethodsToRetry: ['GET','PUT','POST','PATCH','HEAD','OPTIONS','DELETE'],
          statusCodesToRetry: [[100, 199], [429, 429], [500, 599]],
          retry: process.env.NODE_ENV == NODE_ENV_DEV ? 0 : 6,
          onRetryAttempt: (err: GaxiosError) => {console.log(`${err.message} - Retrying... `)},
          retryDelay: 1000
        }
      })
    } catch (e) {
      let error: HttpError = e.response.data
      if (error.error) {
        throw error.error.message;
      } else {
        throw e.message;
      }
    }

  }
}

async function getAccessToken() {
  let token: string = null;
  if (HttpApiRequest.OAUTH_TOKEN_PROVIDER) {
    token = await HttpApiRequest.OAUTH_TOKEN_PROVIDER();
  }

  if (isLoggedIn() && token == null) {
    token = await getOAuthToken();
  }

  return token;
}

export class HttpBooksApiV2Request extends HttpApiRequest {
  constructor(service: string) {
    super(`v2/ledgers/${service}`)
  }
}

export class HttpBooksApiV4Request extends HttpApiRequest {
  constructor(service: string) {
    super(`v4/books/${service}`)
  }
}
