/**
 * Config source: https://git.io/JesV9
 *
 * Feel free to let us know via PR, if you find something broken in this config
 * file.
 */

import Env from '@ioc:Adonis/Core/Env'
import Application from '@ioc:Adonis/Core/Application'
import type { DatabaseConfig } from '@ioc:Adonis/Lucid/Database'

const databaseConfig: DatabaseConfig = {
  /*
  |--------------------------------------------------------------------------
  | Connection
  |--------------------------------------------------------------------------
  |
  | The primary connection for making database queries across the application
  | You can use any key from the `connections` object defined in this same
  | file.
  |
  */
  connection: Env.get('DB_CONNECTION', 'sqlite'),

  connections: {
    /*
    |--------------------------------------------------------------------------
    | SQLite
    |--------------------------------------------------------------------------
    |
    | Configuration for the SQLite database.  Make sure to install the driver
    | from npm when using this connection
    |
    | npm i sqlite3
    |
    */
    sqlite: {
      client: 'sqlite',
      connection: {
        filename: Application.tmpPath('db.sqlite3'),
      },
      pool: {
        afterCreate: (conn, cb) => {
          conn.run('PRAGMA foreign_keys=true', cb)
        },
      },
      migrations: {
        naturalSort: true,
      },
      useNullAsDefault: true,
      healthCheck: Env.get('DB_CONNECTION', 'sqlite') === 'sqlite',
      debug: false,
    },

    /*
    |--------------------------------------------------------------------------
    | MySQL config
    |--------------------------------------------------------------------------
    |
    | Configuration for MySQL database. Make sure to install the driver
    | from npm when using this connection
    |
    | npm i mysql2
    |
    */
    mysql: {
      client: 'mysql2',
      connection: {
        host: Env.get('DB_HOST', 'localhost'),
        port: Env.get('DB_PORT', 3306),
        user: Env.get('DB_USER', 'lucid'),
        password: Env.get('DB_PASSWORD', ''),
        database: Env.get('DB_NAME', 'lucid'),
        ssl: {
          rejectUnauthorized: !Env.get('DB_SECURE', false),
        },
      },
      migrations: {
        naturalSort: true,
      },
      healthCheck: Env.get('DB_CONNECTION', 'sqlite') === 'mysql',
      debug: false,
    },

    /*
    |--------------------------------------------------------------------------
    | PostgreSQL config
    |--------------------------------------------------------------------------
    |
    | Configuration for PostgreSQL database. Make sure to install the driver
    | from npm when using this connection
    |
    | npm i pg
    |
    */
    pg: {
      client: 'pg',
      connection: {
        host: Env.get('DB_HOST', 'localhost'),
        port: Env.get('DB_PORT', 5432),
        user: Env.get('DB_USER', 'lucid'),
        password: Env.get('DB_PASSWORD', ''),
        database: Env.get('DB_NAME', 'lucid'),
        ssl: Env.get('DB_SECURE', false),
      },
      migrations: {
        naturalSort: true,
      },
      healthCheck: Env.get('DB_CONNECTION', 'sqlite') === 'pg',
      debug: false,
    },

    /*
    |--------------------------------------------------------------------------
    | MSSQL config
    |--------------------------------------------------------------------------
    |
    | Configuration for MSSQL database. Make sure to install the driver
    | from npm when using this connection
    |
    | npm i tedious
    |
    */
    mssql: {
      client: 'mssql',
      connection: {
        user: Env.get('DB_USER', 'lucid'),
        port: Env.get('DB_PORT', 1443),
        server: Env.get('DB_HOST', 'localhost'),
        password: Env.get('DB_PASSWORD', ''),
        database: Env.get('DB_NAME', 'lucid'),
      },
      migrations: {
        naturalSort: true,
      },
      healthCheck: Env.get('DB_CONNECTION', 'sqlite') === 'mssql',
      debug: false,
    },
  },
}

export default databaseConfig
