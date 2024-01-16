import { File } from "./File";
import { Book } from "./Book";
import { Account } from "./Account";
import * as TransactionService from '../service/transaction-service';
import * as Utils from '../utils';
import { Amount } from './Amount';


/**
 * 
 * This class defines a Transaction between [credit and debit](http://en.wikipedia.org/wiki/Debits_and_credits) [[Accounts]].
 *
 * A Transaction is the main entity on the [Double Entry](http://en.wikipedia.org/wiki/Double-entry_bookkeeping_system) [Bookkeeping](http://en.wikipedia.org/wiki/Bookkeeping) system.
 * 
 * @public
 */
export class Transaction {

  /** @internal */
  wrapped: bkper.Transaction


  /** @internal */
  book: Book;

  /**
   * 
   * @returns The wrapped plain json object
   */
  public json(): bkper.Transaction {
    return this.wrapped;
  }

  /**
   * @returns The id of the Transaction.
   */
  public getId(): string {
    return this.wrapped.id;
  }

  /**
   * @returns The id of the agent that created this transaction
   */
  public getAgentId(): string {
    return this.wrapped.agentId;
  }

  /**
   * Remote ids are used to avoid duplication.
   * 
   * @returns The remote ids of the Transaction.
   */
  public getRemoteIds(): string[] {
    return this.wrapped.remoteIds;
  }

  /**
   * Add a remote id to the Transaction.
   * 
   * @param remoteId - The remote id to add.
   * 
   * @returns This Transaction, for chainning.
   */
  public addRemoteId(remoteId: string): Transaction {
    if (this.wrapped.remoteIds == null) {
      this.wrapped.remoteIds = [];
    }
    if (remoteId) {
      this.wrapped.remoteIds.push(remoteId);
    }
    return this;
  }

  /**
   * @returns True if transaction was already posted to the accounts. False if is still a Draft.
   */
  public isPosted(): boolean {
    return this.wrapped.posted;
  }

  /**
   * @returns True if transaction is checked.
   */
  public isChecked(): boolean {
    return this.wrapped.checked;
  }

  /**
    * Set the check state of the Transaction.
    * 
    * @param checked - The check state.
    * 
    * @returns This Transaction, for chainning.
  */
  public setChecked(checked: boolean): Transaction {
    this.wrapped.checked = checked;
    return this;
  }

  /**
   * @returns True if transaction is in trash.
   */
  public isTrashed(): boolean {
    return this.wrapped.trashed;
  }

  /**
   * @returns All #hashtags used on the transaction.
   */
  public getTags(): string[] {
    return this.wrapped.tags;
  }


  /**
   * @returns All urls of the transaction.
   */
  public getUrls(): string[] {
    return this.wrapped.urls;
  }

  /**
   * Sets the Transaction urls. Url starts with https://
   * 
   * @param urls - The urls array.
   * 
   * @returns This Transaction, for chainning.
   */
  public setUrls(urls: string[]): Transaction {
    this.wrapped.urls = null;
    if (urls) {
      urls.forEach(url => {
        this.addUrl(url);
      });
    }
    return this;
  }

  /**
   * Add a url to the Transaction. Url starts with https://
   * 
   * @param url - The url to add.
   * 
   * @returns This Transaction, for chainning.
   */
  public addUrl(url: string): Transaction {
    if (this.wrapped.urls == null) {
      this.wrapped.urls = [];
    }
    if (url) {
      this.wrapped.urls.push(url);
    }
    return this;
  }

  /**
   * @returns The files attached to the transaction.
   */
  public getFiles(): File[] {
    if (this.wrapped.files && this.wrapped.files.length > 0) {
      const files = Utils.wrapObjects(new File(), this.wrapped.files);
      if (files != null) {
        for (const file of files) {
          file.book = this.book;
        }
      }
      return files
    } else {
      return [];
    }
  }

  /**
   * 
   * Adds a file attachment to the Transaction.
   * 
   * Files not previously created in the Book will be automatically created. 
   * 
   * @param file - The file to add
   * 
   * @returns This Transaction, for chainning.
   */
  public async addFile(file: File): Promise<Transaction> {

    if (this.wrapped.files == null) {
      this.wrapped.files = [];
    }

    //Make sure file is already created
    if (file.getId() == null || file.book.getId() != this.book.getId()) {
      file.book = this.book;
      file = await file.create();
    }
    this.wrapped.files.push(file.wrapped)
    return this;
  }

