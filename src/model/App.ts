import { createApp, patchApp, updateApp } from "../service/app-service";

/**
 * Defines an App on Bkper.
 * 
 * Apps can be installed on Books by users.
 * 
 * @public
 */
export class App {

  /** @internal */
  private wrapped: bkper.App;

  /** @internal */
  constructor() {
    this.wrapped = {};
  }

  /**
   * 
   * Sets the webhook url for development.
   * 
   * @returns This App, for chainning.
   */    
  public setWebhookUrlDev(webhookUrlDev: string): App {
    if (webhookUrlDev) {
      this.wrapped.webhookUrlDev = webhookUrlDev;
    } else {
      this.wrapped.webhookUrlDev = 'null';
    }
    return this;
  }

  /**
   * Partially update an App, applying pending changes.
   */
  public async patch(): Promise<App> {
    await patchApp(this.wrapped);
    return this;
  }  

  /** @internal */
  async update(): Promise<App> {
    await updateApp(this.wrapped);
    return this;
  }     

  /** @internal */
  setJson(json: any): App {
    this.wrapped = json;
    return this;
  }

  /** @internal */
  getId(): string {
    return this.wrapped.id;
  }

  /** @internal */
  setUserEmails(emails: string): App {
    this.wrapped.userEmails = emails;
    return this;
  }

  /** @internal */
  public setDeveloperEmail(email: string): App {
    this.wrapped.developerEmail = email;
    return this;
  }

  /** @internal */
  public setClientSecret(clientSecret: string): App {
    this.wrapped.clientSecret = clientSecret;
    return this;
  }

  /** @internal */
  public setReadme(readme: string): App {
    this.wrapped.readme = readme;
    return this;
  }




  /** @internal */
  public async create(): Promise<App> {
    await createApp(this.wrapped);
    return this;
  }   
}