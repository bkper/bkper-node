import * as AccountService from '../service/account-service';
import * as GroupService from '../service/group-service';
import * as BookService from '../service/book-service';
import * as FileService from '../service/file-service';
import * as TransactionService from '../service/transaction-service';
import * as IntegrationService from '../service/integration-service';
import * as Utils from '../utils';
import { normalizeName } from '../utils';
import { Account } from './Account';
import { Amount } from './Amount';
import { Collection } from './Collection';
import { DecimalSeparator, Month, Period, Permission } from './Enums';
import { File } from './File';
import { Group } from './Group';
import { Transaction } from './Transaction';
import { TransactionIterator } from './TransactionIterator';
import { Integration } from './Integration';

/**
 *
 * A Book represents [General Ledger](https://en.wikipedia.org/wiki/General_ledger) for a company or business, but can also represent a [Ledger](https://en.wikipedia.org/wiki/Ledger) for a project or department
 *
 * It contains all [[Accounts]] where [[Transactions]] are recorded/posted;
 * 
 * @public
 */
export class Book {

  /** @internal */
  private wrapped: bkper.Book;

  /** @internal */
  private collection: Collection;

  /** @internal */
  private idGroupMap: Map<string, Group>;

  /** @internal */
  private nameGroupMap: Map<string, Group>;


  constructor(json: bkper.Book) {
    this.wrapped = json;
  }

  /**
   * @returns The wrapped plain json object
   */
  public json(): bkper.Book {
    return this.wrapped;
  }

  /**
   * Same as bookId param
   */
  public getId(): string {
    return this.wrapped.id;
  }

  /**
   * @returns The name of this Book
   */
  public getName(): string {
    return this.wrapped.name;
  }

  /**
   * 
   * Sets the name of the Book.
   * 
   * @returns This Book, for chainning.
   */
  public setName(name: string): Book {
    this.wrapped.name = name;
    return this;
  }

  /**
   * @returns The number of fraction digits supported by this Book. Same as getDecimalPlaces
   */
  public getFractionDigits(): number {
    return this.wrapped.fractionDigits;
  }

  /**
   * @returns The number of decimal places supported by this Book. Same as getFractionDigits
   */
  public getDecimalPlaces(): number {
    return this.getFractionDigits();
  }

  /**
   * 
   * Sets the number of fraction digits (decimal places) supported by this Book
   * 
   * @returns This Book, for chainning.
   */
  public setFractionDigits(fractionDigits: number): Book {
    this.wrapped.fractionDigits = fractionDigits;
    return this;
  }

  /**
   * @returns The period slice for balances visualization
   */
  public getPeriod(): Period {
    return this.wrapped.period as Period;
  }

  /**
   * Sets the period slice for balances visualization
   * 
   * @returns This Book, for chainning.
   */
  public setPeriod(period: Period): Book {
    this.wrapped.period = period;
    return this;
  }

  /**
   * @returns The start month when YEAR period set
   */
  public getPeriodStartMonth(): Month {
    return this.wrapped.periodStartMonth as Month;
  }

  /**
   * Sets the start month when YEAR period set
   * 
   * @returns This Book, for chainning.
   */
  public setPeriodStartMonth(month: Month): Book {
    this.wrapped.periodStartMonth = month;
    return this;
  }

  /**
   * @returns The transactions pagination page size
   */
  public getPageSize(): number {
    return this.wrapped.pageSize;
  }

  /**
   * Sets the transactions pagination page size
   * 
   * @returns This Book, for chainning.
   */
  public setPageSize(pageSize: number): Book {
    this.wrapped.pageSize = pageSize;
    return this;
  }


  /**
   * @returns The name of the owner of the Book
   */
  public getOwnerName(): string {
    return this.wrapped.ownerName;
  }

  /**
   * @returns The permission for the current user
   */
  public getPermission(): Permission {
    return this.wrapped.permission as Permission;
  }

  /** 
   * @returns The collection of this book
   */
  public getCollection(): Collection {
    if (this.wrapped.collection != null && this.collection == null) {
      this.collection = new Collection(this.wrapped.collection);
    }
    return this.collection;
  }


  /**
   * @returns The date pattern of the Book. Current: dd/MM/yyyy | MM/dd/yyyy | yyyy/MM/dd
   */
  public getDatePattern(): string {
    return this.wrapped.datePattern;
  }

  /**
   * 
   * Sets the date pattern of the Book. Current: dd/MM/yyyy | MM/dd/yyyy | yyyy/MM/dd
   * 
   * @returns This Book, for chainning.
   */
  public setDatePattern(datePattern: string): Book {
    this.wrapped.datePattern = datePattern;
    return this;
  }


  /**
   * @returns The lock date of the Book in ISO format yyyy-MM-dd
   */
  public getLockDate(): string {
    return this.wrapped.lockDate;
  }

