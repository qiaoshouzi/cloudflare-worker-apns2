import { Notification, NotificationOptions } from './notification';
export declare class SilentNotification extends Notification {
    constructor(deviceToken: string, options?: Omit<NotificationOptions, 'type' | 'alert' | 'priority' | 'contentAvailable'>);
}
