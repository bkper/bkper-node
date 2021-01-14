import { Book } from "./Book"
import { Transaction } from "./Transaction"
import { Account } from "./Account"
import * as TransactionService from '../service/transaction-service';
import { wrapObjects } from "../utils";


export class TransactionPage {

  private account: Account
  private transactions: Transaction[]
  private cursor: string
  private index: number
  private reachEnd: boolean

  async init(book: Book, query: string, lastCursor: string): Promise<TransactionPage> {

    var transactionList = await TransactionService.searchTransactions(book.getId(), query, 1000, lastCursor);

    if (transactionList.items == null) {
      transactionList.items = [];
    }

    this.transactions = wrapObjects(new Transaction(), transactionList.items);
    book.configureTransactions_(this.transactions);
    this.cursor = transactionList.cursor;
    if (transactionList.account) {
      this.account = await book.getAccount(transactionList.account)
    }
    this.index = 0;
    if (this.transactions == null || this.transactions.length == 0 || this.cursor == null || this.cursor == "") {
      this.reachEnd = true;
    } else {
      this.reachEnd = false;
    }

    return this;
  } 

  public getCursor(): string {
    return this.cursor;
  }

  public hasNext(): boolean {
    return this.index < this.transactions.length;
  }

  public hasReachEnd(): boolean {
    return this.reachEnd;
  }

  public getIndex(): number {
    if (this.index >= this.transactions.length) {
      return 0;
    } else {
      return this.index;
    }

  }

  public setIndex(index: number) {
    this.index = index;
  }

  public getAccount(): Account {
    return this.account;
  }

  public next(): Transaction {
    if (this.index < this.transactions.length) {
      var transaction = this.transactions[this.index];
      this.index++;
      return transaction;
    } else {
      return null;
    }
  }
}