import { createApp, updateApp } from "../service/app-service";

/**
 * Defines an App on Bkper.
 * 
 * Apps can be installed on Books by users.s
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

  /** @internal */
  setJson(json: any): App {
    this.wrapped = json;
    return this;
  }

  /**
   * Gets the App agent ID
   */
  public getId(): string {
    return this.wrapped.id;
  }

  /**
   * 
   * Sets the webhook url for development.
   * 
   * @returns This App, for chainning.
   */    
  public setWebhookUrlDev(webhookUrlDev: string): App {
    this.wrapped.webhookUrlDev = webhookUrlDev;
    return this;
  }

  /**
   * Sets the user emails the app is enabled when not yet published.
   * 
   * @returns This App, for chainning.
   */
  public setUserEmails(emails: string): App {
    this.wrapped.userEmails = emails;
    return this;
  }

  /**
   * Sets the email the developer.
   * 
   * For now, only a single developer other than the owner is allowed.
   * 
   * @returns This App, for chainning.
   */
  public setDeveloperEmail(email: string): App {
    this.wrapped.developerEmail = email;
    return this;
  }

  /**
   * Sets the Google OAuth client secret.
   * 
   * @returns This App, for chainning.
   */  
  public setClientSecret(clientSecret: string): App {
    this.wrapped.clientSecret = clientSecret;
    return this;
  }

  /**
   * Sets the Readme.md file as string.
   * 
   * @returns This App, for chainning.
   */  
  public setReadme(readme: string): App {
    this.wrapped.readme = readme;
    return this;
  }


  /**
   * Perform update App, applying pending changes.
   */
  public async update(): Promise<App> {
    this.wrapped = await updateApp(this.wrapped);
    return this;
  }   

  /**
   * Perform create App, applying pending changes.
   */
  public async create(): Promise<App> {
    this.wrapped = await createApp(this.wrapped);
    return this;
  }   
}