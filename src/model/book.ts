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
import { Account } from './account';
import { Collection } from './collection';
import { Group } from './group';

export class Book {
    /**
    * The book Accounts
    */
    'accounts'?: Array<Account>;
    /**
    * The id of agent that created the resource
    */
    'agentId'?: string;
    'collection'?: Collection;
    /**
    * The creation timestamp, in milliseconds
    */
    'createdAt'?: string;
    /**
    * The date pattern of the Book. Example: dd/MM/yyyy
    */
    'datePattern'?: string;
    /**
    * The decimal separator of the Book
    */
    'decimalSeparator'?: Book.DecimalSeparator;
    /**
    * The number of fraction digits (decimal places) of the Book
    */
    'fractionDigits'?: number;
    /**
    * The book account Groups
    */
    'groups'?: Array<Group>;
    /**
    * The unique id that identifies the Book in the system. Found at bookId url param
    */
    'id'?: string;
    /**
    * The last update date of the Book, in in milliseconds
    */
    'lastUpdateMs'?: string;
    /**
    * The name of the Book
    */
    'name'?: string;
    /**
    * The Book owner username
    */
    'ownerName'?: string;
    /**
    * The Permission the current user has in the Book
    */
    'permission'?: Book.Permission;
    /**
    * The key/value custom properties of the Book
    */
    'properties'?: { [key: string]: string; };
    /**
    * The time zone of the Book
    */
    'timeZone'?: string;
    /**
    * The time zone offset of the Book, in minutes
    */
    'timeZoneOffset'?: number;

    static discriminator: string | undefined = undefined;

    static attributeTypeMap: Array<{name: string, baseName: string, type: string}> = [
        {
            "name": "accounts",
            "baseName": "accounts",
            "type": "Array<Account>"
        },
        {
            "name": "agentId",
            "baseName": "agentId",
            "type": "string"
        },
        {
            "name": "collection",
            "baseName": "collection",
            "type": "Collection"
        },
        {
            "name": "createdAt",
            "baseName": "createdAt",
            "type": "string"
        },
        {
            "name": "datePattern",
            "baseName": "datePattern",
            "type": "string"
        },
        {
            "name": "decimalSeparator",
            "baseName": "decimalSeparator",
            "type": "Book.DecimalSeparator"
        },
        {
            "name": "fractionDigits",
            "baseName": "fractionDigits",
            "type": "number"
        },
        {
            "name": "groups",
            "baseName": "groups",
            "type": "Array<Group>"
        },
        {
            "name": "id",
            "baseName": "id",
            "type": "string"
        },
        {
            "name": "lastUpdateMs",
            "baseName": "lastUpdateMs",
            "type": "string"
        },
        {
            "name": "name",
            "baseName": "name",
            "type": "string"
        },
        {
            "name": "ownerName",
            "baseName": "ownerName",
            "type": "string"
        },
        {
            "name": "permission",
            "baseName": "permission",
            "type": "Book.Permission"
        },
        {
            "name": "properties",
            "baseName": "properties",
            "type": "{ [key: string]: string; }"
        },
        {
            "name": "timeZone",
            "baseName": "timeZone",
            "type": "string"
        },
        {
            "name": "timeZoneOffset",
            "baseName": "timeZoneOffset",
            "type": "number"
        }    ];

    static getAttributeTypeMap() {
        return Book.attributeTypeMap;
    }
}

export namespace Book {
    export enum DecimalSeparator {
        Dot = <any> 'DOT',
        Comma = <any> 'COMMA'
    }
    export enum Permission {
        Owner = <any> 'OWNER',
        Editor = <any> 'EDITOR',
        Poster = <any> 'POSTER',
        Recorder = <any> 'RECORDER',
        Viewer = <any> 'VIEWER',
        None = <any> 'NONE'
    }
}
