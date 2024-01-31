/*
|--------------------------------------------------------------------------
| Validating Environment Variables
|--------------------------------------------------------------------------
|
| In this file we define the rules for validating environment variables.
| By performing validation we ensure that your application is running in
| a stable environment with correct configuration values.
|
| This file is read automatically by the framework during the boot lifecycle
| and hence do not rename or move this file to a different location.
|
*/

import Env from '@ioc:Adonis/Core/Env'

export default Env.rules({
  /** Framework Requirements */
  HOST: Env.schema.string({ format: 'host' }),
  PORT: Env.schema.number(),
  APP_KEY: Env.schema.string(),
  APP_NAME: Env.schema.string(),
  DRIVE_DISK: Env.schema.enum.optional(['local'] as const),
  NODE_ENV: Env.schema.enum(['development', 'production', 'test'] as const),
  /** Database */
  DB_CONNECTION: Env.schema.enum.optional(['sqlite', 'mysql', 'pg', 'mssql'] as const),
  DB_HOST: Env.schema.string.optional({ format: 'host' }),
  DB_PORT: Env.schema.number.optional(),
  DB_USER: Env.schema.string.optional(),
  DB_PASSWORD: Env.schema.string.optional(),
  DB_NAME: Env.schema.string.optional(),
  DB_SECURE: Env.schema.boolean.optional(),
  /** MQTT */
  MQTT_PROTOCOL: Env.schema.enum([
    'wss',
    'ws',
    'mqtt',
    'mqtts',
    'tcp',
    'ssl',
    'wx',
    'wxs',
    'ali',
    'alis',
  ] as const),
  MQTT_HOST: Env.schema.string({ format: 'host' }),
  MQTT_PORT: Env.schema.number(),
  MQTT_USER: Env.schema.string.optional(),
  MQTT_PASS: Env.schema.string.optional(),
})
