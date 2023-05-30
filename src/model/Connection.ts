import * as ConnectionService from '../service/connection-service';
import { Integration } from './Integration';
import * as Utils from '../utils';


/**
 * This class defines a Connection from an User to an external service.
 * 
 * @public
 */
export class Connection {

  /** @internal */
  private wrapped: bkper.Connection

  constructor(json?: bkper.Connection) {
    this.wrapped = json || {};
  }

  /**
   * @returns The wrapped plain json object
   */
  public json(): bkper.Book {
    return this.wrapped;
  }

  /**
   * @returns The id of this User
   */
  public getId(): string {
    return this.wrapped.id;
  }
  /**
   * @returns The Connection agentId
   */
  public getAgentId(): string {
    return this.wrapped.agentId;
  }

  /**
   * Sets the Connection agentId
   * 
   * @returns This Connection, for chainning.
   */
  public setAgentId(agentId: string): Connection {
    this.wrapped.agentId = agentId;
    return this;
  }

  /**
   * @returns The name of this Connection
   */
  public getName(): string {
    return this.wrapped.name;
  }

  /**
   * Sets the name of the Connection.
   * 
   * @returns This Connection, for chainning.
   */
  public setName(name: string): Connection {
    this.wrapped.name = name;
    return this;
  }

  /**
   * Sets the universal unique identifier of this connection.
   * 
   * @returns This Connection, for chainning.
   */
  public setUUID(uuid: string): Connection {
    this.wrapped.uuid = uuid;
    return this;
  }

  /**
   * Gets the custom properties stored in this Connection
   */
  public getProperties(): { [key: string]: string } {
    return this.wrapped.properties != null ? { ...this.wrapped.properties } : {};
  }

  /**
   * Sets the custom properties of the Connection
   * 
   * @param properties - Object with key/value pair properties
   * 
   * @returns This Connection, for chainning. 
   */
  public setProperties(properties: { [key: string]: string }): Connection {
    this.wrapped.properties = { ...properties };
    return this;
  }

  /**
   * Gets the property value for given keys. First property found will be retrieved
   * 
   * @param keys - The property key
   */
  public getProperty(...keys: string[]): string {
    for (let index = 0; index < keys.length; index++) {
      const key = keys[index];
      let value = this.wrapped.properties != null ? this.wrapped.properties[key] : null
      if (value != null && value.trim() != '') {
        return value;
      }
    }
    return null;
  }

  /**
   * Sets a custom property in the Connection.
   * 
   * @param key - The property key
   * @param value - The property value
   */
  public setProperty(key: string, value: string): Connection {
    if (key == null || key.trim() == '') {
      return this;
    }
    if (this.wrapped.properties == null) {
      this.wrapped.properties = {};
    }
    this.wrapped.properties[key] = value;
    return this;
  }

  /**
   * Delete a custom property
   * 
   * @param key - The property key
   * 
   * @returns This Connection, for chainning. 
   */
  public deleteProperty(key: string): Connection {
    this.setProperty(key, null);
    return this;
  }

  /**
   * Clean any token property
   */
  public clearTokenProperties(): void {
    this.getPropertyKeys().filter(key => key.includes("token")).forEach(key => this.deleteProperty(key))
  }

  /**
   * Gets the custom properties keys stored in the Connection.
   */
  public getPropertyKeys(): string[] {
    let properties = this.getProperties();
    let propertyKeys: string[] = []
    if (properties) {
      for (var key in properties) {
        if (Object.prototype.hasOwnProperty.call(properties, key)) {
          propertyKeys.push(key)
        }
      }
    }
    propertyKeys = propertyKeys.sort();
    return propertyKeys;
  }

  public async getIntegrations(): Promise<Integration[]> {
    const integrationsPlain = await ConnectionService.listIntegrations(this.getId());
    const integrations = Utils.wrapObjects(new Integration(), integrationsPlain);
    return integrations;
  }

  /**
   * Perform create new connection.
   */
  public async create(): Promise<Connection> {
    this.wrapped = await ConnectionService.createConnection(this.wrapped);
    return this;
  }


}