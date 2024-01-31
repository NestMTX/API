import make from '@nestmtx/pando-logger'
import winston from 'winston'
import { Writable } from 'stream'
import Logger from '@ioc:Adonis/Core/Logger'
import Env from '@ioc:Adonis/Core/Env'

export const makeLogger = (channel: string, port: number = 1835, level: string = 'debug') => {
  const pando = make(channel, port, level)
  const stream = new Writable({
    write(chunk, _encoding, callback) {
      try {
        const objectified = JSON.parse(chunk.toString())
        const { label, message, level } = objectified
        if (Env.get('NODE_ENV') === 'development') {
          switch (level) {
            case 'emerg':
            case 'alert':
            case 'crit':
            case 'error':
              Logger.error(`[${label}] ${message}`)
              break
            case 'warning':
              Logger.warn(`[${label}] ${message}`)
              break
            case 'notice':
            case 'info':
            case 'debug':
            default:
              Logger.info(`[${label}] ${message}`)
          }
        }
        pando[level](message, { label })
      } catch {
        const stringified = chunk.toString()
        console.log(stringified)
      }
      callback()
    },
  })
  const instance = winston.createLogger({
    level,
    levels: {
      emerg: 0,
      alert: 1,
      crit: 2,
      error: 3,
      warning: 4,
      notice: 5,
      info: 6,
      debug: 7,
    },
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.label({ label: channel }),
      winston.format.json()
    ),
    transports: [
      new winston.transports.Stream({
        stream: stream,
      }),
    ],
  })
  instance.once('finish', () => {
    stream.end()
    pando.close()
  })
  return instance
}
