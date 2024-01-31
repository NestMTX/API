import type { ApplicationContract } from '@ioc:Adonis/Core/Application'
import type { Socket } from 'socket.io'

/*
|--------------------------------------------------------------------------
| Provider
|--------------------------------------------------------------------------
|
| Your application is not ready when this file is loaded by the framework.
| Hence, the top level imports relying on the IoC container will not work.
| You must import them inside the life-cycle methods defined inside
| the provider class.
|
| @example:
|
| public async ready () {
|   const Database = this.app.container.resolveBinding('Adonis/Lucid/Database')
|   const Event = this.app.container.resolveBinding('Adonis/Core/Event')
|   Event.on('db:query', Database.prettyPrint)
| }
|
*/
export default class SocketIoProvider {
  private sockets: Map<string, Socket> = new Map()
  private guiSockets: Map<string, Socket> = new Map()
  private apiSockets: Map<string, Socket> = new Map()
  constructor(protected app: ApplicationContract) {}

  public register() {
    this.app.container.singleton('Socket.IO/Broadcast/GUI', () => {
      return (event: string, ...args: any[]) => {
        this.guiSockets.forEach((socket) => {
          socket.emit(event, ...args)
        })
      }
    })
    this.app.container.singleton('Socket.IO/Broadcast/API', () => {
      return (event: string, ...args: any[]) => {
        this.apiSockets.forEach((socket) => {
          socket.emit(event, ...args)
        })
      }
    })
    this.app.container.singleton('Socket.IO/Broadcast', () => {
      return (event: string, ...args: any[]) => {
        this.sockets.forEach((socket) => {
          socket.emit(event, ...args)
        })
      }
    })
  }

  public async ready() {
    if (this.app.environment === 'web') {
      const { makeLogger } = await import('App/Clients/Logger')
      const logger = makeLogger('api:socket.io')
      const { default: io } = await import('../start/socket.io')
      logger.info('Socket.IO is hooked up to the HTTP server')
      io.on('connection', (socket) => {
        this.sockets.set(socket.id, socket)
        logger.info(`Socket ${socket.id} connected`)
        socket.on('disconnect', () => {
          this.sockets.delete(socket.id)
          logger.info(`Socket ${socket.id} disconnected`)
        })
      })
      io.of('/gui').use((_socket, next) => {
        // @todo: implement authentication for gui socket so we're not
        // exposing private information to unauthorized consumers
        return next()
      })
      io.of('/gui').on('connection', (socket) => {
        this.guiSockets.set(socket.id, socket)
        logger.info(`GUI Socket ${socket.id} connected`)
        socket.on('disconnect', () => {
          this.guiSockets.delete(socket.id)
          logger.info(`GUI Socket ${socket.id} disconnected`)
        })
      })
      io.of('/api').use((_socket, next) => {
        return next()
      })
      io.of('/api').on('connection', (socket) => {
        // @todo: implement authentication for api socket so we're not
        // exposing private information to unauthorized consumers
        this.apiSockets.set(socket.id, socket)
        logger.info(`API Socket ${socket.id} connected`)
        socket.on('disconnect', () => {
          this.apiSockets.delete(socket.id)
          logger.info(`API Socket ${socket.id} disconnected`)
        })
      })
    }
  }

  public async shutdown() {
    // Cleanup, since app is going down
  }
}
