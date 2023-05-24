/**
 * This class defines a Integration from an User to an external service.
 * 
 * @public
 */
export class Integration {

  /** @internal */
  private wrapped: bkper.Integration

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
   * @returns The name of this Integration
   */
  public getName(): string {
    return this.wrapped.name;
  }  

  /**
   * Gets the custom properties stored in this Integration
   */
  public getProperties(): { [key: string]: string } {
    return this.wrapped.properties != null ? { ...this.wrapped.properties } : {};
  }

  /**
   * Sets the custom properties of the Integration
   * 
   * @param properties - Object with key/value pair properties
   * 
   * @returns This Integration, for chainning. 
   */
  public setProperties(properties: { [key: string]: string }): Integration {
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
   * Sets a custom property in the Integration.
   * 
   * @param key - The property key
   * @param value - The property value
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
   * Delete a custom property
   * 
   * @param key - The property key
   * 
   * @returns This Integration, for chainning. 
   */
  public deleteProperty(key: string): Integration {
    this.setProperty(key, null);
    return this;
  }


}