  /**
   * Check if the transaction has the specified tag.
   */
  public hasTag(tag: string): boolean {

    var tags = this.getTags();

    for (var i = 0; i < tags.length; i++) {
      if (tags[i] == tag) {
        return true;
      }
    }

    return false;
  }


  /**
   * Gets the custom properties stored in this Transaction.
   */
  public getProperties(): { [key: string]: string } {
    return this.wrapped.properties != null ? { ...this.wrapped.properties } : {};
  }

  /**
   * Sets the custom properties of the Transaction
   * 
   * @param properties - Object with key/value pair properties
   * 
   * @returns This Transaction, for chainning. 
   */
  public setProperties(properties: { [key: string]: string }): Transaction {
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
   * Gets the custom properties keys stored in this Transaction.
   */  
    public getPropertyKeys(): string[] {
      let properties = this.getProperties();
      let propertyKeys:string[] = []
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
   * Sets a custom property in the Transaction.
   * 
   * @param key - The property key
   * @param value - The property value
   * 
   * @returns This Transaction, for chainning. 
   */
  public setProperty(key: string, value: string): Transaction {
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
   * @returns This Transaction, for chainning. 
   */
  public deleteProperty(key: string): Transaction {
    this.setProperty(key, null);
    return this;
  }


  //ORIGIN ACCOUNT
  /**
   * @returns The credit account. The same as origin account.
   */
  public async getCreditAccount(): Promise<Account> {
    if (!this.wrapped.creditAccount) {
      return null;
    }
    return await this.book.getAccount(this.wrapped.creditAccount.id);

  }

  /**
   * @returns The credit account name.
   */
  public async getCreditAccountName(): Promise<string> {
    if (await this.getCreditAccount() != null) {
      return (await this.getCreditAccount()).getName();
    } else {
      return "";
    }
  }

  /**
   * 
   * Sets the credit/origin Account of the Transaction. Same as from().
   * 
   * @param account - Account id, name or object.
   * 
   * @returns This Transaction, for chainning.
   */
  public setCreditAccount(account: Account | bkper.Account): Transaction {
    if (account instanceof Account) {
      if (account != null && account.getId() != null) {
        this.wrapped.creditAccount = account.json()
      }
    } else {
      if (account != null && account.id != null) {
        this.wrapped.creditAccount = account
      }
    }
    return this;
  }

  /**
   * 
   * Sets the credit/origin Account of the Transaction. Same as setCreditAccount().
   * 
   * @param account - Account id, name or object.
   * 
   * @returns This Transaction, for chainning.
   */
  public from(account: Account | bkper.Account): Transaction {
    return this.setCreditAccount(account);
  }


  //DESTINATION ACCOUNT
  /**
   * @returns The debit account. The same as destination account.
   * 
   */
  public async getDebitAccount(): Promise<Account> {
    if (!this.wrapped.debitAccount) {
      return null;
    }
    return await this.book.getAccount(this.wrapped.debitAccount.id);
  }

  /**
   * @returns The debit account name.
   */
  public async getDebitAccountName(): Promise<string> {
    if (await this.getDebitAccount() != null) {
      return (await this.getDebitAccount()).getName();
    } else {
      return "";
    }
  }

  /**
   * 
   * Sets the debit/destination Account of the Transaction. Same as to().
   * 
   * @param account - Account id, name or object.
   * 
   * @returns This Transaction, for chainning.
   */
  public setDebitAccount(account: Account | bkper.Account): Transaction {
    if (account instanceof Account) {
      if (account != null && account.getId() != null) {
        this.wrapped.debitAccount = account.json()
      }
    } else {
      if (account != null && account.id != null) {
        this.wrapped.debitAccount = account
      }
    }
    return this;
  }

  /**
   * 
   * Sets the debit/destination Account of the Transaction. Same as setDebitAccount().
   * 
   * @param account - Account id, name or object.
   * 
   * @returns This Transaction, for chainning.
   */
  public to(account: Account | bkper.Account): Transaction {
    return this.setDebitAccount(account);
  }


  //AMOUNT
  /**
   * @returns The amount of the transaction.
   */
  public getAmount(): Amount {
    return this.wrapped.amount != null && this.wrapped.amount.trim() != '' ? new Amount(this.wrapped.amount) : null;
  }

  /**
   * 
   * Sets the amount of the Transaction.
   * 
   * @returns This Transaction, for chainning.
   */
  public setAmount(amount: Amount | number | string): Transaction {

    if (typeof amount == "string") {
      amount = Utils.parseValue(amount, this.book.getDecimalSeparator()) + '';
      this.wrapped.amount = amount.toString();
      return this;
    }

    amount = new Amount(amount);

    if (amount.eq(0)) {
      this.wrapped.amount = null;
      return this;
    }

    this.wrapped.amount = amount.abs().toString();

    return this;
  }

  /**
   * Get the absolute amount of this transaction if the given account is at the credit side, else null.
   * 
   * @param account - The account object, id or name.
   */
  public async getCreditAmount(account: Account | string): Promise<Amount> {
    let accountObject = await this.getAccount_(account);
    if (this.isCredit(accountObject)) {
      return this.getAmount();
    }
    return null;
  }

  /**
   * Gets the absolute amount of this transaction if the given account is at the debit side, else null.
   * 
   * @param account - The account object, id or name.
   */
  public async getDebitAmount(account: Account | string): Promise<Amount> {
    let accountObject = await this.getAccount_(account);
    if (this.isDebit(accountObject)) {
      return this.getAmount();
    }
    return null;
  }

  /**
   * Gets the [[Account]] at the other side of the transaction given the one in one side.
   * 
   * @param account - The account object, id or name.
   */
  public async getOtherAccount(account: Account | string): Promise<Account> {
    let accountObject = await this.getAccount_(account);
    if (this.isCredit(accountObject)) {
      return await this.getDebitAccount();
    }
    if (this.isDebit(accountObject)) {
      return await this.getCreditAccount();
    }
    return null;
  }

  /**
   * 
   * The account name at the other side of the transaction given the one in one side.
   * 
   * @param account - The account object, id or name.
   */
  public async getOtherAccountName(account: string | Account): Promise<string> {
    var otherAccount = await this.getOtherAccount(account);
    if (otherAccount != null) {
      return otherAccount.getName();
    } else {
      return "";
    }
  }

  /**
   * 
   * Tell if the given account is credit on the transaction
   * 
   * @param account - The account object
   */  
  public async isCredit(account: Account): Promise<boolean> {
    return (await this.getCreditAccount()) != null && account != null && (await this.getCreditAccount()).getNormalizedName() == account.getNormalizedName();
  }

  /**
   * 
   * Tell if the given account is debit on the transaction
   * 
   * @param account - The account object
   */  
  public async isDebit(account: Account): Promise<boolean> {
    return (await this.getDebitAccount()) != null && account != null && (await this.getDebitAccount()).getNormalizedName() == account.getNormalizedName();
  }


  /** @internal */
  private async getAccount_(account: Account | string): Promise<Account> {
    if (account == null || account instanceof Account) {
      return account as Account;
    }
    return await this.book.getAccount(account);
  }  


  //DESCRIPTION
  /**
   * @returns The description of this transaction.
   */
  public getDescription(): string {
    if (this.wrapped.description == null) {
      return "";
    }
    return this.wrapped.description;
  }

  /**
   * 
   * Sets the description of the Transaction.
   * 
   * @returns This Transaction, for chainning.
   */
  public setDescription(description: string): Transaction {
    this.wrapped.description = description;
    return this;
  }


  //DATE

  /**
   * @returns The Transaction date, in ISO format yyyy-MM-dd.
   */
  public getDate(): string {
    return this.wrapped.date;
  }

  /**
   * 
   * Sets the date of the Transaction.
   * 
   * @returns This Transaction, for chainning
   */
  public setDate(date: string | Date): Transaction {
    if (typeof date == "string") {
      if (date.indexOf('/') > 0) {
        let dateObject = Utils.parseDate(date, this.book.getDatePattern(), this.book.getTimeZone())
        this.wrapped.date = Utils.formatDateISO(dateObject, this.book.getTimeZone())
      } else if (date.indexOf('-')) {
        this.wrapped.date = date;
      }
    } else if (Object.prototype.toString.call(date) === '[object Date]') {
      this.wrapped.date = Utils.formatDateISO(date, this.book.getTimeZone())
    }
    return this;
  }

  /**
   * @returns The Transaction Date object, on the time zone of the [[Book]].
   */
  public getDateObject(): Date {
    return Utils.convertValueToDate(this.getDateValue(), this.book.getTimeZoneOffset());
  }

  /**
   * @returns The Transaction date number, in format YYYYMMDD.
   */
  public getDateValue(): number {
    return this.wrapped.dateValue;
  }

  /**
   * @returns The Transaction date, formatted on the date pattern of the [[Book]].
   */
  public getDateFormatted(): string {
    return this.wrapped.dateFormatted;
  }

  /**
   * @returns The date the transaction was created.
   */
  public getCreatedAt(): Date {
    return new Date(new Number(this.wrapped.createdAt).valueOf());
  }

  /**
   * @returns The date the transaction was created, formatted according to the date pattern of [[Book]].
   */
  public getCreatedAtFormatted(): string {
    return Utils.formatDate(this.getCreatedAt(), this.book.getTimeZone(), this.book.getDatePattern() + " HH:mm:ss");
  }


  //EVOLVED BALANCES
  /** @internal */
  private getCaEvolvedBalance_(): Amount {
    return this.wrapped.creditAccount != null && this.wrapped.creditAccount.balance != null ? new Amount(this.wrapped.creditAccount.balance) : null;
  }

  /** @internal */
  private getDaEvolvedBalance_(): Amount {
    return this.wrapped.debitAccount != null && this.wrapped.debitAccount.balance != null ? new Amount(this.wrapped.debitAccount.balance) : null;
  }

  /**
   * Gets the balance that the [[Account]] has at that day, when listing transactions of that Account.
   * 
   * Evolved balances is returned when searching for transactions of a permanent [[Account]].
   * 
   * Only comes with the last posted transaction of the day.
   * 
   * @param raw - True to get the raw balance, no matter the credit nature of the [[Account]].
   */
  public async getAccountBalance(raw?: boolean): Promise<Amount> {
    var accountBalance = this.getCaEvolvedBalance_();
    var isCa = true;
    if (accountBalance == null) {
      accountBalance = this.getDaEvolvedBalance_();
      isCa = false;
    }
    if (accountBalance != null) {
      if (!raw) {
        var account = isCa ? await this.getCreditAccount() : await this.getDebitAccount();
        accountBalance = Utils.getRepresentativeValue(accountBalance, account.isCredit());
      }
      return Utils.round(accountBalance, this.book.getFractionDigits());
    } else {
      return null;
    }
  }

  /**
   * Perform create new draft transaction.
   */
  public async create(): Promise<Transaction> {
    let operation = await TransactionService.createTransaction(this.book.getId(), this.wrapped);
    this.wrapped = operation.transaction;
    return this;
  }

  /**
   * Upddate transaction, applying pending changes.
   */
  public async update(): Promise<Transaction> {
    let operation = await TransactionService.updateTransaction(this.book.getId(), this.wrapped);
    this.wrapped = operation.transaction;
    return this;
  }


  /**
   * Perform check transaction.
   */
  public async check(): Promise<Transaction> {
    let operation = await TransactionService.checkTransaction(this.book.getId(), this.wrapped);
    this.wrapped.checked = operation.transaction.checked;
    return this;
  }

  /**
   * Perform uncheck transaction.
   */
  public async uncheck(): Promise<Transaction> {
    let operation = await TransactionService.uncheckTransaction(this.book.getId(), this.wrapped);
    this.wrapped.checked = operation.transaction.checked;
    return this;
  }

  /**
   * Perform post transaction, changing credit and debit [[Account]] balances.
   */
  public async post(): Promise<Transaction> {
    let operation = await TransactionService.postTransaction(this.book.getId(), this.wrapped);
    this.wrapped = operation.transaction;
    return this;
  }

  /**
   * Remove the transaction, sending to trash.
   */
  public async remove(): Promise<Transaction> {
    let operation = await TransactionService.trashTransaction(this.book.getId(), this.wrapped);
    this.wrapped.trashed = operation.transaction.trashed;
    return this;
  }

  /**
   * Restore the transaction from trash.
   */
  public async restore(): Promise<Transaction> {
    let operation = await TransactionService.restoreTransaction(this.book.getId(), this.wrapped);
    this.wrapped.trashed = operation.transaction.trashed;
    return this;
  }


}