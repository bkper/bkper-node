import { getRepresentativeValue, round } from "../utils";
import { Balance } from "./Balance";
import { BalancesDataTableBuilder } from "./BalancesDataTableBuilder";
import { BalancesReport } from "./BalancesReport";
import { Periodicity } from "./Enums";
import { Amount } from './Amount';

/**
 * The container of balances of an [[Account]], [[Group]] or #hashtag
 * 
 * The container is composed of a list of [[Balances]] for a window of time, as well as its period and cumulative totals.
 * 
 * @public
 */
export interface BalancesContainer {

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
  getCumulativeBalance(): Amount;
  /**
   * The cumulative balance formatted according to [[Book]] decimal format and fraction digits.
   */
  getCumulativeBalanceText(): string;


  /**
   * The balance on the date period.
   */
  getPeriodBalance(): Amount;
  /**
   * The balance on the date period formatted according to [[Book]] decimal format and fraction digits
   */
  getPeriodBalanceText(): string;


  /**
   * Gets all child [[BalancesContainers]].
   * 
   * **NOTE**: Only for Group balance containers. Accounts returns null.
   */
  getBalancesContainers(): BalancesContainer[]

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
//###################### ACCOUNT BALANCE CONTAINER ######################

export class AccountBalancesContainer implements BalancesContainer {

  private wrapped: bkper.AccountBalances;
  private balancesReport: BalancesReport;


  constructor(balancesReport: BalancesReport, balancePlain: bkper.AccountBalances) {
    this.balancesReport = balancesReport
    this.wrapped = balancePlain;
  }

  public getBalancesReport(): BalancesReport {
    return this.balancesReport;
  }

  public getName(): string {
    return this.wrapped.name;
  }

  public isCredit() {
    return this.wrapped.credit;
  }

  public getCumulativeBalance(): Amount {
    var balance = round(this.wrapped.cumulativeBalance, this.balancesReport.getBook().getFractionDigits());
    balance = getRepresentativeValue(balance, this.isCredit());
    return balance;
  }
  public getCumulativeBalanceText(): string {
    return this.balancesReport.getBook().formatValue(this.getCumulativeBalance());
  }

  public getCheckedCumulativeBalance(): Amount {
    var balance = round(this.wrapped.checkedCumulativeBalance, this.balancesReport.getBook().getFractionDigits());
    balance = getRepresentativeValue(balance, this.isCredit());
    return balance;
  }
  public getCheckedCumulativeBalanceText(): string {
    return this.balancesReport.getBook().formatValue(this.getCheckedCumulativeBalance());
  }

  public getUncheckedCumulativeBalance(): Amount {
    var balance = round(this.wrapped.uncheckedCumulativeBalance, this.balancesReport.getBook().getFractionDigits());
    balance = getRepresentativeValue(balance, this.isCredit());
    return balance;
  }
  public getUncheckedCumulativeBalanceText(): string {
    return this.balancesReport.getBook().formatValue(this.getUncheckedCumulativeBalance());
  }

  public getPeriodBalance(): Amount {
    var balance = round(this.wrapped.periodBalance, this.balancesReport.getBook().getFractionDigits());
    return getRepresentativeValue(balance, this.isCredit());
  }
  public getPeriodBalanceText(): string {
    return this.balancesReport.getBook().formatValue(this.getPeriodBalance());
  }

  public getCheckedPeriodBalance(): Amount {
    var balance = round(this.wrapped.checkedPeriodBalance, this.balancesReport.getBook().getFractionDigits());
    return getRepresentativeValue(balance, this.isCredit());
  }
  public getCheckedPeriodBalanceText(): string {
    return this.balancesReport.getBook().formatValue(this.getCheckedPeriodBalance());
  }

  public getUncheckedPeriodBalance(): Amount {
    var balance = round(this.wrapped.uncheckedPeriodBalance, this.balancesReport.getBook().getFractionDigits());
    return getRepresentativeValue(balance, this.isCredit());
  }
  public getUncheckedPeriodBalanceText(): string {
    return this.balancesReport.getBook().formatValue(this.getUncheckedPeriodBalance());
  }


  public getBalances(): Balance[] {
    if (!this.wrapped.balances) {
      return new Array<Balance>();
    }
    return this.wrapped.balances.map(balancePlain => new Balance(this, balancePlain));
  }