  /**
   * 
   * Sets the lock date of the Book in ISO format yyyy-MM-dd.
   * 
   * @returns This Book, for chainning.
   */
  public setLockDate(lockDate: string): Book {
    if (lockDate == null) {
      lockDate = "1900-00-00";
    }
    this.wrapped.lockDate = lockDate;
    return this;
  }

  /**
   * @returns The closing date of the Book in ISO format yyyy-MM-dd 
   */
  public getClosingDate(): string {
    return this.wrapped.closingDate;
  }

  /**
   * 
   * Sets the closing date of the Book in ISO format yyyy-MM-dd.
   * 
   * @returns This Book, for chainning.
   */
  public setClosingDate(closingDate: string): Book {
    if (closingDate == null) {
      closingDate = "1900-00-00";
    }
    this.wrapped.closingDate = closingDate;
    return this;
  }


  /**
   * @returns The decimal separator of the Book
   */
  public getDecimalSeparator(): DecimalSeparator {
    return this.wrapped.decimalSeparator as DecimalSeparator;
  }

  /**
   * 
   * Sets the decimal separator of the Book
   * 
   * @returns This Book, for chainning.
   */
  public setDecimalSeparator(decimalSeparator: DecimalSeparator): Book {
    this.wrapped.decimalSeparator = decimalSeparator;
    return this;
  }


  /**
   * @returns The time zone of the Book
   */
  public getTimeZone(): string {
    return this.wrapped.timeZone;
  }

  /**
   * 
   * Sets the time zone of the Book
   * 
   * @returns This Book, for chainning.
   */
  public setTimeZone(timeZone: string): Book {
    this.wrapped.timeZone = timeZone;
    return this;
  }

  /**
   * @returns The time zone offset of the book, in minutes
   */
  public getTimeZoneOffset(): number {
    return this.wrapped.timeZoneOffset;
  }

  /**
   * @returns The last update date of the book, in in milliseconds
   */
  public getLastUpdateMs(): number {
    return +this.wrapped.lastUpdateMs;
  }


