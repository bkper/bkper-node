import { DecimalSeparator } from '../src/model/Enums';
import * as utils from '../src/utils'

var expect = require('chai').expect;

describe('utils', () => {

  describe('#normalize()', () => {
    it('should normalize accents', () => {
      expect(utils.normalizeText("Á é î õ ú ão")).to.equal("a e i o u ao");
    });
    it('should normalize with dash', () => {
      expect(utils.normalizeText("Á é î-õ ú ão", "_")).to.equal("a_e_i_o_u_ao");
    });
    it('should clear multiple spaces', () => {
      expect(utils.normalizeText("Á é     î õ ú   -   ão    ", "_")).to.equal("a_e_i_o_u_ao");
    });
    it('should normalize with space and dash', () => {
      expect(utils.normalizeText("Anticipo_ IRAE", "_")).to.equal("anticipo_irae");
    });
  });

  describe('#parseDate()', () => {
    it('should parse yyyy/MM/dd', () => {
      let value = utils.parseDate('2020/01/25', 'yyyy/MM/dd', 'America/Sao_Paulo');
      expect(value.toString()).to.equal(new Date(2020, 0, 25).toString());
    });
    it('should parse MM/dd/yyyy', () => {
      let value = utils.parseDate('01/25/2020', 'MM/dd/yyyy', 'America/Sao_Paulo');
      expect(value.toString()).to.equal(new Date(2020, 0, 25).toString());
    });
    it('should parse dd/MM/yyyy', () => {
      let value = utils.parseDate('25/01/2020', 'dd/MM/yyyy', 'America/Sao_Paulo');
      expect(value.toString()).to.equal(new Date(2020, 0, 25).toString());
    });
    it('should parse ISO', () => {
      let value = utils.parseDate('2020-01-25', 'dd/MM/yyyy', 'America/Sao_Paulo');
      expect(value.toString()).to.equal(new Date(2020, 0, 25).toString());
    });

  });
  
  describe('#formatDateISO()', () => {
    it('should format yyyy-MM-dd', () => {
      let value = utils.formatDateISO(new Date(2020, 0, 25), 'UTC');
      expect(value).to.equal('2020-01-25');
    });

  });
  
  describe('#formatDate()', () => {
    it('should format yyyy/MM/dd', () => {
      let value = utils.formatDate(new Date(2020, 0, 25), 'yyyy/MM/dd', 'UTC');
      expect(value).to.equal('2020/01/25');
    });
  });

  describe('#parseValue()', () => {
    it('should parse DOT separator', () => {
      let value = utils.parseValue('23.4', DecimalSeparator.DOT);
      expect(value.toNumber()).to.equal(23.4);
      value = utils.parseValue('233,345.4667', DecimalSeparator.DOT);
      expect(value.toNumber()).to.equal(233345.4667);
    });
    it('should parse COMMA separator', () => {
      let value = utils.parseValue('23,4', DecimalSeparator.COMMA);
      expect(value.toNumber()).to.equal(23.4);
      value = utils.parseValue('23.4', DecimalSeparator.COMMA);
      expect(value.toNumber()).to.equal(23.4);
      value = utils.parseValue('233.345,4667', DecimalSeparator.COMMA);
      expect(value.toNumber()).to.equal(233345.4667);
    });
  });

  describe('#buildURLParams()', () => {
    it('should build url form prams', () => {
      let params = {
        ledgerId: "agtzfmJrcGVyLWhyZHITCxIGTGVkZ2VyGICAgKCtg6MLDA",
        query: "= account:'Credit Card' after:$m-12 before:$m+1",
        chartType: "pie",
        balanceType: "cumulative"
      }
      let urlParams = utils.buildURLParams(params);
      expect("ledgerId=agtzfmJrcGVyLWhyZHITCxIGTGVkZ2VyGICAgKCtg6MLDA&query=%3D%20account%3A'Credit%20Card'%20after%3A%24m-12%20before%3A%24m%2B1&chartType=pie&balanceType=cumulative")
        .to.equal(urlParams);
    });
  });

  describe('#convertInMatrix()', () => {

    it('should work with single line', () => {
      let matrix = [
        ["date", "description", "debit", "credit"]
      ];
      let expected = [
        ["date", "description", "debit", "credit"],
      ];
      expect(expected).to.eql(utils.convertInMatrix(matrix));
    });

    it('should fill null empty places', () => {
      let matrix = [
        ["date", "description", "debit", "credit"],
        ["25/01/1983", "descrition1"],
        ["25/01/1983",]
      ];
      let expected = [
        ["date", "description", "debit", "credit"],
        ["25/01/1983", "descrition1", null, null],
        ["25/01/1983", null, null, null]
      ];

      expect(expected).to.eql(utils.convertInMatrix(matrix));
    });

    it('should fill null empty places above filled line', () => {

      let matrix = [
        ["date", "description", "debit"],
        ["25/01/1983", "descrition1", "xx", "xx"],
        ["25/01/1983",]
      ];
      let expected = [
        ["date", "description", "debit", null],
        ["25/01/1983", "descrition1", "xx", "xx"],
        ["25/01/1983", null, null, null]
      ];

      expect(expected).to.eql(utils.convertInMatrix(matrix));

    })
  });
  
});