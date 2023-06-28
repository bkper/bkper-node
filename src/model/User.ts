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
  private wrapped: bkper.User;

  constructor(wrapped: bkper.User) {
    this.wrapped = wrapped;
  }

  /**
   * Gets the id of the User.
   * 
   * @returns The User's id
   */
  public getId(): string {
    return this.wrapped.id;
  }

  /**
   * Gets the name of the User.
   * 
   * @returns The User's name
   */
  public getName(): string {
    return this.wrapped.name;
  }  

  /**
   * Gets the full name of the User.
   * 
   * @returns The User's full name
   */
  public getFullName(): string {
    return this.wrapped.fullName;
  }  

  /**
   * Gets the [[Connections]] of the User.
   * 
   * @returns The retrieved Connection objects
   */
  public async getConnections(): Promise<Connection[]> {
    const json = await ConnectionService.listConnections();
    return json.map(c => new Connection(c));
  }

  /**
   * Gets a [[Connection]] of the User.
   * 
   * @param id - The Connection's id
   * 
   * @returns The retrieved Connection object
   */
  public async getConnection(id: string): Promise<Connection> {
    const json = await ConnectionService.getConnection(id);
    return new Connection(json);
  }

}
