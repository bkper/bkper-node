import { convertInMatrix } from '../utils';
import { Account } from './Account'
import { AccountType } from './Enums';
import { Group } from './Group';

/**
 * A AccountsDataTableBuilder is used to setup and build two-dimensional arrays containing transactions.
 * 
 * @public
 */
export class AccountsDataTableBuilder {

  /** @internal */
  private accounts: Account[];

  /** @internal */
  private shouldIncludeArchived: boolean;

  /** @internal */
  constructor(accounts: Account[]) {
    this.accounts = accounts;
    this.shouldIncludeArchived = false;
  }

  /**
   * Defines whether the archived accounts should included.
   *
   * @returns This builder, for chaining.
   */
  public includeArchived(include: boolean): AccountsDataTableBuilder {
    this.shouldIncludeArchived = include;
    return this;
  }

  /** @internal */
  private getTypeIndex(type: AccountType): number {
    if (type == AccountType.ASSET) {
      return 0;
    }
    if (type == AccountType.LIABILITY) {
      return 1;
    }
    if (type == AccountType.INCOMING) {
      return 2
    }
    return 3;
  }

  /**
   * @returns A two-dimensional array containing all [[Accounts]].
   */
  public async build(): Promise<any[][]> {
    var table = new Array<Array<any>>();

    let accounts = this.accounts;

    if (!this.shouldIncludeArchived) {
      accounts = this.accounts.filter(a => !a.isArchived());
    }

    let headers = [];
    headers.push('Name')
    headers.push('Type')

    accounts.sort((a1: Account, a2: Account) => {
      let ret = this.getTypeIndex(a1.getType()) - this.getTypeIndex(a2.getType())
      if (ret == 0) {
        ret = a1.getNormalizedName().localeCompare(a2.getNormalizedName())
      }
      return ret;
    })


    for (const account of accounts) {
      var line = new Array();
      line.push(account.getName())
      line.push(account.getType())

      let groups = await account.getGroups();

      groups.sort((g1: Group, g2: Group) => {
        return g1.getNormalizedName().localeCompare(g2.getNormalizedName())
      })

      for (const group of groups) {
        line.push(group.getName())
      }

      if (line.length > headers.length) {
        headers.push('Group')
      }

      table.push(line);
    }

    table.unshift(headers);

    table = convertInMatrix(table);

    return table;

  }

}

