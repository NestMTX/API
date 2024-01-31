import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'cameras'

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('startup_mode').defaultTo('always_on')
    })
  }

  public async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('startup_mode')
    })
  }
}
