
import fetch, { Response } from 'node-fetch'
import Utilities from './Utilities';
import OAuthTokenProvider from './OAuthTokenProvider';

type HttpMethod = "get"|"post"|"put"|"patch"|"delete";

export class HttpApiRequest  {

  private params: Array<{name: string, value: string}> = [];
  private url: string;
  private headers: {[key: string]: string} = {};
  private method: HttpMethod = 'get';
  private payload: any = null;

  public static API_KEY_: string;
  public static OAUTH_TOKEN_PROVIDER_: OAuthTokenProvider;
  
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

  public setContentType(contentType: string) {
    this.headers['Content-Type'] = contentType;
    return this;
  }

  public getContentType(): string {
    return this.headers['Content-Type'];
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


  async fetch(): Promise<Response> {

    this.headers['Authorization'] = `Bearer ${HttpApiRequest.OAUTH_TOKEN_PROVIDER_()}`;
    this.addParam('key', HttpApiRequest.API_KEY_);
    if (this.getContentType() == null) {
      this.setContentType('application/json; charset=UTF-8')
    }
    // this.httpRequest.setMuteHttpExceptions(true);

    var retries = 0;
    var sleepTime = 1000;
    while (true) {
      let response: Response;
      try {
        let body = this.payload;

        response = await fetch(this.getUrl(), {
          method: this.method,
          body: body,
          headers: this.headers,
        })
      } catch (addressUnavailable) {
        //Error on fetch service
        if (retries > 4) {
            throw addressUnavailable;
        } else {
          console.log("Retrying in " + (sleepTime / 1000) + " secs...");
          await Utilities.sleep(sleepTime);
          sleepTime = sleepTime * 2;
          retries++;
          continue;
        }
      }

      if (response.status >= 200 && response.status < 300) {
        //OK
        return response;      
      } else {
        //ERROR
        let responseText = await response.text();
        let error;
        let unknowError = false;
        try {
           error = JSON.parse(responseText).error;
        } catch (e) {
          unknowError = true;
        }
        if (unknowError || response.status == 429 || response.status >= 500) {
          //Retry in case of server error
          if (retries > 4) {
            if (unknowError) {
              throw responseText;
            } else {
              throw error.message;
            }
          } else {
            console.log("Retrying in " + (sleepTime / 1000) + " secs...");
            await Utilities.sleep(sleepTime);
            sleepTime = sleepTime * 2;
            retries++;
          }
        } else {
          throw error.message;
        }
      }
    }
  }
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
