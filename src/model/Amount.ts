import Big from "big.js";
import { wrapObject } from "../utils";

/**
 * This class defines an amount for arbitrary-precision math calculation.
 * 
 * @public
 */
export class Amount {

  wrapped: Big

  /**
   * The Amount constructor.
   */
  public constructor(amount: number | string | Amount) {
    if (!isNaN(+amount)) {
      this.wrapped = new Big(+amount);
    } if (typeof amount == "string") {
      this.wrapped = new Big(amount);
    } else {
      this.wrapped = new Big((amount as Amount).wrapped)
    }
  }

  /** 
   * Returns an absolute Amount.
   */
  public abs(): Amount {
    let big = this.wrapped.abs();
    return wrapObject(new Amount(null), big)
  }

  /**
   * Compare
   */
  cmp(n: number | string | Amount): -1 | 0 | 1 {
    if (!isNaN(+n)) {
      return this.wrapped.cmp(+n);
    } if (typeof n == "string") {
      return this.wrapped.cmp(n);
    } else {
      return this.wrapped.cmp((n as Amount).wrapped)
    }
  }

  /**
   * Divide by
   */
  div(n: number | string | Amount): Amount {
    let big: Big;
    if (!isNaN(+n)) {
      big = this.wrapped.div(+n);
    } if (typeof n == "string") {
      big = this.wrapped.div(n);
    } else {
      big = this.wrapped.div((n as Amount).wrapped)
    }
    return wrapObject(new Amount(null), big);    
  }

  /**
   * Equals to
   */
  eq(n: number | string | Amount): boolean {
    if (!isNaN(+n)) {
      return this.wrapped.eq(+n);
    } if (typeof n == "string") {
      return this.wrapped.eq(n);
    } else {
      return this.wrapped.eq((n as Amount).wrapped)
    }
  }

  /**
   * Greater than
   */
  gt(n: number | string | Amount): boolean {
    if (!isNaN(+n)) {
      return this.wrapped.gt(+n);
    } if (typeof n == "string") {
      return this.wrapped.gt(n);
    } else {
      return this.wrapped.gt((n as Amount).wrapped)
    }    
  }

  /**
   * Greater than or equal
   */
  gte(n: number | string | Amount): boolean {
    if (!isNaN(+n)) {
      return this.wrapped.gte(+n);
    } if (typeof n == "string") {
      return this.wrapped.gte(n);
    } else {
      return this.wrapped.gte((n as Amount).wrapped)
    }  
  }


  /**
   * Less than
   */
  lt(n: number | string | Amount): boolean {
    if (!isNaN(+n)) {
      return this.wrapped.lt(+n);
    } if (typeof n == "string") {
      return this.wrapped.lt(n);
    } else {
      return this.wrapped.lt((n as Amount).wrapped)
    }  
  }


  /**
   * Less than or equal to
   */
  lte(n: number | string | Amount): boolean {
    if (!isNaN(+n)) {
      return this.wrapped.lte(+n);
    } if (typeof n == "string") {
      return this.wrapped.lte(n);
    } else {
      return this.wrapped.lte((n as Amount).wrapped)
    }  
  }

  /**
   * Sum
   */
  plus(n: number | string | Amount): Amount {
    let big: Big;
    if (!isNaN(+n)) {
      big = this.wrapped.plus(+n);
    } if (typeof n == "string") {
      big = this.wrapped.plus(n);
    } else {
      big = this.wrapped.plus((n as Amount).wrapped)
    }
    return wrapObject(new Amount(null), big);
  }

  /**
   * Minus
   */
  minus(n: number | string | Amount): Amount {
    let big: Big;
    if (!isNaN(+n)) {
      big = this.wrapped.minus(+n);
    } if (typeof n == "string") {
      big = this.wrapped.minus(n);
    } else {
      big = this.wrapped.minus((n as Amount).wrapped)
    }
    return wrapObject(new Amount(null), big);
  }

  /**
   * Modulo - the integer remainder of dividing this Amount by n.
   * 
   * Similar to % operator
   *
   */
  mod(n: number | string | Amount): Amount {
    let big: Big;
    if (!isNaN(+n)) {
      big = this.wrapped.mod(+n);
    } if (typeof n == "string") {
      big = this.wrapped.mod(n);
    } else {
      big = this.wrapped.mod((n as Amount).wrapped)
    }
    return wrapObject(new Amount(null), big);
  }


  /**
   * Round to a maximum of dp decimal places.
   */
  round(dp?: number): Amount {
    let big = this.wrapped.round(dp);
    return wrapObject(new Amount(null), big);
  }



  /**
   * Multiply
   */
  times(n: number | string | Amount): Amount {
    let big: Big;
    if (!isNaN(+n)) {
      big = this.wrapped.times(+n);
    } if (typeof n == "string") {
      big = this.wrapped.times(n);
    } else {
      big = this.wrapped.times((n as Amount).wrapped)
    }
    return wrapObject(new Amount(null), big);
  }

  /**
   * Returns a string representing the value of this Amount in normal notation to a fixed number of decimal places dp.
   */
  toFixed(dp?: number): string {
    return this.wrapped.toFixed(dp);
  }

  /**
   * Returns a string representing the value of this Amount.
   */
  toString(): string {
    return this.wrapped.toString();
  }

  /**
   * Returns a primitive number representing the value of this Amount.
   */
  toNumber(): number {
    return this.wrapped.toNumber();
  }



}
