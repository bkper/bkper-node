import { updateApp } from "../service/app-service";

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
   * Perform update App, applying pending changes.
   */
  public async update(): Promise<App> {
    this.wrapped = await updateApp(this.wrapped);
    return this;
  }   
}