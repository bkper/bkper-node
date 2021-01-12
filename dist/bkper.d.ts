/// <reference types="bkper-api-types" />

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
declare class Account {
    /** @internal */
    wrapped: bkper.Account;
    /** @internal */
    book: Book;
    /**
     * Gets the account internal id.
     */
    getId(): string;
    /**
     * Gets the account name.
     */
    getName(): string;
    /**
     *
     * Sets the name of the Account.
     *
     * @returns This Account, for chainning.
     */
    setName(name: string): Account;
    /**
     * @returns The name of this account without spaces or special characters.
     */
    getNormalizedName(): string;
    /**
     * @returns The type for of this account.
     */
    getType(): AccountType;
    /**
     *
     * Sets the type of the Account.
     *
     * @returns This Account, for chainning
     */
    setType(type: AccountType): Account;
    /**
     * Gets the custom properties stored in this Account.
     */
    getProperties(): {
        [key: string]: string;
    };
    /**
     * Sets the custom properties of the Account
     *
     * @param properties - Object with key/value pair properties
     *
     * @returns This Account, for chainning.
     */
    setProperties(properties: {
        [key: string]: string;
    }): Account;
    /**
     * Gets the property value for given keys. First property found will be retrieved
     *
     * @param keys - The property key
     */
    getProperty(...keys: string[]): string;
    /**
     * Sets a custom property in the Account.
     *
     * @param key - The property key
     * @param value - The property value
     *
     * @returns This Account, for chainning.
     */
    setProperty(key: string, value: string): Account;
    /**
     * Delete a custom property
     *
     * @param key - The property key
     *
     * @returns This Account, for chainning.
     */
    deleteProperty(key: string): Account;
    /**
     * Gets the balance based on credit nature of this Account.
     *
     * @param raw - True to get the raw balance, no matter the credit nature of this Account.
     *
     * @returns The balance of this account.
     */
    getBalance(raw?: boolean): number;
    /**
     * Gets the checked balance based on credit nature of this Account.
     *
     * @param raw - True to get the raw balance, no matter the credit nature of this Account.
     *
     * @returns The checked balance of this Account
     */
    getCheckedBalance(raw?: boolean): number;
    /**
     * Tell if this account is archived.
     */
    isArchived(): boolean;
    /**
     * Set account archived/unarchived.
     *
     * @returns This Account, for chainning.
     */
    setArchived(archived: boolean): Account;
    /**
     * Tell if the Account has any transaction already posted.
     *
     * Accounts with transaction posted, even with zero balance, can only be archived.
     */
    hasTransactionPosted(): boolean;
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
    isPermanent(): boolean;
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
    isCredit(): boolean;
    /**
     * Get the [[Groups]] of this account.
     */
    getGroups(): Group[];
    /**
     * Sets the groups of the Account.
     *
     * @returns This Account, for chainning.
     */
    setGroups(groups: string[] | Group[]): Account;
    /**
     * Add a group to the Account.
     *
     * @returns This Account, for chainning.
     */
    addGroup(group: string | Group): Account;
    /**
     * Remove a group from the Account.
     */
    removeGroup(group: string | Group): Account;
    /**
     * Tell if this account is in the [[Group]]
     *
     * @param  group - The Group name, id or object
     */
    isInGroup(group: string | Group): boolean;
    private isInGroupObject_;
    /**
     * Perform create new account.
     */
    create(): Promise<Account>;
    /**
     * Perform update account, applying pending changes.
     */
    update(): Promise<Account>;
    /**
     * Perform delete account.
     */
    remove(): Promise<Account>;
}

/**
 * A AccountsDataTableBuilder is used to setup and build two-dimensional arrays containing transactions.
 *
 * @public
 */
declare class AccountsDataTableBuilder {
    private accounts;
    private shouldIncludeArchived;
    constructor(accounts: Account[]);
    /**
     * Defines whether the archived accounts should included.
     *
     * @returns This builder, for chaining.
     */
    includeArchived(include: boolean): AccountsDataTableBuilder;
    private getTypeIndex;
    /**
     * @returns A two-dimensional array containing all [[Accounts]].
     */
    build(): any[][];
}

/**
 * Enum that represents account types.
 *
 * @public
 */
declare enum AccountType {
    /**
     * Asset account type
     */
    ASSET = "ASSET",
    /**
     * Liability account type
     */
    LIABILITY = "LIABILITY",
    /**
     * Incoming account type
     */
    INCOMING = "INCOMING",
    /**
     * Outgoing account type
     */
    OUTGOING = "OUTGOING"
}

/**
 * Class that represents an [[Account]], [[Group]] or #hashtag balance on a window of time (Day / Month / Year).
 *
 * @public
 */
