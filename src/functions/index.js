import 'babel-polyfill'

import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'

import History from './lib/history'
const historyChunkDuration = parseInt(functions.config().pairist.history_chunk_duration)
const history = new History(historyChunkDuration)

admin.initializeApp(functions.config().firebase)

export const recordHistory = functions.firestore.document('/teams/{teamName}/history/current').onWrite(async (change, context) => {
  if (functions.config().config.skipRecording) {
    console.log('Not recording history because config.skipRecording was set')
  }

  console.log(`| _START: Recording history for team ${context.params.teamName} (chunk duration: ${historyChunkDuration})`)
  const current = change.after.data()
  const historyKey = history.scaleDate(Date.now())

  try {
    await change.after.parent.doc(historyKey).set(current)
    console.log(`| ___SET: /teams/${context.params.teamName}/history/${historyKey}`)
  } catch (error) {
    console.error(`| ___SET: /teams/${context.params.teamName}/history/${historyKey}`, error)
  }

  try {
    await change.after.parent.collection('history').doc(historyKey - 2).delete()
    console.log(`| DELETE: /teams/${context.params.teamName}/history/${historyKey - 2}`)
  } catch (_) { /* don't care if can't delete matching history */ }
  try {
    await change.after.parent.collection('history').doc(historyKey - 1).delete()
    console.log(`| DELETE: /teams/${context.params.teamName}/history/${historyKey - 1}`)
  } catch (_) { /* don't care if can't delete matching history */ }

  console.log(`| FINISH: Recording history for team ${context.params.teamName}`)
})
