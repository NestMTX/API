import * as mediasoup from 'mediasoup'
import * as SemanticSDP from 'semantic-sdp'
import RIDInfo = require('semantic-sdp/dist/RIDInfo')
import DataChannelInfo = require('semantic-sdp/dist/DataChannelInfo')
import SimulcastInfo = require('semantic-sdp/dist/SimulcastInfo')
import SimulcastStreamInfo = require('semantic-sdp/dist/SimulcastStreamInfo')
import DirectionWay = require('semantic-sdp/dist/DirectionWay')

type WebRTCRtpEncodingParameters = mediasoup.types.RtpEncodingParameters & {
  maxFramerate?: number
  adaptivePtime?: boolean
}

export const createWebRtcTransport = async (
  router: mediasoup.types.Router | undefined,
  webRtcServer: mediasoup.types.WebRtcServer | undefined
) => {
  if (!router) {
    throw new Error('Router not initialized')
  }
  if (!webRtcServer) {
    throw new Error('WebRTC Server not initialized')
  }
  const options: mediasoup.types.WebRtcTransportOptions = {
    webRtcServer: webRtcServer,
    enableUdp: true,
    enableTcp: true,
    preferTcp: true,
    enableSctp: true,
  }
  const transport: mediasoup.types.WebRtcTransport = await router.createWebRtcTransport(options)
  // Add Audio Producer
  const audioProducer = await transport.produce({
    kind: 'audio',
    rtpParameters: {
      mid: 'audio',
      codecs: [
        {
          mimeType: 'audio/opus',
          clockRate: 48000,
          channels: 2,
          payloadType: 111,
          parameters: {
            minptime: 10,
            useinbandfec: 1,
          },
          rtcpFeedback: [{ type: 'transport-cc' }],
        },
      ],
      encodings: [{ ssrc: 1111 }],
    },
  })
  // Add Video Producer
  const videoProducer = await transport.produce({
    kind: 'video',
    rtpParameters: {
      mid: 'video',
      codecs: [
        {
          mimeType: 'video/H264',
          clockRate: 90000,
          payloadType: 100,
          parameters: {
            'level-asymmetry-allowed': 1,
            'packetization-mode': 1,
            'profile-level-id': '42001f',
          },
          rtcpFeedback: [
            { type: 'nack' },
            { type: 'nack', parameter: 'pli' },
            { type: 'transport-cc' },
          ],
        },
      ],
    },
  })
  // Add Data Producer
  const applicationProducer = await transport.produceData({
    label: 'data',
    protocol: 'webrtc-datachannel',
    sctpStreamParameters: {
      streamId: 1,
    },
  })
  return { transport, audioProducer, videoProducer, applicationProducer }
}

export const getOfferSdpFromTransport = (
  transport: mediasoup.types.WebRtcTransport,
  audioProducer: mediasoup.types.Producer,
  videoProducer: mediasoup.types.Producer,
  applicationProducer: mediasoup.types.DataProducer
) => {
  const { iceParameters, iceCandidates, dtlsParameters, sctpParameters } = transport
  const sdp = new SemanticSDP.SDPInfo(1)
  sdp.setICE(semanticIceInfoFromMediasoupIceParameters(iceParameters))
  const dtlsInfos = semanticDTLSInfosFromMediasoupDtlsParameters(dtlsParameters)
  dtlsInfos.forEach((dtlsInfo) => {
    sdp.setDTLS(dtlsInfo)
  })
  sdp.addCandidates(semanticIceCandidatesFromMediasoupIceCandidates(iceCandidates))

  const audioInfo = semanticMediaInfoFromMediasoupProducer(audioProducer)
  sdp.addMedia(audioInfo)
  const videoInfo = semanticMediaInfoFromMediasoupProducer(videoProducer)
  sdp.addMedia(videoInfo)
  const applicationInfo = semanticMediaInfoFromMediasoupDataProducer(
    applicationProducer,
    sctpParameters
  )
  sdp.addMedia(applicationInfo)
  return sdp.toString()
}

const semanticIceInfoFromMediasoupIceParameters = (
  iceParameters: mediasoup.types.IceParameters
): SemanticSDP.ICEInfo => {
  const iceInfo = new SemanticSDP.ICEInfo(iceParameters.usernameFragment, iceParameters.password)
  iceInfo.setLite(iceParameters.iceLite === true)
  return iceInfo
}

const semanticDTLSInfosFromMediasoupDtlsParameters = (
  dtlsParameters: mediasoup.types.DtlsParameters
): Array<SemanticSDP.DTLSInfo> => {
  let dtlsSetup: SemanticSDP.Setup
  switch (dtlsParameters.role) {
    case 'client':
      dtlsSetup = SemanticSDP.Setup.ACTIVE
      break

    case 'server':
      dtlsSetup = SemanticSDP.Setup.PASSIVE
      break

    default:
      dtlsSetup = SemanticSDP.Setup.ACTPASS
      break
  }
  return dtlsParameters.fingerprints.map((fingerprint) => {
    return new SemanticSDP.DTLSInfo(dtlsSetup, fingerprint.algorithm, fingerprint.value)
  })
}

const semanticIceCandidatesFromMediasoupIceCandidates = (
  iceCandidates: Array<mediasoup.types.IceCandidate>
): Array<SemanticSDP.CandidateInfo> => {
  return iceCandidates.map((iceCandidate) => {
    return new SemanticSDP.CandidateInfo(
      iceCandidate.foundation,
      1,
      iceCandidate.protocol,
      iceCandidate.priority,
      iceCandidate.ip,
      iceCandidate.port,
      iceCandidate.type,
      iceCandidate.ip,
      iceCandidate.port
    )
  })
}

