
import {GaxiosError, request, GaxiosResponse} from 'gaxios';
import { getOAuthToken, isLoggedIn } from '../auth/auth';
import OAuthTokenProvider from '../auth/OAuthTokenProvider';

type HttpMethod = "GET"|"POST"|"PUT"|"PATCH"|"DELETE";

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

    return request({
      url: this.getUrl(),
      method: this.method,
      headers: this.headers,
      data: this.payload,
      retryConfig: {
        retry: 5,
        onRetryAttempt: (err: GaxiosError) => {console.log(`${err.message} - Retrying... `)},
        retryDelay: 500
      }
    })

  }
}

async function getAccessToken() {
  let token: string = null;
  if (HttpApiRequest.OAUTH_TOKEN_PROVIDER) {
    token = await HttpApiRequest.OAUTH_TOKEN_PROVIDER.getOAuthToken();
  }

  if (token == null) {
    token = await getOAuthToken();
  }

  return token;
}

export class HttpBooksApiV2Request extends HttpApiRequest {
  constructor(service: string) {
    super(`v2/ledgers/${service}`)
  }
}

export class HttpBooksApiV3Request extends HttpApiRequest {
  constructor(service: string) {
    super(`v3/books/${service}`)
  }
}
