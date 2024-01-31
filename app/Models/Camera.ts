import { DateTime } from 'luxon'
import {
  afterFind,
  afterFetch,
  afterSave,
  beforeSave,
  BaseModel,
  column,
  belongsTo,
  BelongsTo,
  computed,
} from '@ioc:Adonis/Lucid/Orm'
import Env from '@ioc:Adonis/Core/Env'
import Encryption from '@ioc:Adonis/Core/Encryption'
import Credential from './Credential'
import type { smartdevicemanagement_v1 } from 'googleapis'
import Event from '@ioc:Adonis/Core/Event'
import { calculateBitrate } from 'App/Utilities/WebRTC'
import { makeChecksum } from 'App/Utilities/ApplicationUtilities'
import { makeLogger } from 'App/Clients/Logger'

interface GetBasePublicUrlOptions {
  protocol?: string
  pathname?: string
  searchParams?: Record<string, string>
}

const writeDebugFile = async (content: string | Buffer, filename: string) => {
  const { writeFileSync } = await import('fs')
  const { join } = await import('path')
  const location = join(__dirname, '..', '..', `${filename}.debug`)
  writeFileSync(location, content)
}

export default class Camera extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column()
  public credentialId: number

  @column()
  public uid: string

  @column()
  public room: string

  @column()
  public name: string

  @column()
  public checksum: string

  @column()
  public info: smartdevicemanagement_v1.Schema$GoogleHomeEnterpriseSdmV1Device | string

  @column()
  public mediamtxPath: string | null

  @column({ serialize: (value) => Boolean(value) })
  public isActive: boolean

  @column({ serialize: (value) => Boolean(value) })
  public isReady: boolean

  @column()
  public streamInfo: any | string | null

  @column()
  public childProcessId: number | null

  @beforeSave()
  public static async encrypt(item: Camera) {
    item.checksum = makeChecksum(item.uid)
    item.uid = Encryption.encrypt(item.uid)
    item.info = Encryption.encrypt(JSON.stringify(item.info))
    item.streamInfo =
      'object' === typeof item.streamInfo
        ? Encryption.encrypt(JSON.stringify(item.streamInfo))
        : null
    Event.emit(`camera:${item.id}:updating`, item.$dirty)
    Event.emit(`camera:updating`, {
      id: item.id,
      dirty: item.$dirty,
    })
  }

  @afterSave()
  public static async decryptAfterSave(item: Camera) {
    await Camera.decrypt(item)
    const { default: Event } = await import('@ioc:Adonis/Core/Event')
    Event.emit(`camera:${item.id}:updated`, item)
    Event.emit(`camera:updated`, item)
  }

  @afterFind()
  public static async decrypt(item: Camera) {
    item.uid = Encryption.decrypt(item.uid)!
    item.info = JSON.parse(Encryption.decrypt(item.info as string)!)
    item.streamInfo =
      'string' === typeof item.streamInfo
        ? JSON.parse(Encryption.decrypt(item.streamInfo as string)!)
        : null
  }

  @afterFetch()
  public static async decryptAll(items: Camera[]) {
    for (const item of items) {
      await Camera.decrypt(item)
    }
  }

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime

  @column({ serializeAs: null })
  public webrtcFfmpegSdp: string | null

  @column({ serializeAs: null })
  public webrtcWidth: number | null

  @column({ serializeAs: null })
  public webrtcHeight: number | null

  @column({ serializeAs: null })
  public webrtcFps: number | null

  @column({ serializeAs: null })
  public webrtcBitrateK: number | null

  @column()
  public startupMode: 'always_on' | 'on_demand' | 'never'

  @column()
  public redirectUri: string | null

  @column()
  public isDemanded: boolean

  @belongsTo(() => Credential)
  public credential: BelongsTo<typeof Credential>

  @computed()
  public get traits() {
    if ('string' === typeof this.info) {
      return {}
    }
    const ret: any = {}
    for (const section in this.info.traits!) {
      const sectionTraits = this.info.traits![section]
      for (const key in sectionTraits) {
        ret[key] = sectionTraits[key]
      }
    }
    return ret
  }

  @computed()
  public get resolution() {
    if ('string' === typeof this.info) {
      return null
    }
    return this.traits.maxVideoResolution || null
  }

  @computed()
  public get protocols() {
    if ('string' === typeof this.info) {
      return []
    }
    return this.traits.supportedProtocols || []
  }

  @computed()
  public get isRtspSupported() {
    return this.protocols?.includes('RTSP') || false
  }

  @computed()
  public get isWebrtcSupported() {
    return this.protocols?.includes('WEB_RTC') || false
  }

  @computed()
  public get streamWidth() {
    if (!this.isWebrtcSupported) {
      return null
    }
    if (this.webrtcWidth && this.webrtcWidth > 0) {
      return this.webrtcWidth
    }
    return Env.get('WEBRTC_DEFAULT_WIDTH', 1920)
  }

  @computed()
  public get streamHeight() {
    if (!this.isWebrtcSupported) {
      return null
    }
    if (this.webrtcHeight && this.webrtcHeight > 0) {
      return this.webrtcHeight
    }
    return Env.get('WEBRTC_DEFAULT_HEIGHT', 1080)
  }

  @computed()
  public get streamFps() {
    if (!this.isWebrtcSupported) {
      return null
    }
    if (this.webrtcFps && this.webrtcFps > 0) {
      return this.webrtcFps
    }
    return Env.get('WEBRTC_DEFAULT_FPS', 30)
  }

  @computed()
  public get streamBitrateK() {
    if (!this.isWebrtcSupported) {
      return null
    }
    if (this.webrtcBitrateK && this.webrtcBitrateK > 0) {
      return this.webrtcBitrateK
    }
    return (
      Env.get('WEBRTC_DEFAULT_BITRATE') ||
      calculateBitrate(this.streamWidth, this.streamHeight, this.streamFps)
    )
  }

  @computed()
  public get deviceIconType() {
    if ('string' === typeof this.info) {
      return 'camera.wired.indoor'
    }
    switch (this.info.type) {
      case 'sdm.devices.types.CAMERA':
        if (this.protocols.includes('RTSP') && this.protocols.includes('WEB_RTC')) {
          return 'camera.wired'
        }
        if (!this.protocols.includes('RTSP') && this.protocols.includes('WEB_RTC')) {
          return 'camera.battery'
        }
        return 'camera.wired.indoor'

      case 'sdm.devices.types.DOORBELL':
        if (this.protocols.includes('RTSP')) {
          return 'doorbell.legacy'
        }
        return 'doorbell.wired'
    }
    const logger = makeLogger(`api:camera:${this.id}`)
    logger.warn(`Unknown device type: ${this.info.type}`)
    return ''
  }

  private getBasePublicUrl(port: number, options?: GetBasePublicUrlOptions) {
    const defaultOptions = {
      protocol: 'http',
      pathname: '',
      searchParams: {},
    }
    const defined = Object.assign({}, defaultOptions, options)
    const base =
      Env.get('MEDIAMTX_API_URL', 'http://127.0.0.1:9997') === 'http://127.0.0.1:9997'
        ? `http://localhost:${port}`
        : Env.get(
            'MEDIAMTX_RTSP_HOST',
            Env.get('MEDIAMTX_API_URL', 'http://127.0.0.1:9997').replace('9997', port.toString())
          )
    const url = new URL(defined.pathname, base)
    url.protocol = `${defined.protocol}:`
    for (const key in defined.searchParams!) {
      url.searchParams.set(key, defined.searchParams![key])
    }
    return url
      .toString()
      .replace('http:', `${defined.protocol}:`)
      .replace(/\/\/(localhost|127\.0\.0\.1):/gm, '//<window.location.origin>:')
  }

  @computed()
  public get rtspTcpUrl() {
    if (!this.mediamtxPath) {
      return null
    }
    const port = Env.get('RTSP_TCP_PORT', 8554)
    if (port <= 0) {
      return null
    }
    return this.getBasePublicUrl(port, {
      protocol: 'rtsp',
      pathname: `/${this.mediamtxPath}`,
    })
  }
  @computed()
  public get rtspUdpRtpUrl() {
    if (!this.mediamtxPath) {
      return null
    }
    const port = Env.get('RTSP_UDP_RTP_PORT', 8000)
    if (port <= 0) {
      return null
    }
    return this.getBasePublicUrl(port, {
      protocol: 'rtsp',
      pathname: `/${this.mediamtxPath}`,
    })
  }
  @computed()
  public get rtspUdpRtcpUrl() {
    if (!this.mediamtxPath) {
      return null
    }
    const port = Env.get('RTSP_UDP_RTCP_PORT', 8001)
    if (port <= 0) {
      return null
    }
    return this.getBasePublicUrl(port, {
      protocol: 'rtsp',
      pathname: `/${this.mediamtxPath}`,
    })
  }
  @computed()
  public get rtmpUrl() {
    if (!this.mediamtxPath) {
      return null
    }
    const port = Env.get('RTMP_PORT', 1935)
    if (port <= 0) {
      return null
    }
    return this.getBasePublicUrl(port, {
      protocol: 'rtmp',
      pathname: `/${this.mediamtxPath}`,
    })
  }
  @computed()
  public get hlsUrl() {
    if (!this.mediamtxPath) {
      return null
    }
    const port = Env.get('HLS_PORT', 8888)
    if (port <= 0) {
      return null
    }
    return this.getBasePublicUrl(port, {
      protocol: 'http',
      pathname: `/${this.mediamtxPath}`,
    })
  }
  @computed()
  public get hlsM3u8Url() {
    if (!this.mediamtxPath) {
      return null
    }
    const port = Env.get('HLS_PORT', 8888)
    if (port <= 0) {
      return null
    }
    return this.getBasePublicUrl(port, {
      protocol: 'http',
      pathname: `/${this.mediamtxPath}/index.m3u8`,
    })
  }
  @computed()
  public get webRtcUrl() {
    if (!this.mediamtxPath) {
      return null
    }
    const port = Env.get('WEB_RTC_PORT', 8889)
    if (port <= 0) {
      return null
    }
    return this.getBasePublicUrl(port, {
      protocol: 'http',
      pathname: `/${this.mediamtxPath}`,
    })
  }
  @computed()
  public get srtUrl() {
    if (!this.mediamtxPath) {
      return null
    }
    const port = Env.get('SRT_PORT', 8890)
    if (port <= 0) {
      return null
    }
    return this.getBasePublicUrl(port, {
      protocol: 'srt',
      searchParams: {
        streamid: `read:${this.mediamtxPath}`,
      },
    })
  }

  public async startStream(_redirectUri: string, _force: boolean = false) {
    // if (!this.mediamtxPath) {
    //   throw new Error(`You cannot start a camera without a Path`)
    // }
    // // if (this.isActive && !force) {
    // //   throw new Error(`Camera is already active`)
    // // }
    // // const { default: MixerManager } = await import('@ioc:MediaMTX/Mixer')
    // if ('string' === typeof this.info) {
    //   Camera.decrypt(this)
    // }
    // try {
    //   await (this as Camera).load('credential')
    // } catch {
    //   // noop
    // }
    // // await MixerManager.onCameraEnabled(this)
    // const service = this.credential.getSDMClient(redirectUri)
    // if (this.isRtspSupported) {
    //   return await this.startRtspStream(service, redirectUri)
    // } else if (this.isWebrtcSupported) {
    //   return await this.startWebrtcStream(service, redirectUri)
    // } else {
    //   console.log(this.toObject())
    //   throw new Error('Camera does not support any streaming protocols')
    // }
  }

  public async handleIncomingWhep(offerSdp: string, redirectUri: string) {
    const logger = makeLogger(`api:camera:${this.id}`)
    /**
     * m=application 9 UDP/DTLS/SCTP webrtc-datachannel
     * c=IN IP4 0.0.0.0
     * a=ice-ufrag:6ReD
     * a=ice-pwd:QBmcZYd/t+InpMVkxQEEXnE4
     * a=ice-options:trickle
     * a=fingerprint:sha-256 DD:7E:6F:CD:B8:13:4E:37:D2:92:6D:8E:30:FB:FE:13:29:C9:F8:FD:78:0B:C4:59:42:61:BC:CF:02:91:6B:3C
     * a=setup:actpass
     * a=mid:2
     * a=sctp-port:5000
     * a=max-message-size:262144
     */

    const hasApplication = offerSdp?.includes('m=application') || false
    if (!hasApplication) {
      const lines = [
        'm=application 9 UDP/DTLS/SCTP webrtc-datachannel',
        'c=IN IP4 0.0.0.0',
        'a=ice-ufrag:6ReD',
        'a=ice-pwd:QBmcZYd/t+InpMVkxQEEXnE4',
        'a=ice-options:trickle',
        'a=fingerprint:sha-256 DD:7E:6F:CD:B8:13:4E:37:D2:92:6D:8E:30:FB:FE:13:29:C9:F8:FD:78:0B:C4:59:42:61:BC:CF:02:91:6B:3C',
        'a=setup:actpass',
        'a=mid:2',
        'a=sctp-port:5000',
        'a=max-message-size:262144',
      ]
      offerSdp = offerSdp += `${lines.join('\r\n')}\r\n`
    }
    offerSdp = this.sortOfferSdp(offerSdp)
    try {
      await (this as Camera).load('credential')
    } catch {
      // noop
    }
    try {
      const service = this.credential.getSDMClient(redirectUri)
      const {
        data: { results },
      } = await service.enterprises.devices.executeCommand({
        name: this.uid,
        requestBody: {
          command: 'sdm.devices.commands.CameraLiveStream.GenerateWebRtcStream',
          params: {
            offerSdp,
          },
        },
      })
      // this.streamInfo = results!
      // await this.save()
      const { answerSdp } = results!
      logger.info(`Camera ${this.id} received an answer SDP`)
      await writeDebugFile(offerSdp, 'offerSdp')
      await writeDebugFile(answerSdp, 'answerSdp')
      return answerSdp
    } catch (error) {
      logger.crit(error)
      Event.emit(`camera:${this.id}:error`, error.message)
      await writeDebugFile(offerSdp, 'offerSdp')
      // console.log(offerSdp)
      throw error
    }
    // console.log(offerSdp, redirectUri)
    // throw new Error('Debugging')
    // this.lastOfferSdpSrc = offerSdp
    // if ('string' === typeof this.info) {
    //   Camera.decrypt(this)
    // }
    // try {
    //   await (this as Camera).load('credential')
    // } catch {
    //   // noop
    // }
    // /**
    //  * Fix the offer SDP to ensure that:
    //  * 1. We have audio, video and application m lines
    //  * 2. All m lines are recvonly
    //  */
    // const offer = SemanticSDP.SDPInfo.parse(offerSdp)
    // const audio = offer.getMedia('audio')
    // const video = offer.getMedia('video')
    // audio.setDirection(SemanticSDP.Direction.RECVONLY)
    // // video.setDirection(SemanticSDP.Direction.RECVONLY)
    // const application = new SemanticSDP.MediaInfo('2', 'application')
    // application.setDirection(SemanticSDP.Direction.RECVONLY)
    // application.setDataChannel(new DataChannelInfo(5000, 1024))
    // /**
    //  * Remove all audio codecs which aren't Opus
    //  */
    // audio.codecs.forEach((codecInfo, key) => {
    //   if ('opus' !== codecInfo.codec) {
    //     audio.codecs.delete(key)
    //   }
    // })
    // // audio.codecs = audio.codecs.filter((codec) => 'opus' === codec.getName())
    // /**
    //  * Store the current order of the m lines in the offer SDP
    //  */
    // const audioIndex = offer.medias.findIndex((media) => 'audio' === media.getType())
    // const videoIndex = offer.medias.findIndex((media) => 'video' === media.getType())
    // /**
    //  * Fix the order of the m lines to ensure that they are in the order:
    //  * 1. audio
    //  * 2. video
    //  * 3. application
    //  */
    // offer.medias = []
    // offer.addMedia(audio)
    // offer.addMedia(video)
    // offer.addMedia(application)
    // offerSdp = offer.toString()

    //   const answer = SemanticSDP.SDPInfo.parse(answerSdp)
    //   /**
    //    * Remove the "application" media, which isn't supported by the client
    //    * Then sort by the original sort order
    //    */
    //   answer.medias = answer.medias
    //     .filter((media) => 'application' !== media.getType())
    //     .sort((a, b) => {
    //       const aType = a.getType()
    //       const bType = b.getType()
    //       let aIndex: number = -1
    //       let bIndex: number = -1
    //       switch (aType) {
    //         case 'audio':
    //           aIndex = audioIndex
    //           break

    //         case 'video':
    //           aIndex = videoIndex
    //           break
    //       }
    //       switch (bType) {
    //         case 'audio':
    //           bIndex = audioIndex
    //           break

    //         case 'video':
    //           bIndex = videoIndex
    //           break
    //       }
    //       if (aIndex === -1) {
    //         return 1
    //       }
    //       if (bIndex === -1) {
    //         return -1
    //       }
    //       return aIndex - bIndex
    //     })
    //     .map((media, index) => {
    //       media.id = index.toString()
    //       return media
    //     })
    //   this.lastOfferSdpRet = offerSdp
    //   this.lastAnswerSdpSrc = answerSdp
    //   this.lastAnswerSdpRet = answer.toString()
    //   await this.save()
    //   return answer.toString()
    // } catch (error) {
    //   throw error
    // }
  }

  public async extendStream(redirectUri?: string) {
    if (!this.mediamtxPath) {
      throw new Error(`You cannot extend a camera without a Path`)
    }
    if (!this.isActive) {
      throw new Error(`Camera is not active`)
    }
    if ('string' === typeof this.info) {
      Camera.decrypt(this)
    }
    if (!this.streamInfo) {
      throw new Error(`Missing information on camera stream to extend`)
    }
    if (
      (this.isRtspSupported && !this.streamInfo.streamExtensionToken) ||
      (this.isWebrtcSupported && !this.streamInfo.mediaSessionId)
    ) {
      throw new Error(`This camera does not support stream extension`)
    }
    if (!redirectUri) {
      redirectUri = this.streamInfo.redirectUri
    }
    try {
      await (this as Camera).load('credential')
    } catch {
      // noop
    }
    const service = this.credential.getSDMClient(redirectUri!)
    if (this.isRtspSupported) {
      const {
        data: { results },
      } = await service.enterprises.devices.executeCommand({
        name: this.uid,
        requestBody: {
          command: 'sdm.devices.commands.CameraLiveStream.ExtendRtspStream',
          params: {
            streamExtensionToken: this.streamInfo.streamExtensionToken,
          },
        },
      })
      if (!results!.streamExtensionToken) {
        throw new Error('Update Failed')
      }
      this.streamInfo = Object.assign({}, this.streamInfo, results!)
      await this.save()
    } else if (this.isWebrtcSupported) {
      const {
        data: { results },
      } = await service.enterprises.devices.executeCommand({
        name: this.uid,
        requestBody: {
          command: 'sdm.devices.commands.CameraLiveStream.ExtendWebRtcStream',
          params: {
            mediaSessionId: this.streamInfo.mediaSessionId,
          },
        },
      })
      if (!results!.mediaSessionId) {
        throw new Error('Update Failed')
      }
      this.streamInfo = Object.assign({}, this.streamInfo, results!)
      await this.save()
    } else {
      console.log(this.toObject())
      throw new Error('Camera does not support any streaming protocols')
    }
  }

  public async stopStream(_allowFail: boolean = false) {
    // if (!this.mediamtxPath) {
    //   throw new Error(`You cannot stop a camera without a Path`)
    // }
    // if (!this.isActive) {
    //   if (allowFail) {
    //     return
    //   }
    //   throw new Error(`Camera is already inactive`)
    // }
    // const { default: MixerManager } = await import('@ioc:MediaMTX/Mixer')
    // await MixerManager.onCameraDisabled(this)
    // if (this.isWebrtcSupported) {
    //   const { default: webRTCProcessManager } = await import('@ioc:ffmpeg/WebRTCProcessManager')
    //   return await webRTCProcessManager.stopStream(this.id)
    // } else {
    //   const { default: rtspProcessManager } = await import('@ioc:ffmpeg/RTSPProcessManager')
    //   return await rtspProcessManager.stopStream(this.id)
    // }
  }

  // private async startRtspStream(
  //   service: smartdevicemanagement_v1.Smartdevicemanagement,
  //   redirectUri: string
  // ) {
  //   const { default: rtspProcessManager } = await import('@ioc:ffmpeg/RTSPProcessManager')
  //   return await rtspProcessManager.startStream(this, service, redirectUri)
  // }

  // private async startWebrtcStream(
  //   service: smartdevicemanagement_v1.Smartdevicemanagement,
  //   redirectUri: string
  // ) {
  //   const { default: webRTCProcessManager } = await import('@ioc:ffmpeg/WebRTCProcessManager')
  //   return await webRTCProcessManager.startStream(this, service, redirectUri)
  // }

  private sortOfferSdp(sdp: string) {
    const sections = sdp.split('\r\nm=') // Split the SDP into sections by m=
    const preamble = sections.shift() // Remove the preamble from the sections
    const audioSection = sections.find((section) => section.startsWith('audio'))
    const videoSection = sections.find((section) => section.startsWith('video'))
    const applicationSection = sections.find((section) => section.startsWith('application'))
    return [preamble, audioSection, videoSection, applicationSection].join('\r\nm=') // Rejoin the sections
  }

  public static async getStreamDestinationByPath(path: string) {
    const { default: Config } = await import('@ioc:Adonis/Core/Config')
    const publishConfig = Config.get('mediamtx.publish')
    const publishUrl = new URL(publishConfig.rtsp)
    publishUrl.pathname = `/${path}`
    if (publishConfig.username) {
      publishUrl.username = publishConfig.username
    }
    if (publishConfig.password) {
      publishUrl.password = publishConfig.password
    }
    return publishUrl.toString()
  }
}
