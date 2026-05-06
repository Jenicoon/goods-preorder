const admin = require("firebase-admin");
const { required } = require("./config");

let appInstance = null;

function getPrivateKey() {
  return required("FIREBASE_PRIVATE_KEY").replace(/\\n/g, "\n");
}

function getFirebaseAdminApp() {
  if (appInstance) {
    return appInstance;
  }

  if (!admin.apps.length) {
    appInstance = admin.initializeApp({
      credential: admin.credential.cert({
        projectId: required("FIREBASE_PROJECT_ID"),
        clientEmail: required("FIREBASE_CLIENT_EMAIL"),
        privateKey: getPrivateKey()
      })
    });
  } else {
    appInstance = admin.app();
  }

  return appInstance;
}

function getFirestore() {
  return getFirebaseAdminApp().firestore();
}

module.exports = {
  getFirebaseAdminApp,
  getFirestore
};
