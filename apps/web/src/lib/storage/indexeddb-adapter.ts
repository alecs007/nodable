import { type StorageAdapter } from '@nodable/sdk'
import { type IDBPDatabase, openDB } from 'idb'

const DATABASE_NAME = 'nodable'
const DATABASE_VERSION = 1
const STORE_NAME = 'workspace'
const RECORD_KEY = 'current'

let connection: Promise<IDBPDatabase> | undefined

function connect(): Promise<IDBPDatabase> {
  connection ??= openDB(DATABASE_NAME, DATABASE_VERSION, {
    upgrade(database) {
      database.createObjectStore(STORE_NAME)
    },
  })

  return connection
}

export const indexedDbAdapter: StorageAdapter = {
  async read() {
    const database = await connect()
    const stored: unknown = await database.get(STORE_NAME, RECORD_KEY)

    return typeof stored === 'string' ? stored : undefined
  },
  async write(data) {
    const database = await connect()
    await database.put(STORE_NAME, data, RECORD_KEY)
  },
  async clear() {
    const database = await connect()
    await database.delete(STORE_NAME, RECORD_KEY)
  },
}
