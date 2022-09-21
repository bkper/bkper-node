import * as AccountService  from '../service/account-service'
import * as GroupService  from '../service/group-service'
import { Book } from './Book';
import { AccountType } from './Enums';
import { Group } from './Group';
import { getRepresentativeValue, normalizeText, round } from '../utils';
import { Amount } from './Amount';
import * as Utils from '../utils';

/**
 * 
 * This class defines an [Account](https://en.wikipedia.org/wiki/Account_(bookkeeping)) of a [[Book]].
 * 
 * It mantains a balance of all amount [credited and debited](http://en.wikipedia.org/wiki/Debits_and_credits) in it by [[Transactions]].
 * 
 * An Account can be grouped by [[Groups]].
 * 
 * @public
 */
export class Account {

  /** @internal */
  wrapped: bkper.Account;
  
  /** @internal */
  book: Book;

  /**
   * 
   * @returns The wrapped plain json object
   */
  public json(): bkper.Account {
    return this.wrapped;
  }
  
  /**
   * Gets the account internal id.
   */
  public getId(): string {
    return this.wrapped.id;
  }

  

  /**
   * Gets the account name.
   */
  public getName(): string {
    return this.wrapped.name;
  }

  /**
   * 
   * Sets the name of the Account.
   * 
   * @returns This Account, for chainning.
   */    
  public setName(name: string): Account {
    this.wrapped.name = name;
    return this;
  }


  /**
   * @returns The name of this account without spaces or special characters.
   */
  public getNormalizedName(): string {
    if (this.wrapped.normalizedName) {
      return this.wrapped.normalizedName;
    } else {
      return normalizeText(this.getName())
    }
  }

  /**
   * @returns The type for of this account.
   */
  public getType(): AccountType {
    return this.wrapped.type as AccountType;
  }

  /**
   * 
   * Sets the type of the Account.
   * 
   * @returns This Account, for chainning
   */   
  public setType(type: AccountType): Account {
    this.wrapped.type = type;
    return this;
  }

  /**
   * Gets the custom properties stored in this Account.
   */  
  public getProperties(): {[key: string]: string} {
    return this.wrapped.properties != null ?  {...this.wrapped.properties} : {};
  }

