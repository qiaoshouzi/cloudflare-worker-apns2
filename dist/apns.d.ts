/// <reference types="node" />
import { EventEmitter } from 'events';
import { Notification } from './notifications/notification';
export declare enum Host {
    production = "api.push.apple.com",
    development = "api.sandbox.push.apple.com"
}
export interface SigningToken {
    value: string;
    timestamp: number;
}
export interface ApnsOptions {
    team: string;
    signingKey: string;
    keyId: string;
    defaultTopic?: string;
    host?: Host | string;
    requestTimeout?: number;
    pingInterval?: number;
    connections?: number;
}
export declare class ApnsClient extends EventEmitter {
    readonly team: string;
    readonly keyId: string;
    readonly host: Host | string;
    readonly signingKey: string;
    readonly defaultTopic?: string;
    private _token;
    constructor(options: ApnsOptions);
    send(notification: Notification): Promise<Notification>;
    sendMany(notifications: Notification[]): Promise<(Notification | {
        error: any;
    })[]>;
    private _send;
    private _handleServerResponse;
    private _getSigningToken;
    private _resetSigningToken;
}