declare class Balance {
    private wrapped;
    private container;
    /** @internal */
    constructor(container: BalancesContainer, balancePlain: bkper.Balance);
    /**
     * The day of the balance. Days starts on 1 to 31.
     *
     * Day can be 0 (zero) in case of Monthly or Early [[Periodicity]] of the [[BalancesReport]]
     */
    getDay(): number;
    /**
     * The month of the balance. Months starts on 1 (January) to 12 (December)
     *
     * Month can be 0 (zero) in case of Early [[Periodicity]] of the [[BalancesReport]]
     */
    getMonth(): number;
    /**
     * The year of the balance
     */
    getYear(): number;
    /**
     * Date object constructed based on [[Book]] time zone offset. Usefull for
     *
     * If Month or Day is zero, the date will be constructed with first Month (January) or Day (1).
     */
    getDate(): Date;
    /**
     * The Fuzzy Date of the balance, based on [[Periodicity]] of the [[BalancesReport]] query, composed by Year, Month and Day.
     *
     * The format is **YYYYMMDD**. Very usefull for ordering and indexing
     *
     * Month and Day can be 0 (zero), depending on the granularity of the [[Periodicity]].
     *
     * *Example:*
     *
     * **20180125** - 25, January, 2018 - DAILY Periodicity
     *
     * **20180100** - January, 2018 - MONTHLY Periodicity
     *
     * **20180000** - 2018 - YEARLY Periodicity
     */
    getFuzzyDate(): number;
    /**
     * The cumulative balance to the date, since the first transaction posted.
     */
    getCumulativeBalance(): number;
    /**
     * The cumulative checked balance to the date, since the first transaction posted.
     */
    getCheckedCumulativeBalance(): number;
    /**
     * The balance on the date period.
     */
    getPeriodBalance(): number;
    /**
     * The checked balance on the date period.
     */
    getCheckedPeriodBalance(): number;
    /**
     * The unchecked cumulative balance to the date, since the first transaction posted.
     */
    getUncheckedCumulativeBalance(): number;
    /**
      * The unchecked balance on the date period.
      */
    getUncheckedPeriodBalance(): number;
}

/**
 * Enum that represents queried balances of checked/unchecked transactions.
 *
 * The type is obtained from parsing the **is:checked is:unchecked** query operator.
 *
 * @public
 */
declare enum BalanceCheckedType {
    /**
     *  Balances of all transactions, no matter its checked or unchecked state.
     */
    FULL_BALANCE = "FULL_BALANCE",
    /**
     * Balances of is:checked transactions only.
     */
    CHECKED_BALANCE = "CHECKED_BALANCE",
    /**
     * Balances of is:unchecked transactions only.
     */
    UNCHECKED_BALANCE = "UNCHECKED_BALANCE"
}

/**
 * The container of balances of an [[Account]], [[Group]] or #hashtag
 *
 * The container is composed of a list of [[Balances]] for a window of time, as well as its period and cumulative totals.
 *
 * @public
 */
declare interface BalancesContainer {
    /**
     * The parent BalancesReport of the container
     */
    getBalancesReport(): BalancesReport;
    /**
     * The [[Account]] name, [[Group]] name or #hashtag
     */
    getName(): string;
    /**
     * All [[Balances]] of the container
     */
    getBalances(): Balance[];
    /**
     * Gets the credit nature of the BalancesContainer, based on [[Account]], [[Group]] or #hashtag this container represents.
     *
     * For [[Account]], the credit nature will be the same as the one from the Account
     *
     * For [[Group]], the credit nature will be the same, if all accounts containing on it has the same credit nature. False if mixed.
     *
     * For #hashtag, the credit nature will be true.
     */
    isCredit(): boolean;
    /**
     * The cumulative balance to the date, since the first transaction posted.
     */
    getCumulativeBalance(): number;
    /**
     * The cumulative balance formatted according to [[Book]] decimal format and fraction digits.
     */
    getCumulativeBalanceText(): string;
    /**
     * The cumulative checked balance to the date, since the first transaction posted.
     */
    getCheckedCumulativeBalance(): number;
    /**
     * The cumulative checked balance formatted according to [[Book]] decimal format and fraction digits.
     */
    getCheckedCumulativeBalanceText(): string;
    /**
     * The cumulative unchecked balance to the date, since the first transaction posted.
     */
    getUncheckedCumulativeBalance(): number;
    /**
     * The cumulative unchecked balance formatted according to [[Book]] decimal format and fraction digits.
     */
    getUncheckedCumulativeBalanceText(): string;
    /**
     * The balance on the date period.
     */
    getPeriodBalance(): number;
    /**
     * The balance on the date period formatted according to [[Book]] decimal format and fraction digits
     */
    getPeriodBalanceText(): string;
    /**
     * The checked balance on the date period.
     */
    getCheckedPeriodBalance(): number;
    /**
     * The checked balance on the date period formatted according to [[Book]] decimal format and fraction digits
     */
    getCheckedPeriodBalanceText(): string;
    /**
     * The unchecked balance on the date period.
     */
    getUncheckedPeriodBalance(): number;
    /**
     * The unchecked balance on the date period formatted according to [[Book]] decimal format and fraction digits
     */
    getUncheckedPeriodBalanceText(): string;
    /**
     * Gets all child [[BalancesContainers]].
     *
     * **NOTE**: Only for Group balance containers. Accounts returns null.
     */
    getBalancesContainers(): BalancesContainer[];
    /**
     * Gets a specific [[BalancesContainer]].
     *
     * **NOTE**: Only for Group balance containers. Accounts returns null.
     */
    getBalancesContainer(name: string): BalancesContainer;
    /**
     * Creates a BalancesDataTableBuilder to generate a two-dimensional array with all [[BalancesContainers]]
     */
    createDataTable(): BalancesDataTableBuilder;
}

/**
 * A BalancesDataTableBuilder is used to setup and build two-dimensional arrays containing balance information.
 *
 * @public
 */
