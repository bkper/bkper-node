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
   * @returns The id of this User
   */
  public getId(): string {
    return this.wrapped.id;
  }

  /**
   * @returns The name of this Group
   */
  public getName(): string {
    return this.wrapped.name;
  }  

  /**
   * @returns The User connections
   */
  public async getConnections(): Promise<Connection[]> {
    const connectionsPlain = await ConnectionService.listConnections();
    return Utils.wrapObjects(new Connection(), connectionsPlain);
  }

  public async getConnection(id: string): Promise<Connection> {
    const connectionPlain = await ConnectionService.getConnection(id);
    return Utils.wrapObject(new Connection(), connectionPlain);
  }

}