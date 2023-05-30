import { Connection } from "./Connection";
import * as ConnectionService from '../service/connection-service';
import * as Utils from '../utils';

/**
 * This class defines a User.
 * 
 * @public
 */
export class User {

  /** @internal */
  private wrapped: bkper.User


  constructor(wrapped: bkper.User) {
    this.wrapped = wrapped;
  }

  /**
   * @returns The id of the User
   */
  public getId(): string {
    return this.wrapped.id;
  }

  /**
   * @returns The name of the User
   */
  public getName(): string {
    return this.wrapped.name;
  }  

  /**
   * @returns The full name of the User
   */
  public getFullName(): string {
    return this.wrapped.fullName;
  }  

  /**
   * @returns The User connections
   */
  public async getConnections(): Promise<Connection[]> {
    const json = await ConnectionService.listConnections();
    return json.map(c => new Connection(c));
  }

  public async getConnection(id: string): Promise<Connection> {
    const json = await ConnectionService.getConnection(id);
    return new Connection(json)
  }

}