declare class BalancesDataTableBuilder implements BalancesDataTableBuilder {
    private balanceType;
    private balancesContainers;
    private periodicity;
    private balanceCheckedType;
    private shouldFormatDate;
    private shouldHideDates;
    private shouldHideNames;
    private shouldFormatValue;
    private book;
    private shouldExpand;
    private shouldTranspose;
    constructor(book: Book, balancesContainers: BalancesContainer[], periodicity: Periodicity, balanceCheckedType: BalanceCheckedType);
    /**
     * Defines whether the dates should be formatted based on date pattern and periodicity of the [[Book]].
     *
     * @returns This builder with respective formatting option, for chaining.
     */
    formatDates(format: boolean): BalancesDataTableBuilder;
    /**
     * Defines whether the value should be formatted based on decimal separator of the [[Book]].
     *
     * @returns This builder with respective formatting option, for chaining.
     */
    formatValues(format: boolean): BalancesDataTableBuilder;
    /**
     * Defines wheter Groups should expand its child accounts.
     *
     * @returns This builder with respective expanded option, for chaining.
     */
    expanded(expanded: boolean): BalancesDataTableBuilder;
    /**
     * Fluent method to set the [[BalanceType]] for the builder.
     *
     * @param type - The type of balance for this data table
     *
     * For **TOTAL** [[BalanceType]], the table format looks like:
     *
     * ```
     *   _____________________
     *  | Expenses  | 4568.23 |
     *  | Income    | 5678.93 |
     *  |    ...    |   ...   |
     *  |___________|_________|
     *
     * ```
     * Two columns, and each [[Account]] or [[Group]] per line.
     *
     * For **PERIOD** or **CUMULATIVE** [[BalanceType]], the table will be a time table, and the format looks like:
     *
     * ```
     *  _____________________________________________
     *  |            | Expenses | Income  |    ...   |
     *  | 15/01/2014 | 2345.23  | 3452.93 |    ...   |
     *  | 15/02/2014 | 2345.93  | 3456.46 |    ...   |
     *  | 15/03/2014 | 2456.45  | 3567.87 |    ...   |
     *  |    ...     |   ...    |   ...   |    ...   |
     *  |___________ |__________|_________|__________|
     *
     * ```
     *
     * First column will be the Date column, and one column for each [[Account]] or [[Group]].
     *
     * @returns This builder with respective balance type, for chaining.
     */
    type(type: BalanceType): BalancesDataTableBuilder;
    /**
     * Defines wheter should rows and columns should be transposed.
     *
     * For **TOTAL** [[BalanceType]], the **transposed** table looks like:
     *
     * ```
     *   _____________________________
     *  | Expenses | Income  |  ...  |
     *  | 4568.23  | 5678.93 |  ...  |
     *  |__________|_________|_______|
     *
     * ```
     * Two rows, and each [[Account]] or [[Group]] per column.
     *
     *
     * For **PERIOD** or **CUMULATIVE** [[BalanceType]], the **transposed** table will be a time table, and the format looks like:
     *
     * ```
     *   _______________________________________________________________
     *  |            | 15/01/2014 | 15/02/2014 | 15/03/2014 |    ...    |
     *  |  Expenses  |  2345.23   |  2345.93   |  2456.45   |    ...    |
     *  |  Income    |  3452.93   |  3456.46   |  3567.87   |    ...    |
     *  |     ...    |     ...    |     ...    |     ...    |    ...    |
     *  |____________|____________|____________|____________|___________|
     *
     * ```
     *
     * First column will be each [[Account]] or [[Group]], and one column for each Date.
     *
     * @returns This builder with respective transposed option, for chaining.
     */
    transposed(transposed: boolean): BalancesDataTableBuilder;
    /**
     * Defines whether the dates should be hidden for **PERIOD** or **CUMULATIVE** [[BalanceType]].
     *
     * @returns This builder with respective hide dates option, for chaining.
     */
    hideDates(hide: boolean): BalancesDataTableBuilder;
    /**
     * Defines whether the [[Accounts]] and [[Groups]] names should be hidden.
     *
     * @returns This builder with respective hide names option, for chaining.
     */
    hideNames(hide: boolean): BalancesDataTableBuilder;
    /**
     *
     * Builds an two-dimensional array with the balances.
     *
     */
    build(): any[][];
    private buildTotalDataTable_;
    private buildTimeDataTable_;
}

/**
 * Class representing a Balance Report, generated when calling [Book.getBalanceReport](#book_getbalancesreport)
 *
 * @public
 */
declare class BalancesReport {
    private wrapped;
    private book;
    private groupBalancesContainers;
    private accountBalancesContainers;
    /** @internal */
    constructor(book: Book, balancesReportPlain: bkper.Balances);
    /**
     * The [[Book]] that generated the report.
     */
    getBook(): Book;
    /**
     * Creates a BalancesDataTableBuilder to generate a two-dimensional array with all [[BalancesContainers]].
     */
    createDataTable(): BalancesDataTableBuilder;
    /**
     * Gets all [[BalancesContainers]] of the report.
     */
    getBalancesContainers(): BalancesContainer[];
    /**
     * The [[Periodicity]] of the query used to generate the report.
     */
    getPeriodicity(): Periodicity;
    /**
     * The [[BalanceCheckedType]] of the query used to generate the report.
     */
    getBalanceCheckedType(): BalanceCheckedType;
    /**
     * Check if the report has only one Group specified on query.
     */
    hasOnlyOneGroup(): boolean;
    private getAccountBalancesContainers;
    private getGroupBalancesContainers;
    /**
     * Gets a specific [[BalancesContainers]].
     *
     * @param name - The [[Account]] name, [[Group]] name or #hashtag.
     */
    getBalancesContainer(groupName: string): BalancesContainer;
}