const semanticMediaInfoFromMediasoupProducer = (
  producer: mediasoup.types.Producer
): SemanticSDP.MediaInfo => {
  const mediaInfo = new SemanticSDP.MediaInfo(producer.id, producer.kind)
  // Add rtp header extension support from mediasoup producer
  producer.rtpParameters.headerExtensions?.forEach((extension) => {
    mediaInfo.addExtension(extension.id, extension.uri)
  })
  // Add rid information from mediasoup producer & simulcast information
  const simulcast = new SimulcastInfo()
  producer.rtpParameters.encodings?.forEach((encoding: WebRTCRtpEncodingParameters) => {
    if (encoding.rid) {
      const stream = new SimulcastStreamInfo(encoding.rid, false)
      simulcast.addSimulcastStream(DirectionWay.SEND, stream)
      const ridInfo = new RIDInfo(encoding.rid, DirectionWay.SEND)
      const formats = producer.rtpParameters.codecs.map((codec) => codec.payloadType)
      ridInfo.setFormats(formats)
      // Add the SSRC if it's available
      if (encoding.ssrc) {
        ridInfo.addParam('ssrc', encoding.ssrc.toString())
      }
      // Add the scalability mode information if it's available
      if (encoding.scalabilityMode) {
        ridInfo.addParam('scalability-mode', encoding.scalabilityMode)
      }
      // Add the max bitrate if it's available
      if (encoding.maxBitrate) {
        ridInfo.addParam('max-bitrate', encoding.maxBitrate.toString())
      }
      // Add the max framerate if it's available
      if (encoding.maxFramerate) {
        ridInfo.addParam('max-framerate', encoding.maxFramerate.toString())
      }
      // Add the adaptive ptime if it's available
      if ('undefined' !== typeof encoding.adaptivePtime) {
        ridInfo.addParam('adaptive-ptime', encoding.adaptivePtime.toString())
      }
      mediaInfo.addRID(ridInfo)
    }
  })
  if (producer.rtpParameters.encodings && producer.rtpParameters.encodings.length > 1) {
    mediaInfo.setSimulcast(simulcast)
  }
  // Add the codecs from the mediasoup producer
  const codecs: Map<number, SemanticSDP.CodecInfo> = new Map(
    producer.rtpParameters.codecs.map((codec) => {
      const codecInfo: SemanticSDP.CodecInfo = new SemanticSDP.CodecInfo(
        codec.mimeType.replace(`${producer.kind}/`, ''),
        codec.payloadType,
        codec.parameters || {}
      )
      codecInfo.setChannels(codec.channels || 1)
      codec.rtcpFeedback?.forEach((fb) => {
        codecInfo.addRTCPFeedback(new SemanticSDP.RTCPFeedbackInfo(fb.type, [fb.parameter || '']))
      })
      const encoding = producer.rtpParameters.encodings?.find(
        (encoding) => encoding.codecPayloadType === codec.payloadType
      )
      if (encoding) {
        if (encoding.rtx && encoding.rtx.ssrc) {
          codecInfo.setRTX(encoding.rtx.ssrc)
        }
      }
      return [codec.payloadType, codecInfo]
    })
  )
  mediaInfo.setCodecs(codecs)
  // Set the max bitrate if it's available
  let maxBitrate: number | undefined
  producer.rtpParameters.encodings?.forEach((encoding) => {
    if ('undefined' !== typeof encoding.maxBitrate) {
      if ('undefined' === typeof maxBitrate || encoding.maxBitrate > maxBitrate) {
        maxBitrate = encoding.maxBitrate
      }
    }
  })
  if ('undefined' !== typeof maxBitrate) {
    mediaInfo.setBitrate(maxBitrate)
  }
  // Set the Direction
  mediaInfo.setDirection(SemanticSDP.Direction.RECVONLY)
  return mediaInfo
}

const semanticMediaInfoFromMediasoupDataProducer = (
  producer: mediasoup.types.DataProducer,
  sctpParameters?: mediasoup.types.SctpParameters | undefined
): SemanticSDP.MediaInfo => {
  const mediaInfo = new SemanticSDP.MediaInfo(producer.id, 'application')
  // Set the Direction
  mediaInfo.setDirection(SemanticSDP.Direction.SENDRECV)
  // Set the Data Channel Information
  if (sctpParameters) {
    const dataChannelInformation = new DataChannelInfo(
      sctpParameters.port,
      sctpParameters.maxMessageSize
    )
    mediaInfo.setDataChannel(dataChannelInformation)
  }
  return mediaInfo
}

export const calculateBitrate = (
  width: number | undefined | null,
  height: number | undefined | null,
  fps: number | undefined | null
) => {
  if (!width || !height || !fps) {
    return 10000
  }
  // Base values for 720p at 30fps
  const baseBitrate = 4000 // in kbps
  const basePixels = 1280 * 720 // 720p resolution
  const baseFPS = 30

  // Scaling factors
  const resolutionScalingFactor = 0.67
  const frameRateScalingFactor = 1.5

  // Current pixels
  const currentPixels = width * height

  // Calculate max bitrate
  const maxBitrate =
    baseBitrate *
    (currentPixels / basePixels) *
    resolutionScalingFactor *
    (fps / baseFPS) *
    frameRateScalingFactor

  return maxBitrate
}
