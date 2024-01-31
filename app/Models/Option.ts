import { DateTime } from 'luxon'
import { BaseModel, column } from '@ioc:Adonis/Lucid/Orm'
import merge from 'lodash.merge'

export default class Option extends BaseModel {
  @column({ isPrimary: true, serializeAs: null })
  public id: number

  @column()
  public key: string

  @column({
    prepare: (value) => {
      return JSON.stringify(value)
    },
    consume: (value) => {
      try {
        return JSON.parse(value)
      } catch (error) {
        return value
      }
    },
  })
  public value: any

  @column.dateTime({ autoCreate: true, serializeAs: null })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true, serializeAs: null })
  public updatedAt: DateTime

  public static async get(key: string, onNonExisting?: any) {
    try {
      const item = await this.findBy('key', key)
      if (item) {
        return item.value
      } else {
        return onNonExisting
      }
    } catch {
      return onNonExisting
    }
  }

  public static async set(key: string, value: any, partial: boolean = false) {
    let item
    try {
      item = await this.firstOrNew({ key }, { key, value })
    } catch (error) {
      throw error
    }
    if (item.$isPersisted && partial && typeof item.value === 'object' && item.value !== null) {
      item.value = merge({}, item.value, value)
    } else {
      item.value = value
    }
    try {
      await item.save()
      return item.value
    } catch (error) {
      throw error
    }
  }
}