/**
 * Enum that represents balance types.
 *
 * @public
 */
declare enum BalanceType {
    /**
     * Total balance
     */
    TOTAL = "TOTAL",
    /**
     * Period balance
     */
    PERIOD = "PERIOD",
    /**
     * Cumulative balance
     */
    CUMULATIVE = "CUMULATIVE"
}

/**
 *
 * A Book represents [General Ledger](https://en.wikipedia.org/wiki/General_ledger) for a company or business, but can also represent a [Ledger](https://en.wikipedia.org/wiki/Ledger) for a project or department
 *
 * It contains all [[Accounts]] where [[Transactions]] are recorded/posted;
 *
 * @public
 */
declare class Book {
    private wrapped;
    private accounts;
    private groups;
    private collection;
    private idAccountMap;
    private nameAccountMap;
    private idGroupMap;
    private nameGroupMap;
    private savedQueries;
    /** @internal */
    constructor(wrapped: bkper.Book);
    /**
     * Same as bookId param
     */
    getId(): string;
    /**
     * @returns The name of this Book
     */
    getName(): string;
    /**
     *
     * Sets the name of the Book.
     *
     * @returns This Book, for chainning.
     */
    setName(name: string): Book;
    /**
     * @returns The number of fraction digits (decimal places) supported by this Book
     */
    getFractionDigits(): number;
    /**
     *
     * Sets the number of fraction digits (decimal places) supported by this Book
     *
     * @returns This Book, for chainning.
     */
    setFractionDigits(fractionDigits: number): Book;
    /**
     * @returns The name of the owner of the Book
     */
    getOwnerName(): string;
    private checkAccountsLoaded_;
    /**
     * @returns The permission for the current user
     */
    getPermission(): Permission;
    /**
     * @returns The collection of this book
     */
    getCollection(): Collection;
    /**
     * @returns The date pattern of the Book. Current: dd/MM/yyyy | MM/dd/yyyy | yyyy/MM/dd
     */
    getDatePattern(): string;
    /**
     *
     * Sets the date pattern of the Book. Current: dd/MM/yyyy | MM/dd/yyyy | yyyy/MM/dd
     *
     * @returns This Book, for chainning.
     */
    setDatePattern(datePattern: string): Book;
    /**
     * @returns The decimal separator of the Book
     */
    getDecimalSeparator(): DecimalSeparator;
    /**
     *
     * Sets the decimal separator of the Book
     *
     * @returns This Book, for chainning.
     */
    setDecimalSeparator(decimalSeparator: DecimalSeparator): Book;
    /**
     * @returns The time zone of the Book
     */
    getTimeZone(): string;
    /**
     *
     * Sets the time zone of the Book
     *
     * @returns This Book, for chainning.
     */
    setTimeZone(timeZone: string): Book;
    /**
     * @returns The time zone offset of the book, in minutes
     */
    getTimeZoneOffset(): number;
    /**
     * @returns The last update date of the book, in in milliseconds
     */
    getLastUpdateMs(): number;
    /**
     * Gets the custom properties stored in this Book
     */
    getProperties(): {
        [key: string]: string;
    };
    /**
     * Gets the property value for given keys. First property found will be retrieved
     *
     * @param keys - The property key
     */
    getProperty(...keys: string[]): string;
    /**
     * Sets the custom properties of the Book
     *
     * @param properties - Object with key/value pair properties
     *
     * @returns This Book, for chainning.
     */
    setProperties(properties: {
        [key: string]: string;
    }): Book;
    /**
     * Sets a custom property in the Book.
     *
     * @param key - The property key
     * @param value - The property value
     *
     * @returns This Book, for chainning.
     */
    setProperty(key: string, value: string): Book;
    /**
     * Formats a date according to date pattern of the Book.
     *
     * @param date - The date to format as string.
     * @param timeZone - The output timezone of the result. Default to script's timeZone
     *
     * @returns The date formated
     */
    formatDate(date: Date, timeZone?: string): string;
    /**
     * Formats a value according to [[DecimalSeparator]] and fraction digits of the Book.
     *
     * @param value - The value to be formatted.
     *
     * @returns The value formated
     */
    formatValue(value: number): string;
    /**
     * Parse a value string according to [[DecimalSeparator]] and fraction digits of the Book.
     */
    parseValue(value: string): number;
    /**
     * Rounds a value according to the number of fraction digits of the Book
     *
     * @param value - The value to be rounded
     *
     * @returns The value rounded
     */
    round(value: number): number;
    /**
     * Create [[Transactions]] on the Book, in batch.
     */
    batchCreateTransactions(transactions: Transaction[]): Promise<Transaction[]>;
    /**
     * Trigger [Balances Audit](https://help.bkper.com/en/articles/4412038-balances-audit) async process.
     */
    audit(): void;
    /**
     * Resumes a transaction iteration using a continuation token from a previous iterator.
     *
     * @param continuationToken - continuation token from a previous transaction iterator
     *
     * @returns a collection of transactions that remained in a previous iterator when the continuation token was generated
     */
    continueTransactionIterator(query: string, continuationToken: string): TransactionIterator;
    configureTransactions_(transactions: Transaction[]): Transaction[];
    private configureTransaction_;
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
    newTransaction(): Transaction;
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
    newAccount(): Account;
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
    newGroup(): Group;
    /**
     * Gets all [[Accounts]] of this Book
     */
    getAccounts(): Account[];
    /**
     * Gets an [[Account]] object
     *
     * @param idOrName - The id or name of the Account
     *
     * @returns The matching Account object
     */
    getAccount(idOrName: string): Account;
    /**
     * Create [[Accounts]] on the Book, in batch.
     */
    batchCreateAccounts(accounts: Account[]): Promise<Account[]>;
    private configureAccounts_;
    /**
     * Gets all [[Groups]] of this Book
     */
    getGroups(): Group[];
    /**
     * Create [[Groups]] on the Book, in batch.
     */
    batchCreateGroups(groups: Group[]): Promise<Group[]>;
    clearAccountsCache(): void;
    private clearBookCache_;
    /**
     * Gets a [[Group]] object
     *
     * @param idOrName - The id or name of the Group
     *
     * @returns The matching Group object
     */
    getGroup(idOrName: string): Group;
    private configureGroups_;
    /**
     * Gets all saved queries from this book
     */
    getSavedQueries(): Promise<{
        id?: string;
        query?: string;
        title?: string;
    }[]>;
    /**
     *
     * Create a [[BalancesReport]] based on query
     *
     * @param query - The balances report query
     */
    getBalancesReport(query: string): Promise<BalancesReport>;
    /**
     * Create a [[BalancesDataTableBuilder]] based on a query, to create two dimensional Array representation of balances of [[Account]], [[Group]] or #hashtag
     *
     * See [Query Guide](https://help.bkper.com/en/articles/2569178-search-query-guide) to learn more
     *
     * @param query - The balances report query
     *
     * @returns The balances data table builder
     *
     * Example:
     *
     * ```js
     * var book = BkperApp.getBook("agtzfmJrcGVyLWhyZHITCxIGTGVkZ2VyGICAgIDggqALDA");
     *
     * var balancesDataTable = book.createBalancesDataTable("#rental #energy after:8/2013 before:9/2013").build();
     * ```
     */
    createBalancesDataTable(query: string): Promise<BalancesDataTableBuilder>;
    /**
     * Create a [[AccountsDataTableBuilder]], to build two dimensional Array representations of [[Accounts]] dataset.
     *
     * @returns Accounts data table builder.
     *
     */
    createAccountsDataTable(): Promise<AccountsDataTableBuilder>;
    /**
     * Create a [[TransactionsDataTableBuilder]] based on a query, to build two dimensional Array representations of [[Transactions]] dataset.
     *
     * See [Query Guide](https://help.bkper.com/en/articles/2569178-search-query-guide) to learn more
     *
     * @param query - The flter query.
     *
     * @returns Transactions data table builder.
     *
     * Example:
     *
     * ```js
     * var book = BkperApp.getBook("agtzfmJrcGVyLWhyZHITCxIGTGVkZ2VyGICAgIDggqALDA");
     *
     * var transactionsDataTable = book.createTransactionsDataTable("account:'Bank' after:8/2013 before:9/2013").build();
     * ```
     */
    createTransactionsDataTable(query?: string): TransactionsDataTableBuilder;
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
    getTransactions(query?: string): TransactionIterator;
    /**
     * Retrieve a transaction by id
     */
    getTransaction(id: string): Transaction;
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
    newFile(): File;
    /**
     * Retrieve a file by id
     */
    getFile(id: string): Promise<File>;
    /**
     * Perform update Book, applying pending changes.
     */
    update(): Promise<Book>;
}

