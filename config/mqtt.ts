import type { IClientOptions } from 'mqtt'
import Env from '@ioc:Adonis/Core/Env'

const config: IClientOptions = {
  clientId: ['nestmtx', process.pid].join('_'),
  protocol: Env.get('MQTT_PROTOCOL', 'mqtt'),
  host: Env.get('MQTT_HOST', 'localhost'),
  port: Env.get('MQTT_PORT', 1883),
  username: Env.get('MQTT_USER'),
  password: Env.get('MQTT_PASS'),
  manualConnect: true,
}

export default config
