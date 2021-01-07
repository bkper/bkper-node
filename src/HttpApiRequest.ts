
import { Request, Response, Headers, BodyInit } from 'node-fetch'
import fetch from 'node-fetch'


let API_KEY_: string;
let OAUTH_TOKEN_PROVIDER_: OAuthTokenProvider;

/**
 * Interface to provide OAuth2 tokens upon calling the API.
 * 
 * Implement your own if you need to use one other than the default built-in [ScriptApp](https://developers.google.com/apps-script/reference/script/script-app#getoauthtoken).
 * 
 * Its specially usefull on environments where you can use the built-in ScriptApp services such as [Custom Functions in Google Sheets](https://developers.google.com/apps-script/guides/sheets/functions).
 * 
 * Learn more how to [OAuth 2 library](https://github.com/gsuitedevs/apps-script-oauth2) for Google Apps Script
 * 
 * @public
 */
interface OAuthTokenProvider {

  /**
   * A valid OAuth2 access token with **email** scope authorized.
   */
  getOAuthToken(): string;
}

/**
 * Sets the API key to identify the agent.
 * 
 * API keys are intended for agent identification only, not for authentication. [Learn more](https://cloud.google.com/endpoints/docs/frameworks/java/when-why-api-key)
 * 
 * See how to create your api key [here](https://cloud.google.com/docs/authentication/api-keys).
 *
 * @param key The key from GCP API &  Services Credentials console.
 * 
 * @public
 */
function setApiKey(key: string): void {
  API_KEY_ = key;
}

/**
 * Sets the [[OAuthTokenProvider]]. 
 * 
 * If none set, the default built-in [ScriptApp](https://developers.google.com/apps-script/reference/script/script-app#getoauthtoken) will be used.
 * 
 * @param tokenProvider The [[OAuthTokenProvider]] implementation.
 * 
 * @public
 */
function setOAuthTokenProvider(tokenProvider: OAuthTokenProvider) {
  OAUTH_TOKEN_PROVIDER_ = tokenProvider;
}


class HttpApiRequest  {

  private params: Array<{name: string, value: string}>;

  private httpRequest: Request;
  
  constructor(path: string) {
    this.httpRequest = new Request(`https://app.bkper.com/_ah/api/bkper/${path}`);
  }

  public setMethod(method: "get"|"post"|"put"|"patch"|"delete") {
    this.httpRequest.method = method;
    return this;
  }

  public setHeader(name: string, value: string) {
    if (this.httpRequest.headers == null) {
      this.httpRequest.headers = new Headers();
    }
    this.httpRequest.headers.set(name, value);
    return this;
  }

  public addParam(name: string, value: any) {
    if (this.params == null) {
      this.params = [];
    }
    this.params.push({name, value});
    return this;
  }

  public setContentType(contentType: string) {
    if (this.httpRequest.headers == null) {
      this.httpRequest.headers = new Headers();
    }
    this.httpRequest.headers.set('Content-Type', contentType);
    return this;
  }

  public getContentType(): string {
    if (this.httpRequest.headers == null) {
      this.httpRequest.headers = new Headers();
    }
    return this.httpRequest.headers.get('Content-Type');
  }

  public setPayload(payload: BodyInit) {
    this.httpRequest.body = payload as NodeJS.ReadableStream;
    return this;
  }

    /**
   * Gets the result url, with query params appended.
   */
  private getUrl(): string {
    let url = this.httpRequest.url;
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

    if (this.httpRequest.headers == null) {
      this.httpRequest.headers = new Headers();
    }

    this.httpRequest.headers.set('Authorization', `Bearer ${OAUTH_TOKEN_PROVIDER_.getOAuthToken()}`);
    this.addParam('key', API_KEY_);
    if (this.getContentType() == null) {
      this.setContentType('application/json; charset=UTF-8')
    }
    // this.httpRequest.setMuteHttpExceptions(true);

    //Rebuild url to append params
    this.httpRequest.url = this.getUrl();

    var retries = 0;
    var sleepTime = 1000;
    while (true) {
      let response: Response;
      try {
        response = await fetch(this.httpRequest);
      } catch (addressUnavailable) {
        //Error on fetch service
        if (retries > 4) {
            throw addressUnavailable;
        } else {
          Logger.log("Retrying in " + (sleepTime / 1000) + " secs...");
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
            Logger.log("Retrying in " + (sleepTime / 1000) + " secs...");
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
