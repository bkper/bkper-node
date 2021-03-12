import { convertInMatrix, formatValue } from "../utils";
import { Account } from "./Account";
import { Amount } from './Amount';
import { Book } from "./Book";
import { Transaction } from "./Transaction";
import { TransactionIterator } from "./TransactionIterator";

/**
 * A TransactionsDataTableBuilder is used to setup and build two-dimensional arrays containing transactions.
 * 
 * @public
 */
export class TransactionsDataTableBuilder {

  /** @internal */
  private shouldFormatDates: boolean;
  /** @internal */
  private shouldFormatValues: boolean;
  /** @internal */
  private shouldAddUrls: boolean;
  /** @internal */
  private shouldAddProperties: boolean;
  /** @internal */
  private transactionIterator: TransactionIterator;
  /** @internal */
  private transactions: Array<Transaction>;
  /** @internal */
  private book: Book;
  /** @internal */
  private propertyKeys: string[];
  
  /** @internal */
  constructor(transactionIterator: TransactionIterator) {
    this.transactionIterator = transactionIterator;
    this.book = transactionIterator.getBook();
    this.shouldFormatDates = false;
    this.shouldFormatValues = false;
    this.shouldAddUrls = false;
    this.shouldAddProperties = false;
  }

  /**
   * Defines whether the dates should be formatted, based on date patter of the [[Book]]
   * 
   * @returns This builder with respective formatting option, for chaining.
   */
  public formatDates(format: boolean): TransactionsDataTableBuilder {
    this.shouldFormatDates = format;
    return this;
  }
  
  /**
   * Defines whether amounts should be formatted based on [[DecimalSeparator]] of the [[Book]]
   *
   * @returns This builder with respective formatting option, for chaining.
   */
  public formatValues(format: boolean): TransactionsDataTableBuilder {
    this.shouldFormatValues = format;
    return this;
  }

  /**
   * Defines whether include attachments and url links.
   * 
   * @returns This builder with respective add attachment option, for chaining.
   */
  public includeUrls(include: boolean): TransactionsDataTableBuilder {
    this.shouldAddUrls = include;
    return this;
  }

  /**
   * Defines whether include custom transaction properties.
   * 
   * @returns This builder with respective add attachment option, for chaining.
   */
  public includeProperties(include: boolean): TransactionsDataTableBuilder {
    this.shouldAddProperties = include;
    return this;
  }

  /**
   * @returns The account, when filtering by a single account.
   */  
  public async getAccount(): Promise<Account> {
    return await this.transactionIterator.getAccount();
  }

  /** @internal */
  private async getTransactions(): Promise<Array<Transaction>> {
    if (this.transactions == null) {
      this.transactions = [];
      while (await this.transactionIterator.hasNext()) {
        this.transactions.push(await this.transactionIterator.next());
      }
    }
    return this.transactions;
  }

  public async getHeaderLine(): Promise<string[]> {
    var headerLine: string[] = [];

    if (await this.getAccount() != null) {

      headerLine.push("Date");
      headerLine.push("Account");
      headerLine.push("Description");
      headerLine.push("Debit");
      headerLine.push("Credit");

      if ((await this.getAccount()).isPermanent()) {
        headerLine.push("Balance");
      }

      headerLine.push("Recorded at");

      if (this.shouldAddProperties) {
        for (const key of await this.getPropertyKeys()) {
          headerLine.push(key)
        }
      }

      if (this.shouldAddUrls) {
        headerLine.push("Attachment");
      }
    } else {
      headerLine.push("Date");
      headerLine.push("Origin");
      headerLine.push("Destination");
      headerLine.push("Description");
      headerLine.push("Amount");
      headerLine.push("Recorded at");

      if (this.shouldAddProperties) {
        for (const key of await this.getPropertyKeys()) {
          headerLine.push(key)
        }
      }      

      if (this.shouldAddUrls) {
        headerLine.push("Attachment");
      }
    }
    return headerLine;
  }


  /**
   * @returns A two-dimensional array containing all [[Transactions]].
   */
  public async build(): Promise<any[][]> {
    var header = new Array();
    var dataTable = new Array();
    let headerLine = await this.getHeaderLine();

    if (await this.getAccount() != null) {
      dataTable = await this.getExtract2DArray_(await this.getAccount());
    } else {
      dataTable = await this.get2DArray_();
    }

    header.push(headerLine);

    if (dataTable.length > 0) {
      dataTable.splice(0, 0, headerLine);
      dataTable = convertInMatrix(dataTable);
      return dataTable;
    } else {
      return [headerLine];
    }
  }

  /** @internal */
  private async getPropertyKeys(): Promise<string[]> {
    if (this.propertyKeys == null) {
      this.propertyKeys = []
      for (const transaction of await this.getTransactions()) {
        for (const key of transaction.getPropertyKeys()) {
          if (this.propertyKeys.indexOf(key) <= -1) {
            // does not contain
            this.propertyKeys.push(key)
          }
        }
      }
      this.propertyKeys = this.propertyKeys.sort();
    }
    return this.propertyKeys;
  }

