import { PushType } from './constants/push-type';
import { Priority } from './constants/priority';
export { PushType, Priority };
export interface NotificationOptions {
    type?: PushType;
    alert?: string | {
        title: string;
        subtitle?: string;
        body: string;
    };
    badge?: number;
    expiration?: number | Date;
    sound?: string | CriticalAlertSoundPayload;
    category?: string;
    data?: Record<string, unknown>;
    contentAvailable?: boolean;
    priority?: Priority;
    topic?: string;
    collapseId?: string;
    threadId?: string;
    aps?: Record<string, unknown>;
}
export interface ApnsPayload {
    aps: Record<string, unknown>;
    [key: string]: unknown;
}
export interface CriticalAlertSoundPayload {
    critical: 0 | 1;
    name?: string;
    volume?: number;
}
export declare class Notification {
    readonly deviceToken: string;
    readonly options: NotificationOptions;
    constructor(deviceToken: string, options?: NotificationOptions);
    get pushType(): PushType;
    get priority(): Priority;
    buildApnsOptions(): ApnsPayload;
}
