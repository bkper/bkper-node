
/**
 * This class defines a Integration from an [[User]] to an external service.
 * 
 * @public
 */
export class Integration {

  /** @internal */
  private wrapped: bkper.Integration

  constructor(json: bkper.Integration) {
    this.wrapped = json;
  }

  /**
   * Gets the wrapped plain json object of the Integration.
   * 
   * @returns The Integration wrapped plain json object
   */
  public json(): bkper.Integration {
    return this.wrapped;
  }

  /**
   * Gets the [[Book]] id of the Integration.
   * 
   * @returns The Integration's Book id
   */
  public getBookId(): string {
    return this.wrapped.bookId
  }

  /**
   * Gets the id of the Integration.
   * 
   * @returns This Integration's id
   */
  public getId(): string {
    return this.wrapped.id;
  }

  /**
   * Gets the name of the Integration.
   * 
   * @returns The Integration's name
   */
  public getName(): string {
    return this.wrapped.name;
  }

  /**
   * Gets the custom properties stored in the Integration.
   * 
   * @returns Object with key/value pair properties
   */
  public getProperties(): { [key: string]: string } {
    return this.wrapped.properties != null ? { ...this.wrapped.properties } : {};
  }

  /**
   * Sets the custom properties of the Integration.
   * 
   * @param properties - Object with key/value pair properties
   * 
   * @returns The Integration, for chainning
   */
  public setProperties(properties: { [key: string]: string }): Integration {
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
   * Sets a custom property in the Integration.
   * 
   * @param key - The property key
   * @param value - The property value
   * 
   * @returns The Integration, for chaining
   */
  public setProperty(key: string, value: string): Integration {
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
   * Deletes a custom property stored in the Integration.
   * 
   * @param key - The property key
   * 
   * @returns The Integration, for chainning
   */
  public deleteProperty(key: string): Integration {
    this.setProperty(key, null);
    return this;
  }

}
