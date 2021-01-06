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
import { Agent } from './agent';
import { EventData } from './eventData';
import { User } from './user';

export class Event {
    'agent'?: Agent;
    /**
    * The id of the Book associated to the Event
    */
    'bookId'?: string;
    /**
    * The creation timestamp, in milliseconds
    */
    'createdAt'?: string;
    'data'?: EventData;
    /**
    * The unique id that identifies the Event
    */
    'id'?: string;
    /**
    * The resource associated to the Event
    */
    'resource'?: string;
    /**
    * The type of the Event
    */
    'type'?: Event.Type;
    'user'?: User;

    static discriminator: string | undefined = undefined;

    static attributeTypeMap: Array<{name: string, baseName: string, type: string}> = [
        {
            "name": "agent",
            "baseName": "agent",
            "type": "Agent"
        },
        {
            "name": "bookId",
            "baseName": "bookId",
            "type": "string"
        },
        {
            "name": "createdAt",
            "baseName": "createdAt",
            "type": "string"
        },
        {
            "name": "data",
            "baseName": "data",
            "type": "EventData"
        },
        {
            "name": "id",
            "baseName": "id",
            "type": "string"
        },
        {
            "name": "resource",
            "baseName": "resource",
            "type": "string"
        },
        {
            "name": "type",
            "baseName": "type",
            "type": "Event.Type"
        },
        {
            "name": "user",
            "baseName": "user",
            "type": "User"
        }    ];

    static getAttributeTypeMap() {
        return Event.attributeTypeMap;
    }
}

export namespace Event {
    export enum Type {
        FileCreated = <any> 'FILE_CREATED',
        TransactionCreated = <any> 'TRANSACTION_CREATED',
        TransactionUpdated = <any> 'TRANSACTION_UPDATED',
        TransactionDeleted = <any> 'TRANSACTION_DELETED',
        TransactionPosted = <any> 'TRANSACTION_POSTED',
        TransactionChecked = <any> 'TRANSACTION_CHECKED',
        TransactionUnchecked = <any> 'TRANSACTION_UNCHECKED',
        TransactionRestored = <any> 'TRANSACTION_RESTORED',
        AccountCreated = <any> 'ACCOUNT_CREATED',
        AccountUpdated = <any> 'ACCOUNT_UPDATED',
        AccountDeleted = <any> 'ACCOUNT_DELETED',
        QueryCreated = <any> 'QUERY_CREATED',
        QueryUpdated = <any> 'QUERY_UPDATED',
        QueryDeleted = <any> 'QUERY_DELETED',
        GroupCreated = <any> 'GROUP_CREATED',
        GroupUpdated = <any> 'GROUP_UPDATED',
        GroupDeleted = <any> 'GROUP_DELETED',
        CommentCreated = <any> 'COMMENT_CREATED',
        CommentDeleted = <any> 'COMMENT_DELETED',
        CollaboratorAdded = <any> 'COLLABORATOR_ADDED',
        CollaboratorUpdated = <any> 'COLLABORATOR_UPDATED',
        CollaboratorRemoved = <any> 'COLLABORATOR_REMOVED',
        BookUpdated = <any> 'BOOK_UPDATED',
        BookDeleted = <any> 'BOOK_DELETED'
    }
}
