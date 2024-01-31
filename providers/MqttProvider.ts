import type { ApplicationContract } from '@ioc:Adonis/Core/Application'
import { connect as MqttConnect } from 'mqtt'
import type { IClientOptions } from 'mqtt'
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
export default class MqttProvider {
  constructor(protected app: ApplicationContract) {}

  public register() {
    this.app.container.singleton('MQTT/Client', () => {
      return MqttConnect(this.app.config.get('mqtt') as IClientOptions)
    })
  }

  public async boot() {
    // All bindings are ready, feel free to use them
  }

  public async ready() {
    if ('web' === this.app.environment) {
      const { makeLogger } = await import('App/Clients/Logger')
      const logger = makeLogger('api:mqtt')
      const client = this.app.container.use('MQTT/Client')
      client.on('connect', () => {
        logger.info('Connected to broker')
      })
      client.on('reconnect', () => {
        logger.info('Reconnecting to broker')
      })
      client.on('close', () => {
        logger.info('Disconnected from broker')
      })
      client.on('disconnect', () => {
        logger.info('Broker requested disconnection')
      })
      client.on('offline', () => {
        logger.info('Client offline')
      })
      client.on('error', (error) => {
        logger.error(error.message, error)
      })
      client.on('message', (topic, message, packet) => {
        // @todo: implement this as how we are going to handle requests
      })
      client.connect()
    }
  }

  public async shutdown() {
    // Cleanup, since app is going down
  }
}
