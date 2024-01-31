/**
 * A feeble attempt to convert the ffmpeg error codes to human readable strings.
 * This is not complete and will be updated as needed.
 */

function MKTAG(a: string, b: string, c: string, d: string): number {
  return (
    a.charCodeAt(0) | (b.charCodeAt(0) << 8) | (c.charCodeAt(0) << 16) | (d.charCodeAt(0) << 24)
  )
}

function FFERRTAG(a: string, b: string, c: string, d: string): number {
  return -MKTAG(a, b, c, d)
}

export const knownErrors = [
  {
    name: 'AVERROR_BSF_NOT_FOUND',
    code: FFERRTAG((0xf8).toString(), 'B', 'S', 'F'),
    description: 'Bitstream filter not found. ',
  },
  {
    name: 'AVERROR_BUG',
    code: FFERRTAG('B', 'U', 'G', '!'),
    description: 'Internal bug, also see AVERROR_BUG2.',
  },
  {
    name: 'AVERROR_BUFFER_TOO_SMALL',
    code: FFERRTAG('B', 'U', 'F', 'S'),
    description: 'Buffer too small.',
  },
  {
    name: 'AVERROR_DECODER_NOT_FOUND',
    code: FFERRTAG((0xf8).toString(), 'D', 'E', 'C'),
    description: 'Decoder not found.',
  },
  {
    name: 'AVERROR_DEMUXER_NOT_FOUND',
    code: FFERRTAG((0xf8).toString(), 'D', 'E', 'M'),
    description: 'Demuxer not found.',
  },
  {
    name: 'AVERROR_ENCODER_NOT_FOUND',
    code: FFERRTAG((0xf8).toString(), 'E', 'N', 'C'),
    description: 'Encoder not found.',
  },
  {
    name: 'AVERROR_EOF',
    code: FFERRTAG('E', 'O', 'F', ' '),
    description: 'End of file.',
  },
  {
    name: 'AVERROR_EXIT',
    code: FFERRTAG('E', 'X', 'I', 'T'),
    description: 'Immediate exit was requested; the called function should not be restarted.',
  },
  {
    name: 'AVERROR_EXTERNAL',
    code: FFERRTAG('E', 'X', 'T', ' '),
    description: 'Generic error in an external library.',
  },
  {
    name: 'AVERROR_FILTER_NOT_FOUND',
    code: FFERRTAG((0xf8).toString(), 'F', 'I', 'L'),
    description: 'Filter not found.',
  },
  {
    name: 'AVERROR_INVALIDDATA',
    code: FFERRTAG('I', 'N', 'D', 'A'),
    description: 'Invalid data found when processing input.',
  },
  {
    name: 'AVERROR_MUXER_NOT_FOUND',
    code: FFERRTAG((0xf8).toString(), 'M', 'U', 'X'),
    description: 'Muxer not found.',
  },
  {
    name: 'AVERROR_OPTION_NOT_FOUND',
    code: FFERRTAG((0xf8).toString(), 'O', 'P', 'T'),
    description: 'Option not found.',
  },
  {
    name: 'AVERROR_PATCHWELCOME',
    code: FFERRTAG('P', 'A', 'W', 'E'),
    description: 'Not yet implemented in FFmpeg, patches welcome.',
  },
  {
    name: 'AVERROR_PROTOCOL_NOT_FOUND',
    code: FFERRTAG((0xf8).toString(), 'P', 'R', 'O'),
    description: 'Protocol not found.',
  },
  {
    name: 'AVERROR_STREAM_NOT_FOUND',
    code: FFERRTAG((0xf8).toString(), 'S', 'T', 'R'),
    description: 'Stream not found.',
  },
  {
    name: 'AVERROR_BUG2',
    code: FFERRTAG('B', 'U', 'G', ' '),
    description:
      'This is semantically identical to AVERROR_BUG it has been introduced in Libav after our AVERROR_BUG and with a modified value.',
  },
  {
    name: 'AVERROR_UNKNOWN',
    code: FFERRTAG('U', 'N', 'K', 'N'),
    description: 'Unknown error, typically from an external library.',
  },
  {
    name: 'AVERROR_EXPERIMENTAL',
    code: -0x2bb2afa8,
    description:
      'Requested feature is flagged experimental. Set strict_std_compliance if you really want to use it.',
  },
  {
    name: 'AVERROR_INPUT_CHANGED',
    code: -0x636e6701,
    description:
      'Input changed between calls. Reconfiguration is required. (can be OR-ed with AVERROR_OUTPUT_CHANGED)',
  },
  {
    name: 'AVERROR_OUTPUT_CHANGED',
    code: -0x636e6702,
    description:
      'Output changed between calls. Reconfiguration is required. (can be OR-ed with AVERROR_INPUT_CHANGED)',
  },
  {
    name: 'AVERROR_HTTP_BAD_REQUEST',
    code: FFERRTAG((0xf8).toString(), '4', '0', '0'),
    description: 'Source feed returned a status of "400"',
  },
  {
    name: 'AVERROR_HTTP_UNAUTHORIZED',
    code: FFERRTAG((0xf8).toString(), '4', '0', '1'),
    description: 'Source feed returned a status of "401"',
  },
  {
    name: 'AVERROR_HTTP_FORBIDDEN',
    code: FFERRTAG((0xf8).toString(), '4', '0', '3'),
    description: 'Source feed returned a status of "403"',
  },
  {
    name: 'AVERROR_HTTP_NOT_FOUND',
    code: FFERRTAG((0xf8).toString(), '4', '0', '4'),
    description: 'Source feed returned a status of "404"',
  },
  {
    name: 'AVERROR_HTTP_OTHER_4XX',
    code: FFERRTAG((0xf8).toString(), '4', 'X', 'X'),
    description: 'Source feed returned a "4XX" error',
  },
  {
    name: 'AVERROR_HTTP_SERVER_ERROR',
    code: FFERRTAG((0xf8).toString(), '5', 'X', 'X'),
    description: 'Source feed returned a "5XX" error',
  },
]
