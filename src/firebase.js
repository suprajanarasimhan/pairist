import firebase from 'firebase'

const config = {
  projectId: process.env.VUE_APP_FIREBASE_PROJECT_ID,
  apiKey: process.env.VUE_APP_FIREBASE_API_KEY,
  authDomain: process.env.VUE_APP_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.VUE_APP_FIREBASE_URL,
}

export const firebaseApp = firebase.initializeApp(config)
export const db = firebaseApp.firestore()
