import * as ConnectionService from '../service/connection-service';
import { Integration } from './Integration';

/**
 * This class defines a Connection from an [[User]] to an external service.
 * 
 * @public
 */
export class Connection {

  /** @internal */
  private wrapped: bkper.Connection;

  constructor(json?: bkper.Connection) {
    this.wrapped = json || {};
  }

  /**
   * Gets the wrapped plain json object of the Connection.
   * 
   * @returns The Connection wrapped plain json object
   */
  public json(): bkper.Connection {
    return this.wrapped;
  }

  /**
   * Gets the id of the Connection.
   * 
   * @returns The Connection's id
   */
  public getId(): string {
    return this.wrapped.id;
  }

  /**
   * Gets the agentId of the Connection.
   * 
   * @returns The Connection's agentId
   */
  public getAgentId(): string {
    return this.wrapped.agentId;
  }

  /**
   * Sets the Connection agentId.
   * 
   * @param agentId - The Connection agentId
   * 
   * @returns The Connection, for chainning
   */
  public setAgentId(agentId: string): Connection {
    this.wrapped.agentId = agentId;
    return this;
  }

  /**
   * Gets the name of the Connection.
   * 
   * @returns The Connection name
   */
  public getName(): string {
    return this.wrapped.name;
  }

  /**
   * Gets the email of the owner of the Connection.
   * 
   * @returns The Connection owner's email
   */
  public getEmail(): string {
    return this.wrapped.email;
  }

  /**
   * Sets the name of the Connection.
   * 
   * @param name - The name of the Connection
   * 
   * @returns The Connection, for chainning
   */
  public setName(name: string): Connection {
    this.wrapped.name = name;
    return this;
  }

  /**
   * Sets the universal unique identifier of the Connection.
   * 
   * @param uuid - The universal unique identifier of the Connection
   * 
   * @returns The Connection, for chainning
   */
  public setUUID(uuid: string): Connection {
    this.wrapped.uuid = uuid;
    return this;
  }

  /**
   * Gets the universal unique identifier of this Connection.
   * 
   * @returns The Connection's universal unique identifier name
   */
  public getUUID(): string {
    return this.wrapped.uuid;
  }

  /**
   * Gets the type of the Connection.
   * 
   * @returns The Connection type
   */
  public getType(): "APP" | "BANK" {
    return this.wrapped.type;
  }

  /**
   * Sets the Connection type.
   * 
   * @param type - The Connection type
   * 
   * @returns The Connection, for chainning
   */
  public setType(type: "APP" | "BANK"): Connection {
    this.wrapped.type = type;
    return this;
  }

  /**
   * Gets the custom properties stored in the Connection
   * 
   * @returns Object with key/value pair properties
   */
  public getProperties(): { [key: string]: string } {
    return this.wrapped.properties != null ? { ...this.wrapped.properties } : {};
  }

  /**
   * Sets the custom properties of the Connection.
   * 
   * @param properties - Object with key/value pair properties
   * 
   * @returns The Connection, for chainning
   */
  public setProperties(properties: { [key: string]: string }): Connection {
    this.wrapped.properties = { ...properties };
    return this;
  }

  /**
   * Gets the property value for given keys. First property found will be retrieved.
   * 
   * @param keys - The property key
   * 
   * @returns The retrieved property value
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
   * 
   * @returns The Connection, for chaining
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
   * Deletes a custom property stored in the Connection.
   * 
   * @param key - The property key
   * 
   * @returns The Connection, for chainning
   */
  public deleteProperty(key: string): Connection {
    this.setProperty(key, null);
    return this;
  }

  /**
   * Cleans any token property stored in the Connection.
   */
  public clearTokenProperties(): void {
    this.getPropertyKeys().filter(key => key.includes("token")).forEach(key => this.deleteProperty(key))
  }

  /**
   * Gets the custom properties keys stored in the Connection.
   * 
   * @returns The retrieved property keys
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

  /**
   * Gets the existing [[Integrations]] on the Connection.
   * 
   * @returns The existing Integration objects
   */
  public async getIntegrations(): Promise<Integration[]> {
    const integrationsPlain = await ConnectionService.listIntegrations(this.getId());
    const integrations = integrationsPlain.map(i => new Integration(i));
    return integrations;
  }

  /**
   * Performs create new Connection.
   * 
   * @returns The Connection, for chaining
   */
  public async create(): Promise<Connection> {
    this.wrapped = await ConnectionService.createConnection(this.wrapped);
    return this;
  }

}
