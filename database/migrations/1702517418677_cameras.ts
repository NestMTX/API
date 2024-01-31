import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'cameras'

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.text('webrtc_ffmpeg_sdp').nullable()
      table.integer('webrtc_width').nullable()
      table.integer('webrtc_height').nullable()
      table.integer('webrtc_fps').nullable()
      table.integer('webrtc_bitrate_k').nullable().defaultTo(512)
    })
  }

  public async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('webrtc_ffmpeg_sdp')
      table.dropColumn('webrtc_width')
      table.dropColumn('webrtc_height')
      table.dropColumn('webrtc_fps')
      table.dropColumn('webrtc_bitrate_k')
    })
  }
}
