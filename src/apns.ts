import { sign } from '@tsndr/cloudflare-worker-jwt'
// import { sign, Secret } from 'jsonwebtoken'
// import { fetch, RequestInit, Response } from 'fetch-http2'
import { EventEmitter } from 'events'
import { Errors } from './errors'
import { Notification } from './notifications/notification'

// APNS version
const API_VERSION = 3

// Signing algorithm for JSON web token
const SIGNING_ALGORITHM = 'ES256'

// Reset our signing token every 55 minutes as reccomended by Apple
const RESET_TOKEN_INTERVAL_MS = 55 * 60 * 1000

export enum Host {
  production = 'api.push.apple.com',
  development = 'api.sandbox.push.apple.com'
}

export interface SigningToken {
  value: string
  timestamp: number
}

export interface ApnsOptions {
  team: string
  signingKey: string
  keyId: string
  defaultTopic?: string
  host?: Host | string
  requestTimeout?: number
  pingInterval?: number
  connections?: number
}

export class ApnsClient extends EventEmitter {
  readonly team: string
  readonly keyId: string
  readonly host: Host | string
  readonly signingKey: string
  readonly defaultTopic?: string

  private _token: SigningToken | null

  constructor(options: ApnsOptions) {
    super()
    this.team = options.team
    this.keyId = options.keyId
    this.signingKey = options.signingKey
    this.defaultTopic = options.defaultTopic
    this.host = options.host ?? Host.production
    this._token = null
    this.on(Errors.expiredProviderToken, () => this._resetSigningToken())
  }

  send(notification: Notification) {
    return this._send(notification)
  }

  sendMany(notifications: Notification[]) {
    const promises = notifications.map((notification) => {
      return this._send(notification).catch((error: any) => ({ error }))
    })
    return Promise.all(promises)
  }

  private async _send(notification: Notification) {
    const token = encodeURIComponent(notification.deviceToken)
    const url = `https://${this.host}/${API_VERSION}/device/${token}`
    const headers = new Headers()
    headers.set('authorization', `bearer ${await this._getSigningToken()}`)
    headers.set('apns-push-type', notification.pushType)
    headers.set('apns-priority', notification.priority.toString())
    if (notification.options.topic || this.defaultTopic)
      headers.set('apns-topic', (notification.options.topic ?? this.defaultTopic) as string)
    if (notification.options.expiration)
      headers.set(
        'apns-expiration',
        typeof notification.options.expiration === 'number'
          ? notification.options.expiration.toFixed(0)
          : (notification.options.expiration.getTime() / 1000).toFixed(0)
      )
    if (notification.options.collapseId)
      headers.set('apns-collapse-id', notification.options.collapseId)
    const options: RequestInit = {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(notification.buildApnsOptions())
      // keepAlive: 5000
    }

    // if (notification.options.expiration) {
    //   options.headers!['apns-expiration'] =
    //     typeof notification.options.expiration === 'number'
    //       ? notification.options.expiration.toFixed(0)
    //       : (notification.options.expiration.getTime() / 1000).toFixed(0)
    // }

    // if (notification.options.collapseId) {
    //   options.headers!['apns-collapse-id'] = notification.options.collapseId
    // }

    const res = await fetch(url, options)

    return this._handleServerResponse(res, notification)
  }

  private async _handleServerResponse(res: Response, notification: Notification) {
    if (res.status === 200) {
      return notification
    }

    let json: { [key: string]: any }

    try {
      json = await res.json()
    } catch (err) {
      json = { reason: Errors.unknownError }
    }

    json.statusCode = res.status
    json.notification = notification

    this.emit(json.reason, json)
    this.emit(Errors.error, json)

    throw json
  }

  private async _getSigningToken(): Promise<string> {
    if (this._token && Date.now() - this._token.timestamp < RESET_TOKEN_INTERVAL_MS) {
      return this._token.value
    }

    const claims = {
      iss: this.team,
      iat: Math.floor(Date.now() / 1000)
    }

    const token = await sign(claims, this.signingKey, {
      algorithm: SIGNING_ALGORITHM,
      header: {
        algorithm: SIGNING_ALGORITHM,
        kid: this.keyId
      }
    })

    this._token = {
      value: token,
      timestamp: Date.now()
    }

    return token
  }

  private _resetSigningToken() {
    this._token = null
  }
}
