import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'cameras'

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.text('redirect_uri').nullable()
    })
  }

  public async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('redirect_uri')
    })
  }
}