  /** @internal */
  private async get2DArray_() {

    var dataTable = new Array();

    for (const transaction of await this.getTransactions()) {
      
      var line = new Array();

      if (this.shouldFormatDates) {
        line.push(transaction.getDateFormatted());
      } else {
        line.push(transaction.getDateObject());
      }

      line.push(transaction.getCreditAccountName());
      line.push(transaction.getDebitAccountName());

      if (transaction.getDescription() != null) {
        line.push(transaction.getDescription());
      } else {
        line.push("");
      }
      if (transaction.getAmount() != null) {
        if (this.shouldFormatValues) {
          var decimalSeparator = this.book.getDecimalSeparator();
          var fractionDigits = this.book.getFractionDigits();
          line.push(formatValue(transaction.getAmount(), decimalSeparator, fractionDigits));
        } else {
          line.push(transaction.getAmount().toNumber());
        }
      } else {
        line.push("");
      }

      if (this.shouldFormatDates) {
        line.push(transaction.getCreatedAtFormatted());
      } else {
        line.push(transaction.getCreatedAt());
      }


      if (this.shouldAddProperties) {
        this.addPropertiesToLine(line, transaction);
      }      


      var urls = transaction.getUrls();

      if (urls == null) {
        urls = [];
      }
      let files = transaction.getFiles();
      if (files != null) {
        urls = urls.concat(files.map(f => f.getUrl()))
      }

      if (this.shouldAddUrls && urls != null && urls.length > 0) {
        for (var i = 0; i < urls.length; i++) {
          line.push(urls[i]);
        }
      } else if (this.shouldAddUrls) {
        line.push("");
      }

      dataTable.push(line);
    }

    return dataTable;
  }

  /** @internal */
  private async addPropertiesToLine(line: any[], transaction: Transaction) {
    let lineLength = line.length;
    for (const key of await this.getPropertyKeys()) {
      line.push("");
    }
    for (const key of transaction.getPropertyKeys()) {
      let index = (await this.getPropertyKeys()).indexOf(key) + lineLength;
      line[index] = transaction.getProperty(key);
    }
  }

  /** @internal */
  private async getExtract2DArray_(account: Account): Promise<any[][]> {

    var dataTable = new Array<Array<any>>();

    for (const transaction of await this.getTransactions()) {

      var line = new Array();

      if (this.shouldFormatDates) {
        line.push(transaction.getDateFormatted());
      } else {
        line.push(transaction.getDateObject());
      }

      if (transaction.getCreditAccount() != null && transaction.getDebitAccount() != null) {

        if (await this.isCreditOnTransaction_(transaction, account)) {
          line.push((await transaction.getDebitAccount()).getName());
        } else {
          line.push((await transaction.getCreditAccount()).getName());
        }

      } else {
        line.push("");
      }
      if (transaction.getDescription() != null) {
        line.push(transaction.getDescription());
      } else {
        line.push("");
      }


      if (transaction.getAmount() != null) {

        var amount: string | number |Amount = transaction.getAmount();

        if (this.shouldFormatValues) {
          amount = formatValue(transaction.getAmount(), this.book.getDecimalSeparator(), this.book.getFractionDigits());
        } else {
          amount = amount.toNumber()
        }

        if (this.isCreditOnTransaction_(transaction, account)) {
          line.push("");
          line.push(amount);
        } else {
          line.push(amount);
          line.push("");
        }
      } else {
        line.push("");
        line.push("");
      }

      if (account.isPermanent()) {
        if (transaction.getAccountBalance() != null) {
          var balance: string | number | Amount = await transaction.getAccountBalance();
          if (this.shouldFormatValues) {
            balance = formatValue(balance, this.book.getDecimalSeparator(), this.book.getFractionDigits());
          } else {
            balance = balance.toNumber()
          }
          line.push(balance);
        } else {
          line.push("");
        }
      }

      if (this.shouldFormatDates) {
        line.push(transaction.getCreatedAtFormatted());
      } else {
        line.push(transaction.getCreatedAt());
      }

      if (this.shouldAddProperties) {
        this.addPropertiesToLine(line, transaction);
      }  

      var urls = transaction.getUrls();
      if (this.shouldAddUrls && urls != null && urls.length > 0) {
        for (var i = 0; i < urls.length; i++) {
          line.push(urls[i]);
        }
      } else if (this.shouldAddUrls) {
        line.push("");
      }

      dataTable.push(line);
    }
    return dataTable;
  }

  /** @internal */
  private async isCreditOnTransaction_(transaction: Transaction, account: Account) {
    if (transaction.getCreditAccount() == null) {
      return false;
    }
    return (await transaction.getCreditAccount()).getId() == account.getId();
  }
}

