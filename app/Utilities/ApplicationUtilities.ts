import type {
  execa as ExecaFn,
  execaSync as ExecSyncFn,
  execaCommand as ExecaCommandFn,
  execaCommandSync as ExecaCommandSyncFn,
  $ as $Fn,
  execaNode as ExecaNodeFn,
} from 'execa'
import type StripAnsiFn from 'strip-ansi'
import crypto from 'crypto'
import fs from 'fs'
import { Readable } from 'stream'

export async function getExecaModule() {
  const execa = (await new Promise((_resolve) => {
    // eslint-disable-next-line no-eval -- this is needed to ensure that execa is imported dynamically fulfilling the esm requirements
    eval("import('execa').then(_resolve)")
  })) as {
    execa: typeof ExecaFn
    execaSync: typeof ExecSyncFn
    execaCommand: typeof ExecaCommandFn
    execaCommandSync: typeof ExecaCommandSyncFn
    $: typeof $Fn
    execaNode: typeof ExecaNodeFn
  }
  return execa
}

export async function getExeca() {
  const { execa } = (await getExecaModule()) as { execa: typeof ExecaFn }
  return execa
}

export async function getExecaSync() {
  const { execaSync } = (await getExecaModule()) as { execaSync: typeof ExecSyncFn }
  return execaSync
}

export async function getStripAnsi() {
  const { default: stripAnsi } = (await new Promise((_resolve) => {
    // eslint-disable-next-line no-eval -- this is needed to ensure that execa is imported dynamically fulfilling the esm requirements
    eval("import('strip-ansi').then(_resolve)")
  })) as { default: typeof StripAnsiFn }
  return stripAnsi
}

export async function getSetupStatus() {
  const stages = {
    migrated: false as boolean | null, // false = must migrate, null = should migrate, true = migrated
    hasUser: false, // simple boolean
    hasInitialConfig: false, // simple boolean
  }
  const [{ default: Database }, { default: User }, { default: Credential }] = await Promise.all([
    import('@ioc:Adonis/Lucid/Database'),
    import('App/Models/User'),
    import('App/Models/Credential'),
  ])
  stages.migrated = await getDatabaseMigrationSetupStatus()
  if (false === stages.migrated) {
    // if there are no migrations, there's no user or initial config
    return stages
  }
  const userCount = await Database.query().from(User.table).count('* as count').first()
  stages.hasUser =
    userCount && 'undefined' !== typeof userCount.count && parseInt(userCount.count.toString()) > 0
  const initialConfigCredential = await Credential.query().first()
  stages.hasInitialConfig = !!initialConfigCredential
  return stages
}

export async function getDatabaseMigrationSetupStatus() {
  const [{ default: Database }, { default: Application }, { default: Migrator }] =
    await Promise.all([
      import('@ioc:Adonis/Lucid/Database'),
      import('@ioc:Adonis/Core/Application'),
      import('@ioc:Adonis/Lucid/Migrator'),
    ])
  const migrator = new Migrator(Database, Application, {
    direction: 'up',
    dryRun: true,
  })
  const migrations = await migrator.getList()
  const totalCount = migrations.length
  const completedCount = migrations.filter((l) => 'migrated' === l.status).length
  if (totalCount === completedCount) {
    return true
  } else if (completedCount > 0) {
    return null
  }
  return false
}

export const makeChecksum = (data: string) => {
  const hash = crypto.createHash('sha256')
  hash.update(data)
  return hash.digest('hex')
}

export const dockerized = () => {
  return fs.existsSync('/etc/container.env')
}

export const inDocker = async () => {
  return dockerized()
}

export const convertStringToStream = (stringToConvert: string) => {
  const stream = new Readable({
    read() {},
  })
  stream.push(stringToConvert)
  stream.push(null)
  return stream
}

const host = process.env.HOSTNAME_OVERRIDE || process.env.HOST || '127.0.0.1'
const port = process.env.PORT || 3333
const generated = `http://${host}:${port}/`
export const baseServerUrl = new URL(generated)
if (baseServerUrl.hostname === '0.0.0.0') {
  baseServerUrl.hostname = '127.0.0.1'
}

const normalizeArgs = (file, args = []) => {
  if (!Array.isArray(args)) {
    return [file]
  }

  return [file, ...args]
}

const NO_ESCAPE_REGEXP = /^[\w.-]+$/

const escapeArg = (arg) => {
  if (typeof arg !== 'string' || NO_ESCAPE_REGEXP.test(arg)) {
    return arg
  }

  return `"${arg.replace(/"/gm, '\\"')}"`
}

export const getEscapedCommand = (file, args) =>
  normalizeArgs(file, args)
    .map((arg) => escapeArg(arg))
    .join(' ')

export const getRandomInt = (min: number, max: number): number => {
  min = Math.ceil(min)
  max = Math.floor(max)
  return Math.floor(Math.random() * (max - min + 1)) + min
}