/**
 * This class defines a Collection of [[Books]].
 *
 * @public
 */
declare class Collection {
    private wrapped;
    /** @internal */
    constructor(wrapped: bkper.Collection);
    /**
     * @returns The id of this Collection
     */
    getId(): string;
    /**
     * @returns The name of this Collection
     */
    getName(): string;
    /**
     * @returns All Books of this collection.
     */
    getBooks(): Book[];
}

/**
 * Decimal separator of numbers on book
 *
 * @public
 */
declare enum DecimalSeparator {
    /**
     * ,
     */
    COMMA = "COMMA",
    /**
     * .
     */
    DOT = "DOT"
}

/**
 *
 * This class defines a File uploaded to a [[Book]].
 *
 * A File can be attached to a [[Transaction]] or used to import data.
 *
 * @public
 */
declare class File {
    /** @internal */
    wrapped: bkper.File;
    /** @internal */
    book: Book;
    /**
     * Gets the File id
     */
    getId(): string;
    /**
     * Gets the File name
     */
    getName(): string;
    /**
     *
     * Sets the name of the File.
     *
     * @returns This File, for chainning.
     */
    setName(name: string): File;
    /**
     * Gets the File content type
     */
    getContentType(): string;
    /**
     *
     * Sets the File content type.
     *
     * @returns This File, for chainning.
     */
    setContentType(contentType: string): File;
    /**
     * Gets the file content Base64 encoded
     */
    getContent(): Promise<string>;
    /**
     *
     * Sets the File content Base64 encoded.
     *
     * @returns This File, for chainning.
     */
    setContent(content: string): File;
    /**
     * Gets the file serving url for accessing via browser
     */
    getUrl(): string;
    /**
     * Gets the file size in bytes
     */
    getSize(): number;
    /**
     * Perform create new File.
     */
    create(): Promise<File>;
}

