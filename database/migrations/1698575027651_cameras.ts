import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'cameras'

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      // table
      //   .text('last_offer_sdp_src')
      //   .nullable()
      //   .comment('The last offer SDP from MediaMTX used to generate a stream')
      // table
      //   .text('last_offer_sdp_ret')
      //   .nullable()
      //   .comment("The last offer SDP that was sent to Google's API to generate a stream")
      // table.text('last_answer_sdp_src').nullable().comment("The last answer SDP from Google's API")
      // table
      //   .text('last_answer_sdp_ret')
      //   .nullable()
      //   .comment('The last answer SDP that was sent to MediaMTX')
      table
        .integer('child_process_id')
        .unsigned()
        .nullable()
        .comment('The child process ID of the go2rtc process for WebRTC cameras')
    })
  }

  public async down() {
    this.schema.alterTable(this.tableName, (table) => {
      // table.dropColumn('last_offer_sdp_src')
      // table.dropColumn('last_offer_sdp_ret')
      // table.dropColumn('last_answer_sdp_src')
      // table.dropColumn('last_answer_sdp_ret')
      table.dropColumn('child_process_id')
    })
  }
}
