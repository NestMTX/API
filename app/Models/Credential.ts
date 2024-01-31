import { DateTime } from 'luxon'
import {
  afterFind,
  afterFetch,
  afterSave,
  beforeSave,
  BaseModel,
  column,
  computed,
  hasMany,
  HasMany,
} from '@ioc:Adonis/Lucid/Orm'
import Encryption from '@ioc:Adonis/Core/Encryption'
import crypto from 'crypto'
import Camera from './Camera'

const makeChecksum = (data: string) => {
  const hash = crypto.createHash('sha256')
  hash.update(data)
  return hash.digest('hex')
}

export default class Credential extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column()
  public description: string

  @column()
  public checksum: string

  @column()
  public oauthClientId: string

  @column({ serializeAs: null })
  public oauthClientSecret: string

  @column()
  public dacProjectId: string | null

  @column({ serializeAs: null })
  public tokens: any | null

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime

  @computed()
  public get isAuthorized() {
    if ('string' !== typeof this.tokens) {
      return false
    }
    try {
      JSON.parse(this.tokens)
      return true
    } catch {
      return false
    }
  }

  @computed()
  public get isDefault() {
    return this.description === 'Default'
  }

  @beforeSave()
  public static async encrypt(item: Credential) {
    item.checksum = makeChecksum(item.oauthClientId)
    item.oauthClientId = Encryption.encrypt(item.oauthClientId)
    item.oauthClientSecret = Encryption.encrypt(item.oauthClientSecret)
    item.dacProjectId = item.dacProjectId ? Encryption.encrypt(item.dacProjectId) : null
    item.tokens = item.tokens ? Encryption.encrypt(JSON.stringify(item.tokens)) : null
  }

  @afterSave()
  public static async decryptAfterSave(item: Credential) {
    await Credential.decrypt(item)
    const { default: Ws } = await import('App/Services/Ws')
    Ws.io?.emit('credentials:updated', item)
  }

  @afterFind()
  public static async decrypt(item: Credential) {
    item.oauthClientId = Encryption.decrypt(item.oauthClientId)!
    item.oauthClientSecret = Encryption.decrypt(item.oauthClientSecret)!
    item.dacProjectId = item.dacProjectId ? Encryption.decrypt(item.dacProjectId) : null
    item.tokens = item.tokens ? JSON.parse(Encryption.decrypt(item.tokens)!) : null
  }

  @afterFetch()
  public static async decryptAll(items: Credential[]) {
    for (const item of items) {
      await Credential.decrypt(item)
    }
  }

  @hasMany(() => Camera)
  public cameras: HasMany<typeof Camera>

  public getOauthClient(redirectUrl: string) {
    const { google } = require('googleapis') as typeof import('googleapis')
    return new google.auth.OAuth2(this.oauthClientId, this.oauthClientSecret, redirectUrl)
  }

  public getSDMClient(redirectUrl: string) {
    if ('string' === typeof this.tokens) {
      try {
        this.tokens = JSON.parse(this.tokens)
      } catch {
        this.tokens = null
      }
    }
    if (!this.tokens || 'object' !== typeof this.tokens) {
      throw new Error('No tokens found')
    }
    const { google } = require('googleapis') as typeof import('googleapis')
    const oac = this.getOauthClient(redirectUrl)
    oac.setCredentials(this.tokens)
    return google.smartdevicemanagement({
      version: 'v1',
      auth: oac,
    })
  }
}