/**
 * Gets the [[Book]] with the specified bookId from url param.
 *
 *
 * @param id - The universal book id - The same bookId param of URL you access at app.bkper.com
 *
 * @public
 */
export declare function getBook(id: string): Promise<Book>;

/**
 * This class defines a Group of [[Accounts]].
 *
 * Accounts can be grouped by different meaning, like Expenses, Revenue, Assets, Liabilities and so on
 *
 * Its useful to keep organized and for high level analysis.
 *
 * @public
 */
declare class Group {
    /** @internal */
    wrapped: bkper.Group;
    /** @internal */
    book: Book;
    /**
     * @returns The id of this Group
     */
    getId(): string;
    /**
     * @returns The name of this Group
     */
    getName(): string;
    /**
     *
     * Sets the name of the Group.
     *
     * @returns This Group, for chainning.
     */
    setName(name: string): Group;
    /**
     * @returns The name of this group without spaces and special characters
     */
    getNormalizedName(): string;
    /**
     * @returns True if this group has any account in it
     */
    hasAccounts(): boolean;
    /**
     * @returns All Accounts of this group.
     */
    getAccounts(): Account[];
    /**
     * Gets the custom properties stored in this Group
     */
    getProperties(): {
        [key: string]: string;
    };
    /**
     * Sets the custom properties of the Group
     *
     * @param properties - Object with key/value pair properties
     *
     * @returns This Group, for chainning.
     */
    setProperties(properties: {
        [key: string]: string;
    }): Group;
    /**
     * Gets the property value for given keys. First property found will be retrieved
     *
     * @param keys - The property key
     */
    getProperty(...keys: string[]): string;
    /**
     * Sets a custom property in the Group.
     *
     * @param key - The property key
     * @param value - The property value
     */
    setProperty(key: string, value: string): Group;
    /**
     * Delete a custom property
     *
     * @param key - The property key
     *
     * @returns This Group, for chainning.
     */
    deleteProperty(key: string): Group;
    /**
     * Tell if the Group is hidden on main transactions menu
     */
    isHidden(): boolean;
    /**
     *  Hide/Show group on main menu.
     */
    setHidden(hidden: boolean): Group;
    /**
     * Perform create new group.
     */
    create(): Promise<Group>;
    /**
     * Perform update group, applying pending changes.
     */
    update(): Promise<Group>;
    /**
     * Perform delete group.
     */
    remove(): Promise<Group>;
}

/**
 * Interface to provide OAuth2 tokens upon calling the API.
 *
 * @public
 */
declare interface OAuthTokenProvider {
    /**
     * A valid OAuth2 access token with **https://www.googleapis.com/auth/userinfo.email** scope authorized.
     */
    (): Promise<string>;
}

/**
 * The Periodicity of the query. It may depend on the level of granularity you write the range params.
 *
 * @public
 */
declare enum Periodicity {
    /**
     * Example: after:25/01/1983, before:04/03/2013, after:$d-30, before:$d, after:$d-15/$m
     */
    DAILY = "DAILY",
    /**
     * Example: after:jan/2013, before:mar/2013, after:$m-1, before:$m
     */
    MONTHLY = "MONTHLY",
    /**
     * Example: on:2013, after:2013, $y
     */
    YEARLY = "YEARLY"
}

/**
 * Enum representing permissions of user in the Book
 *
 * Learn more at [share article](https://help.bkper.com/en/articles/2569153-share-your-book-with-your-peers).
 *
 * @public
 */
declare enum Permission {
    /**
     * No permission
     */
    NONE = "NONE",
    /**
     * View transactions, accounts and balances.
     */
    VIEWER = "VIEWER",
    /**
     * Record and delete drafts only. Useful to collect data only
     */
    RECORDER = "RECORDER",
    /**
     * View transactions, accounts, record and delete drafts
     */
    POSTER = "POSTER",
    /**
     * Manage accounts, transactions, book configuration and sharing
     */
    EDITOR = "EDITOR",
    /**
     * Manage everything, including book visibility and deletion. Only one owner per book.
     */
    OWNER = "OWNER"
}

/**
 * Sets the API key to identify the agent.
 *
 * API keys are intended for agent identification only, not for authentication. [Learn more](https://cloud.google.com/endpoints/docs/frameworks/java/when-why-api-key)
 *
 * See how to create your api key [here](https://cloud.google.com/docs/authentication/api-keys).
 *
 * @param key - The key from GCP API & Services Credentials console.
 *
 * @public
 */
export declare function setApiKey(key: string): void;

/**
 * Sets the [[OAuthTokenProvider]].
 *
 * OAuthTokenProvider issue a valid OAuth token upon calling the Bkper Rest API.
 *
 * @param oauthTokenProvider - The [[OAuthTokenProvider]] implementation.
 *
 * @public
 */
export declare function setOAuthTokenProvider(oauthTokenProvider: OAuthTokenProvider): Promise<void>;

