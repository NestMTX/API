import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'cameras'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table
        .integer('credential_id')
        .unsigned()
        .references('id')
        .inTable('credentials')
        .onDelete('CASCADE')
      table.string('uid').notNullable()
      table.string('room').notNullable()
      table.string('name').notNullable()
      table.text('checksum').notNullable().unique()
      table.string('info').notNullable()
      table.string('mediamtx_path').nullable().unique()
      table.boolean('is_active').defaultTo(false)
      table.boolean('is_ready').defaultTo(false)
      table.text('stream_info').nullable()

      /**
       * Uses timestamptz for PostgreSQL and DATETIME2 for MSSQL
       */
      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
