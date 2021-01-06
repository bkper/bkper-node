/**
 * app.bkper.com
 * No description provided (generated by Openapi Generator https://github.com/openapitools/openapi-generator)
 *
 * The version of the OpenAPI document: 1.0.0
 * 
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */

import { RequestFile } from './models';

export class Balance {
    'checkedCumulativeBalance'?: string;
    'checkedPeriodBalance'?: string;
    'cumulativeBalance'?: string;
    'day'?: number;
    'fuzzyDate'?: number;
    'month'?: number;
    'periodBalance'?: string;
    'uncheckedCumulativeBalance'?: string;
    'uncheckedPeriodBalance'?: string;
    'year'?: number;

    static discriminator: string | undefined = undefined;

    static attributeTypeMap: Array<{name: string, baseName: string, type: string}> = [
        {
            "name": "checkedCumulativeBalance",
            "baseName": "checkedCumulativeBalance",
            "type": "string"
        },
        {
            "name": "checkedPeriodBalance",
            "baseName": "checkedPeriodBalance",
            "type": "string"
        },
        {
            "name": "cumulativeBalance",
            "baseName": "cumulativeBalance",
            "type": "string"
        },
        {
            "name": "day",
            "baseName": "day",
            "type": "number"
        },
        {
            "name": "fuzzyDate",
            "baseName": "fuzzyDate",
            "type": "number"
        },
        {
            "name": "month",
            "baseName": "month",
            "type": "number"
        },
        {
            "name": "periodBalance",
            "baseName": "periodBalance",
            "type": "string"
        },
        {
            "name": "uncheckedCumulativeBalance",
            "baseName": "uncheckedCumulativeBalance",
            "type": "string"
        },
        {
            "name": "uncheckedPeriodBalance",
            "baseName": "uncheckedPeriodBalance",
            "type": "string"
        },
        {
            "name": "year",
            "baseName": "year",
            "type": "number"
        }    ];

    static getAttributeTypeMap() {
        return Balance.attributeTypeMap;
    }
}

