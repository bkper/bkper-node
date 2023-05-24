import * as GroupService from '../service/group-service';
import { normalizeText } from "../utils";
import { Account } from './Account';
import { Book } from "./Book";
import { AccountType } from './Enums';
import * as Utils from '../utils';

/**
 * This class defines a Group of [[Accounts]].
 * 
 * Accounts can be grouped by different meaning, like Expenses, Revenue, Assets, Liabilities and so on
 * 
 * Its useful to keep organized and for high level analysis.
 * 
 * @public
 */
export class Group {

  /** @internal */
  private wrapped: bkper.Group

  accounts: Set<Account>

  /** @internal */
  book: Book

  /**
   * 
   * @returns The wrapped plain json object
   */
  public json(): bkper.Group {
    return this.wrapped;
  }
  
  /**
   * @returns The id of this Group
   */
  public getId(): string {
    return this.wrapped.id;
  }

  /**
   * @returns The parent Group
   */
  public async getParent(): Promise<Group> {
    if (this.wrapped.parent) {
      return await this.book.getGroup(this.wrapped.parent.id)
    } else {
      return null;
    }
  }

  /**
   * Sets the parent Group.
   * 
   * @returns This Group, for chainning.
   */  
  public setParent(group: Group | null): Group {
    if (group) {
      this.wrapped.parent = {id: group.getId(), name: group.getName(), normalizedName: group.getNormalizedName()};
    } else {
      this.wrapped.parent = null;
    }
    return this;
  }

  /**
   * @returns The name of this Group
   */
  public getName(): string {
    return this.wrapped.name;
  }

  /**
   * Sets the name of the Group.
   * 
   * @returns This Group, for chainning.
   */
  public setName(name: string): Group {
    this.wrapped.name = name;
    return this;
  }

  /**
   * @returns The name of this group without spaces and special characters
   */
  public getNormalizedName(): string {
    if (this.wrapped.normalizedName) {
      return this.wrapped.normalizedName;
    } else {
      return normalizeText(this.getName())
    }
  }

  /**
   * @returns All Accounts of this group.
   */
  public async getAccounts(): Promise<Account[]> {
    let accountsPlain = await GroupService.getAccounts(this.book.getId(), this.getId());
    if (!accountsPlain) {
      return [];
    }
    let accounts = Utils.wrapObjects(new Account(), accountsPlain);
    for (const account of accounts) {
      account.book = this.book;
    }
    return accounts;
  }


  /**
   * @returns True if this group has any account in it
   */
  public hasAccounts(): boolean {
    return this.wrapped.hasAccounts;
  }

  /**
   * @returns The type for of the accounts of this group. Null if mixed
   */
  public getType(): AccountType {
    return this.wrapped.type as AccountType;
  }

  /**
   * Gets the custom properties stored in this Group
   */
  public getProperties(): { [key: string]: string } {
    return this.wrapped.properties != null ? { ...this.wrapped.properties } : {};
  }

  /**
   * Sets the custom properties of the Group
   * 
   * @param properties - Object with key/value pair properties
   * 
   * @returns This Group, for chainning. 
   */
  public setProperties(properties: { [key: string]: string }): Group {
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
   * Sets a custom property in the Group.
   * 
   * @param key - The property key
   * @param value - The property value
   */
  public setProperty(key: string, value: string): Group {
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
   * @returns This Group, for chainning. 
   */
  public deleteProperty(key: string): Group {
    this.setProperty(key, null);
    return this;
  }

  /**
   * Tell if the Group is hidden on main transactions menu
   */
  public isHidden(): boolean {
    return this.wrapped.hidden;
  }

  /**
   *  Hide/Show group on main menu.
   */
  public setHidden(hidden: boolean): Group {
    this.wrapped.hidden = hidden;
    return this;
  }

  /**
   * Perform create new group.
   */
  public async create(): Promise<Group> {
    this.wrapped = await GroupService.createGroup(this.book.getId(), this.wrapped);
    this.book.updateGroupCache(this);
    return this;
  }

  /**
   * Perform update group, applying pending changes.
   */
  public async update(): Promise<Group> {
    this.wrapped = await GroupService.updateGroup(this.book.getId(), this.wrapped);
    this.book.updateGroupCache(this);
    return this;

  }

  /**
   * Perform delete group.
   */
  public async remove(): Promise<Group> {
    this.wrapped = await GroupService.deleteGroup(this.book.getId(), this.wrapped);
    this.book.removeGroupCache(this);
    return this;
  }

}
