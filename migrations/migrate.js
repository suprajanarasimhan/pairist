#!/usr/bin/env node

require('colors')
const fs = require('fs')
const path = require('path')
const mkdirp = require('mkdirp')

const envs = JSON.parse(fs.readFileSync(path.join(path.basename(__dirname), '..', '.firebaserc'))).projects

const env = envs[process.argv[process.argv.length - 1]]

if (!env) {
  console.error('No environment configured. '.red)
  console.error('Pass in valid environment name as argument to migration runner.'.red)
  let errorString = 'Value given ('.red
  errorString += process.argv[process.argv.length - 1].bold.yellow
  errorString += ') not found in '.red
  errorString += Object.keys(envs).map(e => e.bold.yellow).join(', '.red)
  errorString += '. Aborting...'.red
  console.error(errorString)
  process.exit(1)
}

console.log(`Running migrations for ${env.bold}...`.green)
mkdirp.sync(`backups/${env}`)

const admin = require('firebase-admin')
var serviceAccount = require(`${process.env.HOME}/.secrets/${env}-service-account.json`)
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: `https://${env}.firebaseio.com`,
})

const db = admin.firestore()

const migrationsDir = path.basename(__dirname)
const migrations = []

fs.readdirSync(migrationsDir).forEach(file => {
  if (file.match(/^\d{4}_.*\.migration\.js$/)) {
    const name = file.replace('.js', '')
    const Migration = require('./' + name)
    const migration = new Migration({ db, env })
    const version = parseInt(name.split('_')[0])
    migrations.push({ name, migration, version })
  }
})

const up = async () => {
  let currentSchema = (await db.doc('/global/schema').get())
  const targetVersion = migrations[migrations.length - 1].version
  if (currentSchema) {
    const message = 'Current schema version: '.blue +
    currentSchema.toString().yellow.bold +
    ', targetVersion: '.blue +
    targetVersion.toString().green.bold +
    '.'.blue
    console.log(message)

    if (targetVersion === currentSchema) {
      console.log('Versions match, schema up to date :)'.green)
      process.exit()
    }
  } else {
    console.log('No schema version found, starting from scratch (no data will be lost)...'.yellow)
    currentSchema = 0
  }

  try {
    try {
      await db.doc('/global/schema').update({ migrating: true })
    } catch (error) {
      await db.doc('/global/schema').set({ migrating: true })
    }

    for (let i = 0; i < migrations.length; i++) {
      const { name, migration, version } = migrations[i]
      if (version <= currentSchema) { continue }

      // TODO: export backup
      // const all = (await db.ref().once('value')).val()
      // fs.writeFileSync(`backups/${env}/before-${name}.json`, JSON.stringify(all), 'utf-8')

      process.stdout.write(`Running ${name.blue}...`)

      await migration.up()
      await db.doc('/global/schema').update({ version })
      process.stdout.write(' Done!\n'.green)
    }

    await db.doc('/global/schema').update({ migrating: false })
  } catch (error) {
    process.stdout.write('\n'.green)
    console.error('Failed migrating:'.red, error)
    console.error(`Consider restoring from backup in backups/${env}.`.yellow)
    console.log(' FAIL '.red.bold.italic)
    process.exit(1)
  }
  console.log(' SUCCESS '.green.bold.italic)

  process.exit()
}

up()