/**
 *
 * This class defines a Transaction between [credit and debit](http://en.wikipedia.org/wiki/Debits_and_credits) [[Accounts]].
 *
 * A Transaction is the main entity on the [Double Entry](http://en.wikipedia.org/wiki/Double-entry_bookkeeping_system) [Bookkeeping](http://en.wikipedia.org/wiki/Bookkeeping) system.
 *
 * @public
 */
declare class Transaction {
    /** @internal */
    wrapped: bkper.Transaction;
    /** @internal */
    book: Book;
    /**
     * @returns The id of the Transaction.
     */
    getId(): string;
    /**
     * @returns The id of the agent that created this transaction
     */
    getAgentId(): string;
    /**
     * Remote ids are used to avoid duplication.
     *
     * @returns The remote ids of the Transaction.
     */
    getRemoteIds(): string[];
    /**
     * Add a remote id to the Transaction.
     *
     * @param remoteId - The remote id to add.
     *
     * @returns This Transaction, for chainning.
     */
    addRemoteId(remoteId: string): Transaction;
    /**
     * @returns True if transaction was already posted to the accounts. False if is still a Draft.
     */
    isPosted(): boolean;
    /**
     * @returns True if transaction is checked.
     */
    isChecked(): boolean;
    /**
     * @returns True if transaction is in trash.
     */
    isTrashed(): boolean;
    /**
     * @returns All #hashtags used on the transaction.
     */
    getTags(): string[];
    /**
     * @returns All urls of the transaction.
     */
    getUrls(): string[];
    /**
     * Sets the Transaction urls. Url starts with https://
     *
     * @param urls - The urls array.
     *
     * @returns This Transaction, for chainning.
     */
    setUrls(urls: string[]): Transaction;
    /**
     * Add a url to the Transaction. Url starts with https://
     *
     * @param url - The url to add.
     *
     * @returns This Transaction, for chainning.
     */
    addUrl(url: string): Transaction;
    /**
     * @returns The files attached to the transaction.
     */
    getFiles(): File[];
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
    addFile(file: File): Promise<Transaction>;
    /**
     * Check if the transaction has the specified tag.
     */
    hasTag(tag: string): boolean;
    /**
     * Gets the custom properties stored in this Transaction.
     */
    getProperties(): {
        [key: string]: string;
    };
    /**
     * Sets the custom properties of the Transaction
     *
     * @param properties - Object with key/value pair properties
     *
     * @returns This Transaction, for chainning.
     */
    setProperties(properties: {
        [key: string]: string;
    }): Transaction;
    /**
     * Gets the property value for given keys. First property found will be retrieved
     *
     * @param keys - The property key
     */
    getProperty(...keys: string[]): string;
    /**
     * Sets a custom property in the Transaction.
     *
     * @param key - The property key
     * @param value - The property value
     *
     * @returns This Transaction, for chainning.
     */
    setProperty(key: string, value: string): Transaction;
    /**
     * Delete a custom property
     *
     * @param key - The property key
     *
     * @returns This Transaction, for chainning.
     */
    deleteProperty(key: string): Transaction;
    /**
     * @returns The credit account. The same as origin account.
     */
    getCreditAccount(): Account;
    /**
     * @returns The credit account name.
     */
    getCreditAccountName(): string;
    /**
     *
     * Sets the credit/origin Account of the Transaction. Same as from().
     *
     * @param account - Account id, name or object.
     *
     * @returns This Transaction, for chainning.
     */
    setCreditAccount(account: string | Account): Transaction;
    /**
     *
     * Sets the credit/origin Account of the Transaction. Same as setCreditAccount().
     *
     * @param account - Account id, name or object.
     *
     * @returns This Transaction, for chainning.
     */
    from(account: string | Account): Transaction;
    /**
     * @returns The debit account. The same as destination account.
     *
     */
    getDebitAccount(): Account;
    /**
     * @returns The debit account name.
     */
    getDebitAccountName(): string;
    /**
     *
     * Sets the debit/origin Account of the Transaction. Same as to().
     *
     * @param account - Account id, name or object.
     *
     * @returns This Transaction, for chainning.
     */
    setDebitAccount(account: string | Account): Transaction;
    /**
     *
     * Sets the debit/origin Account of the Transaction. Same as setDebitAccount().
     *
     * @param account - Account id, name or object.
     *
     * @returns This Transaction, for chainning.
     */
    to(account: string | Account): Transaction;
    /**
     * @returns The amount of the transaction.
     */
    getAmount(): number;
    /**
     *
     * Sets the amount of the Transaction.
     *
     * @returns This Transaction, for chainning.
     */
    setAmount(amount: number | string): Transaction;
    /**
     * Get the absolute amount of this transaction if the given account is at the credit side, else null.
     *
     * @param account - The account object, id or name.
     */
    getCreditAmount(account: Account | string): number;
    /**
     * Gets the absolute amount of this transaction if the given account is at the debit side, else null.
     *
     * @param account - The account object, id or name.
     */
    getDebitAmount(account: Account | string): number;
    /**
     * Gets the [[Account]] at the other side of the transaction given the one in one side.
     *
     * @param account - The account object, id or name.
     */
    getOtherAccount(account: Account | string): Account;
    /**
     *
     * The account name at the other side of the transaction given the one in one side.
     *
     * @param account - The account object, id or name.
     */
    getOtherAccountName(account: string | Account): string;
    private getAccount_;
    private isCreditOnTransaction_;
    private isDebitOnTransaction_;
    /**
     * @returns The description of this transaction.
     */
    getDescription(): string;
    /**
     *
     * Sets the description of the Transaction.
     *
     * @returns This Transaction, for chainning.
     */
    setDescription(description: string): Transaction;
    /**
     * @returns The Transaction date, in ISO format yyyy-MM-dd.
     */
    getDate(): string;
    /**
     *
     * Sets the date of the Transaction.
     *
     * @returns This Transaction, for chainning
     */
    setDate(date: string | Date): Transaction;
    /**
     * @returns The Transaction Date object, on the time zone of the [[Book]].
     */
    getDateObject(): Date;
    /**
     * @returns The Transaction date number, in format YYYYMMDD.
     */
    getDateValue(): number;
    /**
     * @returns The Transaction date, formatted on the date pattern of the [[Book]].
     */
    getDateFormatted(): string;
    /**
     * @returns The date the transaction was created.
     */
    getCreatedAt(): Date;
    /**
     * @returns The date the transaction was created, formatted according to the date pattern of [[Book]].
     */
    getCreatedAtFormatted(): string;
    private getCaEvolvedBalance_;
    private getDaEvolvedBalance_;
    /**
     * Gets the balance that the [[Account]] has at that day, when listing transactions of that Account.
     *
     * Evolved balances is returned when searching for transactions of a permanent [[Account]].
     *
     * Only comes with the last posted transaction of the day.
     *
     * @param raw - True to get the raw balance, no matter the credit nature of the [[Account]].
     */
    getAccountBalance(raw?: boolean): number;
    /**
     * Perform create new draft transaction.
     */
    create(): Promise<Transaction>;
    /**
     * Upddate transaction, applying pending changes.
     */
    update(): Promise<Transaction>;
    /**
     * Perform check transaction.
     */
    check(): Promise<Transaction>;
    /**
     * Perform uncheck transaction.
     */
    uncheck(): Promise<Transaction>;
    /**
     * Perform post transaction, changing credit and debit [[Account]] balances.
     */
    post(): Promise<Transaction>;
    /**
     * Remove the transaction, sending to trash.
     */
    remove(): Promise<Transaction>;
    /**
     * Restore the transaction from trash.
     */
    restore(): Promise<Transaction>;
}

