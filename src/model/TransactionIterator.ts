import { Book } from "./Book"
import { Transaction } from "./Transaction"
import { Account } from "./Account"
import { TransactionPage } from "./TransactionPage"

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
export class TransactionIterator {

  /** @internal */
  private book: Book

  /** @internal */
  private query: string

  /** @internal */
  private currentPage: TransactionPage

  /** @internal */
  private nextPage: TransactionPage

  /** @internal */
  private lastCursor: string
  
  /** @internal */
  constructor(book: Book, query?: string) {
    this.book = book
    this.query = query
    if (this.query == null) {
      this.query = "";
    }
    this.currentPage = null;
    this.nextPage = null;
    this.lastCursor = null;
  }

  /**
   * Gets the Book that originate the iterator
   */
  public getBook(): Book {
    return this.book;
  }


  /**
   * Gets a token that can be used to resume this iteration at a later time.
   * 
   * This method is useful if processing an iterator in one execution would exceed the maximum execution time.
   * 
   * Continuation tokens are generally valid short period of time.
   */
  public getContinuationToken(): string {

    if (this.currentPage == null) {
      return null;
    }

    var cursor = this.lastCursor;
    if (cursor == null) {
      cursor = "null"
    }

    var continuationToken = cursor + "_bkperpageindex_" + this.currentPage.getIndex();

    return continuationToken;
  }

  /**
   * Sets a continuation token from previous paused iteration
   */
  public async setContinuationToken(continuationToken: string): Promise<void> {

    if (continuationToken == null) {
      return;
    }

    var cursorIndexArray = continuationToken.split("_bkperpageindex_");
    if (cursorIndexArray.length != 2) {
      return;
    }

    var cursor = cursorIndexArray[0]
    var index = cursorIndexArray[1]
    if ("null" != cursor) {
      this.lastCursor = cursor
    }
    let indexNum = new Number(index).valueOf()
    this.currentPage = await new TransactionPage().init(this.book, this.query, this.lastCursor)
    this.currentPage.setIndex(indexNum);
  }

  /**
   * Determines whether calling next() will return a transaction.
   */
  public async hasNext(): Promise<boolean> {

    if (this.currentPage == null) {
      this.currentPage = await new TransactionPage().init(this.book, this.query, this.lastCursor);
    }

    if (this.currentPage.hasNext()) {
      return true;
    } else if (!this.currentPage.hasReachEnd()) {
      this.lastCursor = this.currentPage.getCursor();
      if (this.nextPage == null) {
        this.nextPage = await new TransactionPage().init(this.book, this.query, this.lastCursor);
      }
      return this.nextPage.hasNext();
    } else {
      return false;
    }
  }

  /**
   * Gets the next transaction in the collection of transactions.
   */
  public async next(): Promise<Transaction> {

    if (this.currentPage == null) {
      this.currentPage = await new TransactionPage().init(this.book, this.query, this.lastCursor);
    }

    if (this.currentPage.hasNext()) {
      return this.currentPage.next();
    } else if (!this.currentPage.hasReachEnd()) {
      this.lastCursor = this.currentPage.getCursor();
      if (this.nextPage != null) {
        this.currentPage = this.nextPage;
        this.nextPage = null;
      } else {
        this.currentPage = await new TransactionPage().init(this.book, this.query, this.lastCursor);
      }
      return this.currentPage.next();
    } else {
      return null;
    }
  }


  /**
   * @returns The account, when filtering by a single account.
   */  
  public async getAccount(): Promise<Account> {
    if (this.currentPage == null) {
      this.currentPage = await new TransactionPage().init(this.book, this.query, this.lastCursor);
    }    
    return this.currentPage.getAccount();
  }


}