  /**
   * Sets the custom properties of the Account
   * 
   * @param properties - Object with key/value pair properties
   * 
   * @returns This Account, for chainning. 
   */
  public setProperties(properties: {[key: string]: string}): Account {
    this.wrapped.properties = {...properties};
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
      let value = this.wrapped.properties != null ?  this.wrapped.properties[key] : null 
      if (value != null && value.trim() != '') {
        return value;
      }
    }
    return null;
  }


  /**
   * Sets a custom property in the Account.
   * 
   * @param key - The property key
   * @param value - The property value
   * 
   * @returns This Account, for chainning. 
   */
  public setProperty(key: string, value: string): Account {
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
   * @returns This Account, for chainning. 
   */
  public deleteProperty(key: string): Account {
    this.setProperty(key, null);
    return this;
  }

  /**
   * Gets the balance based on credit nature of this Account.
   * @deprecated Use `Book.getBalancesReport` instead.
   * @returns The balance of this account.
   */
  public getBalance(): Amount {
    var balance = new Amount('0');
    if (this.wrapped.balance != null) {
      balance = round(this.wrapped.balance, this.book.getFractionDigits());
    }
    return balance;
  }

  /**
   * Gets the raw balance, no matter credit nature of this Account.
   * @deprecated Use `Book.getBalancesReport` instead.
   * @returns The balance of this account.
   */  
     public getBalanceRaw(): Amount {
      var balance = new Amount('0');
      if (this.wrapped.balance != null) {
        balance = round(this.wrapped.balance, this.book.getFractionDigits());
      }
      return balance;
    }

  /**
   * Tell if this account is archived.
   */  
  public isArchived(): boolean {
    return this.wrapped.archived;
  }

  /**
   * Set account archived/unarchived.
   * 
   * @returns This Account, for chainning.
   */
  public setArchived(archived: boolean): Account {
    this.wrapped.archived = archived;
    return this;
  }

  /**
   * Tell if the Account has any transaction already posted.
   * 
   * Accounts with transaction posted, even with zero balance, can only be archived.
   */
  public hasTransactionPosted(): boolean {
    return this.wrapped.hasTransactionPosted;
  }
  

  /**
   * 
   * Tell if the account is permanent.
   * 
   * Permanent Accounts are the ones which final balance is relevant and keep its balances over time.
   *  
   * They are also called [Real Accounts](http://en.wikipedia.org/wiki/Account_(accountancy)#Based_on_periodicity_of_flow)
   * 
   * Usually represents assets or tangibles, capable of being perceived by the senses or the mind, like bank accounts, money, debts and so on.
   * 
   * @returns True if its a permanent Account
   */
  public isPermanent(): boolean {
    return this.wrapped.permanent;
  }

  /**
   * Tell if the account has a Credit nature or Debit otherwise
   * 
   * Credit accounts are just for representation purposes. It increase or decrease the absolute balance. It doesn't affect the overall balance or the behavior of the system.
   * 
   * The absolute balance of credit accounts increase when it participate as a credit/origin in a transaction. Its usually for Accounts that increase the balance of the assets, like revenue accounts.
   * 
   * ```
   *         Crediting a credit
   *   Thus ---------------------> account increases its absolute balance
   *         Debiting a debit
   * 
   * 
   *         Debiting a credit
   *   Thus ---------------------> account decreases its absolute balance
   *         Crediting a debit
   * ```
   * 
   * As a rule of thumb, and for simple understanding, almost all accounts are Debit nature (NOT credit), except the ones that "offers" amount for the books, like revenue accounts.
   */
  public isCredit(): boolean {
    return this.wrapped.credit;
  }


  /**
   * Get the [[Groups]] of this account.
   */  
  public async getGroups(): Promise<Group[]> {
    let groups = await GroupService.getGroupsByAccountId(this.book.getId(), this.getId());
    let groupsObj = Utils.wrapObjects(new Group(), groups);
    for (const group of groupsObj) {
      group.book = this.book;
    }
    return groupsObj;
  }

  /**
   * Sets the groups of the Account.
   * 
   * @returns This Account, for chainning.
   */  
  public setGroups(groups: Group[] | bkper.Group[]): Account {
    this.wrapped.groups = null;
    if (groups != null) {
      groups.forEach(group => this.addGroup(group))
    }
    return this;
  }
  
  /**
   * Add a group to the Account.
   * 
   * @returns This Account, for chainning.
   */
  public addGroup(group: Group | bkper.Group): Account {
    if (this.wrapped.groups == null) {
      this.wrapped.groups = [];
    }

    if (group instanceof Group) {
      this.wrapped.groups.push(group.wrapped)
    } else {
      this.wrapped.groups.push(group)
    }

    return this;
  }

  /**
   * Remove a group from the Account.
   */
  public async removeGroup(group: string | Group): Promise<Account> {

    if (this.wrapped.groups != null) {
      let groupObject: Group = null;
      if (group instanceof Group) {
        groupObject = group;
      } else if (typeof group == "string") {
        groupObject = await this.book.getGroup(group);
      }
      if (groupObject) {
        for (let i = 0; i < this.wrapped.groups.length; i++) {
          const groupId = this.wrapped.groups[i];
          if (groupId == groupObject.getId()) {
            this.wrapped.groups.splice(i, 1);
          }
        }
      }
    }

    return this;

  }

  /**
   * Tell if this account is in the [[Group]]
   * 
   * @param  group - The Group name, id or object
   */
  public async isInGroup(group: string | Group): Promise<boolean> {
    if (group == null) {
      return false;
    }

    //Group object
    if (group instanceof Group) {
      return this.isInGroupObject_(group);
    }

    //id or name
    var foundGroup = await this.book.getGroup(group);
    if (foundGroup == null) {
      return false;
    }
    return this.isInGroupObject_(foundGroup);
  }

  /** @internal */
  private isInGroupObject_(group: Group): boolean {
    if (this.wrapped.groups == null) {
      return false;
    }

    for (var i = 0; i < this.wrapped.groups.length; i++) {
      if (this.wrapped.groups[i] == group.getId()) {
        return true;
      }
    }
    return false;
  }

  /**
   * Perform create new account.
   */
  public async create(): Promise<Account> {
    this.wrapped = await AccountService.createAccount(this.book.getId(), this.wrapped);
    return this;
  }   

  /**
   * Perform update account, applying pending changes.
   */
  public async update(): Promise<Account> {
    this.wrapped = await AccountService.updateAccount(this.book.getId(), this.wrapped);
    return this;

  }   

  /**
   * Perform delete account.
   */
  public async remove(): Promise<Account> {
    this.wrapped = await AccountService.deleteAccount(this.book.getId(), this.wrapped);
    return this;
  }   

}