/**
 *
 * An iterator that allows scripts to iterate over a potentially large collection of transactions.
 *
 * Example:
 *
 * ```js
 * var book = BkperApp.getBook("agtzfmJrcGVyLWhyZHITCxIGTGVkZ2VyGICAgIDggqALDA");
 *
 * var transactionIterator = book.getTransactions("account:CreditCard after:28/01/2013 before:29/01/2013");
 *
 * while (transactionIterator.hasNext()) {
 *  var transaction = transactions.next();
 *  Logger.log(transaction.getDescription());
 * }
 * ```
 *
 * @public
 */
declare class TransactionIterator {
    private book;
    private query;
    private currentPage;
    private nextPage;
    private lastCursor;
    constructor(book: Book, query?: string);
    /**
     * Gets the Book that originate the iterator
     */
    getBook(): Book;
    /**
     * Gets a token that can be used to resume this iteration at a later time.
     *
     * This method is useful if processing an iterator in one execution would exceed the maximum execution time.
     *
     * Continuation tokens are generally valid short period of time.
     */
    getContinuationToken(): string;
    /**
     * Sets a continuation token from previous paused iteration
     */
    setContinuationToken(continuationToken: string): Promise<void>;
    /**
     * Determines whether calling next() will return a transaction.
     */
    hasNext(): Promise<boolean>;
    /**
     * Gets the next transaction in the collection of transactions.
     */
    next(): Promise<Transaction>;
    /**
     * @returns The account, when filtering by a single account.
     */
    getAccount(): Promise<Account>;
}

/**
 * A TransactionsDataTableBuilder is used to setup and build two-dimensional arrays containing transactions.
 *
 * @public
 */
declare class TransactionsDataTableBuilder {
    private transactionIterator;
    private shouldFormatDates;
    private shouldFormatValues;
    private shouldAddUrls;
    constructor(transactionIterator: TransactionIterator);
    /**
     * Defines whether the dates should be formatted, based on date patter of the [[Book]]
     *
     * @returns This builder with respective formatting option, for chaining.
     */
    formatDates(format: boolean): TransactionsDataTableBuilder;
    /**
     * Defines whether amounts should be formatted based on [[DecimalSeparator]] of the [[Book]]
     *
     * @returns This builder with respective formatting option, for chaining.
     */
    formatValues(format: boolean): TransactionsDataTableBuilder;
    /**
     * Defines whether include attachments and url links.
     *
     * @returns This builder with respective add attachment option, for chaining.
     */
    includeUrls(include: boolean): TransactionsDataTableBuilder;
    /**
     * @returns The account, when filtering by a single account.
     */
    getAccount(): Promise<Account>;
    /**
     * @returns A two-dimensional array containing all [[Transactions]].
     */
    build(): Promise<any[][]>;
    private get2DArray_;
    private getExtract2DArray_;
    private isCreditOnTransaction_;
}

export { }