  public createDataTable(): BalancesDataTableBuilder {
    return new BalancesDataTableBuilder(this.balancesReport.getBook(), [this], this.balancesReport.getPeriodicity());
  }

  public getBalancesContainers(): BalancesContainer[] {
    return [];
  }
  public getBalancesContainer(name: string): BalancesContainer {
    return null;
  }
}



//###################### GROUP BALANCE CONTAINER ######################

export class GroupBalancesContainer implements BalancesContainer {

  private wrapped: bkper.GroupBalances
  private accountBalances: AccountBalancesContainer[];
  private periodicity: Periodicity;

  private balancesReport: BalancesReport;

  constructor(balancesReport: BalancesReport, groupBalancesPlain: bkper.GroupBalances, periodicity: Periodicity) {
    this.balancesReport = balancesReport;
    this.wrapped = groupBalancesPlain;
    this.periodicity = periodicity;
  }

  public getBalancesReport(): BalancesReport {
    return this.balancesReport;
  }

  public getName(): string {
    return this.wrapped.name;
  }

  public isCredit(): boolean {
    return this.wrapped.credit;
  }


  public getCumulativeBalance(): Amount {
    var balance = round(this.wrapped.cumulativeBalance, this.balancesReport.getBook().getFractionDigits());
    return getRepresentativeValue(balance, this.isCredit());
  }
  public getCumulativeBalanceText(): string {
    return this.balancesReport.getBook().formatValue(this.getCumulativeBalance());
  }


  public getCheckedCumulativeBalance(): Amount {
    var balance = round(this.wrapped.checkedCumulativeBalance, this.balancesReport.getBook().getFractionDigits());
    return getRepresentativeValue(balance, this.isCredit());
  }
  public getCheckedCumulativeBalanceText(): string {
    return this.balancesReport.getBook().formatValue(this.getCheckedCumulativeBalance());
  }


  public getUncheckedCumulativeBalance(): Amount {
    var balance = round(this.wrapped.uncheckedCumulativeBalance, this.balancesReport.getBook().getFractionDigits());
    return getRepresentativeValue(balance, this.isCredit());
  }
  public getUncheckedCumulativeBalanceText(): string {
    return this.balancesReport.getBook().formatValue(this.getUncheckedCumulativeBalance());
  }


  public getPeriodBalance(): Amount {
    var balance = round(this.wrapped.periodBalance, this.balancesReport.getBook().getFractionDigits());
    return getRepresentativeValue(balance, this.isCredit());
  }
  public getPeriodBalanceText(): string {
    return this.balancesReport.getBook().formatValue(this.getPeriodBalance());
  }  


  public getCheckedPeriodBalance(): Amount {
    var balance = round(this.wrapped.checkedPeriodBalance, this.balancesReport.getBook().getFractionDigits());
    return getRepresentativeValue(balance, this.isCredit());
  }
  public getCheckedPeriodBalanceText(): string {
    return this.balancesReport.getBook().formatValue(this.getCheckedPeriodBalance());
  }    

  public getUncheckedPeriodBalance(): Amount {
    var balance = round(this.wrapped.uncheckedPeriodBalance, this.balancesReport.getBook().getFractionDigits());
    return getRepresentativeValue(balance, this.isCredit());
  }
  public getUncheckedPeriodBalanceText(): string {
    return this.balancesReport.getBook().formatValue(this.getUncheckedPeriodBalance());
  }    
  

  public getBalances(): Balance[] {
    if (!this.wrapped.balances) {
      return new Array<Balance>();
    }    
    return this.wrapped.balances.map(balancePlain => new Balance(this, balancePlain));
  }

  public createDataTable() {
    return new BalancesDataTableBuilder(this.balancesReport.getBook(), this.getBalancesContainers(), this.periodicity);
  }

  public getBalancesContainers(): BalancesContainer[] {
    var accountBalances = this.wrapped.accountBalances;
    if (this.accountBalances == null && accountBalances != null) {
      this.accountBalances = [];
      for (var i = 0; i < accountBalances.length; i++) {
        var accountBalance = accountBalances[i];
        var accBalances = new AccountBalancesContainer(this.balancesReport, accountBalance);
        this.accountBalances.push(accBalances);
      }
    }
    return this.accountBalances;
  }

  public getBalancesContainer(name: string): BalancesContainer {
    return null;
  }

}