  /**
   * Gets the custom properties stored in this Book
   */
  public getProperties(): { [key: string]: string } {
    return this.wrapped.properties != null ? { ...this.wrapped.properties } : {};
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
   * Sets the custom properties of the Book
   * 
   * @param properties - Object with key/value pair properties
   * 
   * @returns This Book, for chainning. 
   */
  public setProperties(properties: { [key: string]: string }): Book {
    this.wrapped.properties = { ...properties };
    return this;
  }

  /**
   * Sets a custom property in the Book.
   * 
   * @param key - The property key
   * @param value - The property value
   * 
   * @returns This Book, for chainning. 
   */
  public setProperty(key: string, value: string): Book {
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
   * Formats a date according to date pattern of the Book.
   * 
   * @param date - The date to format as string.
   * @param timeZone - The output timezone of the result. Default to script's timeZone
   * 
   * @returns The date formated
   */
  public formatDate(date: Date, timeZone?: string): string {
    if (timeZone == null || timeZone.trim() == "") {
      timeZone = this.getTimeZone();
    }
    return Utils.formatDate(date, this.getDatePattern(), timeZone);
  }

  /**
   * Parse a date string according to date pattern and timezone of the Book. 
   * 
   * Also parse ISO yyyy-mm-dd format.
   */
  public parseDate(date: string): Date {
    return Utils.parseDate(date, this.getDatePattern(), this.getTimeZone());
  }


  /**
   * Formats a value according to [[DecimalSeparator]] and fraction digits of the Book.
   * 
   * @param value - The value to be formatted.
   * 
   * @returns The value formated
   */
  public formatValue(value: Amount | number | null | undefined): string {
    if (!value) {
      return ''
    }
    return Utils.formatValue(value, this.getDecimalSeparator(), this.getFractionDigits());
  }

  /**
   * Parse a value string according to [[DecimalSeparator]] and fraction digits of the Book.
   */
  public parseValue(value: string): Amount {
    return Utils.parseValue(value, this.getDecimalSeparator());
  }


  /**
   * Rounds a value according to the number of fraction digits of the Book
   * 
   * @param value - The value to be rounded
   * 
   * @returns The value rounded
   */
  public round(value: Amount | number): Amount {
    return Utils.round(value, this.getFractionDigits());
  }

  /**
   * Create [[Transactions]] on the Book, in batch. 
   */
  public async batchCreateTransactions(transactions: Transaction[]): Promise<Transaction[]> {
    let transactionPayloads: bkper.Transaction[] = [];
    transactions.forEach(tx => transactionPayloads.push(tx.wrapped))
    transactionPayloads = await TransactionService.createTransactionsBatch(this.getId(), transactionPayloads);
    transactions = Utils.wrapObjects(new Transaction(), transactionPayloads);
    this.configureTransactions_(transactions);
    return transactions;
  }

  /**
   * Trash [[Transactions]] on the Book, in batch. 
   */
  public async batchTrashTransactions(transactions: Transaction[]): Promise<void> {
    let transactionPayloads: bkper.Transaction[] = [];
    transactions.forEach(tx => transactionPayloads.push(tx.wrapped))
    await TransactionService.trashTransactionsBatch(this.getId(), transactionPayloads);
  }


  /**
   * Trigger [Balances Audit](https://help.bkper.com/en/articles/4412038-balances-audit) async process.
   */
  public audit(): void {
    BookService.audit(this.getId());
  }

  /**
   * Gets the existing [[Integrations]] in the Book.
   * 
   * @returns The existing Integration objects
   */
  public async getIntegrations(): Promise<Integration[]> {
    const integrationsPlain = await IntegrationService.listIntegrations(this.getId());
    const integrations = integrationsPlain.map(i => new Integration(i));
    return integrations;
  }

  /**
   * Creates a new [[Integration]] in the Book.
   * 
   * @param integration - The Integration object or wrapped plain json
   * 
   * @returns The created Integration object
   */
  public async createIntegration(integration: bkper.Integration | Integration): Promise<Integration> {
    if (integration instanceof Integration) {
      integration = await IntegrationService.createIntegration(this.getId(), integration.json())
    } else {
      integration = await IntegrationService.createIntegration(this.getId(), integration)
    }
    return new Integration(integration);
  }

  /**
   * Updates an existing [[Integration]] in the Book.
   * 
   * @param integration - The Integration wrapped plain json
   * 
   * @returns The updated Integration object
   */
  public async updateIntegration(integration: bkper.Integration): Promise<Integration> {
    if (integration instanceof Integration) {
      integration = await IntegrationService.updateIntegration(this.getId(), integration.json())
    } else {
      integration = await IntegrationService.updateIntegration(this.getId(), integration)
    }
    return new Integration(integration);
  }

  /**
   * Resumes a transaction iteration using a continuation token from a previous iterator.
   * 
   * @param continuationToken - continuation token from a previous transaction iterator
   * 
   * @returns a collection of transactions that remained in a previous iterator when the continuation token was generated
   */
  public continueTransactionIterator(query: string, continuationToken: string): TransactionIterator {
    var transactionIterator = new TransactionIterator(this, query);
    transactionIterator.setContinuationToken(continuationToken);
    return transactionIterator;
  }


  configureTransactions_(transactions: Transaction[]) {
    for (var i = 0; i < transactions.length; i++) {
      this.configureTransaction_(transactions[i]);
    }
    return transactions;
  }

  /** @internal */
  private configureTransaction_(transaction: Transaction) {
    transaction.book = this;
    return transaction;
  }


  /**
   * Instantiate a new [[Transaction]]
   * 
   * Example:
   * 
   * ```js
   * var book = BkperApp.getBook("agtzfmJrcGVyLWhyZHITCxIGTGVkZ2VyGICAgIDggqALDA");
   * 
   * book.newTransaction()
   *  .setDate('2013-01-25')
   *  .setDescription("Filling tank of my truck")
   *  .from('Credit Card')
   *  .to('Gas')
   *  .setAmount(126.50)
   *  .create();
   * 
   * ```
   * 
   */
  public newTransaction(): Transaction {
    let transaction = Utils.wrapObject(new Transaction(), {});
    this.configureTransaction_(transaction);
    return transaction;
  }

  /**
   * Instantiate a new [[Account]]
   * 
   * Example:
   * ```js
   * var book = BkperApp.getBook("agtzfmJrcGVyLWhyZHITCxIGTGVkZ2VyGICAgIDggqALDA");
   * 
   * book.newAccount()
   *  .setName('Some New Account')
   *  .setType('INCOMING')
   *  .addGroup('Revenue').addGroup('Salary')
   *  .setProperties({prop_a: 'A', prop_b: 'B'})
   *  .create();
   * ```
   */
  public newAccount(): Account {
    let account = Utils.wrapObject(new Account(), {});
    account.setArchived(false);
    account.book = this;
    return account;
  }

  /**
   * Instantiate a new [[Group]]
   * 
   * Example:
   * ```js
   * var book = BkperApp.getBook("agtzfmJrcGVyLWhyZHITCxIGTGVkZ2VyGICAgIDggqALDA");
   * 
   * book.newGroup()
   *  .setName('Some New Group')
   *  .setProperty('key', 'value')
   *  .create();
   * ```
   */
  public newGroup(): Group {
    let group = Utils.wrapObject(new Group(), {});
    group.book = this;
    return group;
  }

  /**
   * Gets an [[Account]] object
   * 
   * @param idOrName - The id or name of the Account
   * 
   * @returns The matching Account object
   */
  public async getAccount(idOrName: string): Promise<Account> {
    if (idOrName == null) {
      return null;
    }
    idOrName = idOrName + '';
    const accountPlain = await AccountService.getAccount(this.getId(), idOrName);
    if (!accountPlain) {
      return null;
    }
    const account = Utils.wrapObject(new Account(), accountPlain);
    account.book = this;
    return account;
  }

  /** @internal */
  updateGroupCache(group: Group) {
    group.book = this;
    if (this.idGroupMap) {
      this.idGroupMap.set(group.getId(), group);
      this.nameGroupMap.set(normalizeName(group.getName()), group);
    }
  }

  removeGroupCache(group: Group) {
    if (this.idGroupMap) {
      this.idGroupMap.delete(group.getId());
      this.nameGroupMap.delete(normalizeName(group.getName()));
    }
  }


  /**
   * Gets a [[Group]] object
   * 
   * @param idOrName - The id or name of the Group
   * 
   * @returns The matching Group object
   */
  public async getGroup(idOrName: string): Promise<Group> {

    if (idOrName == null) {
      return null;
    }

    idOrName = idOrName + '';

    if (this.idGroupMap) {
      let group = this.idGroupMap.get(idOrName);
      if (!group) {
        group = this.nameGroupMap.get(normalizeName(idOrName));
      }
      if (group) {
        return group;
      }
    }

    const groupPlain = await GroupService.getGroup(this.getId(), idOrName);
    if (!groupPlain) {
      return null;
    }
    let group = Utils.wrapObject(new Group(), groupPlain);
    this.updateGroupCache(group);
    return group;
  }


  /**
   * Gets all [[Groups]] of this Book
   */
  public async getGroups(): Promise<Group[]> {
    if (this.idGroupMap) {
      return Array.from(this.idGroupMap.values())
    }
    let groups = await GroupService.getGroups(this.getId());
    let groupsObj = Utils.wrapObjects(new Group(), groups);
    this.idGroupMap = new Map<string, Group>();
    this.nameGroupMap = new Map<string, Group>();
    for (var i = 0; i < groupsObj.length; i++) {
      var group = groupsObj[i];
      this.updateGroupCache(group);
    }
    return groupsObj;
  }

  /**
   * Get the [[Groups]] of a given account.
   */
  public async getGroupsByAccount(accountIdOrName: string): Promise<Group[]> {
    let groups = await GroupService.getGroupsByAccountId(this.getId(), accountIdOrName);
    let groupsObj = Utils.wrapObjects(new Group(), groups);
    for (const group of groupsObj) {
      group.book = this;
    }
    return groupsObj;
  }


  /**
   * Get Book transactions based on a query.
   * 
   * See [Query Guide](https://help.bkper.com/en/articles/2569178-search-query-guide) to learn more
   *  
   * @param query - The query string.
   * 
   * @returns The Transactions result as an iterator.
   * 
   * Example:
   * 
   * ```js
   * var book = BkperApp.getBook("agtzfmJrcGVyLWhyZHITCxIGTGVkZ2VyGICAgIDggqALDA");
   *
   * var transactions = book.getTransactions("account:CreditCard after:28/01/2013 before:29/01/2013");
   *
   * while (transactions.hasNext()) {
   *  var transaction = transactions.next();
   *  Logger.log(transaction.getDescription());
   * }
   * ```
   */
  public getTransactions(query?: string): TransactionIterator {
    return new TransactionIterator(this, query);
  }

  /**
   * Retrieve a transaction by id
   */
  public async getTransaction(id: string): Promise<Transaction> {
    let wrapped = await TransactionService.getTransaction(this.getId(), id);
    if (!wrapped) {
      return null;
    }
    let transaction = Utils.wrapObject(new Transaction(), wrapped);
    this.configureTransaction_(transaction);
    return transaction;
  }

  /**
   * Instantiate a new [[BkperFile]]
   * 
   * Example:
   * ```js
   * var book = BkperApp.getBook("agtzfmJrcGVyLWhyZHITCxIGTGVkZ2VyGICAgIDggqALDA");
   * 
   * book.newFile()
   *  .setBlob(UrlFetchApp.fetch('https://bkper.com/images/index/integrations4.png').getBlob())
   *  .create();
   * ```
   */
  public newFile(): File {
    let file = Utils.wrapObject(new File(), {});
    file.book = this;
    return file;
  }

  /** 
   * Retrieve a file by id
   */
  public async getFile(id: string): Promise<File> {
    let wrapped = await FileService.getFile(this.getId(), id);
    let file = Utils.wrapObject(new File(), wrapped);
    return file;
  }

  /**
   * Perform update Book, applying pending changes.
   */
  public async update(): Promise<Book> {
    this.wrapped = await BookService.updateBook(this.getId(), this.wrapped);
    return this;
  }

}