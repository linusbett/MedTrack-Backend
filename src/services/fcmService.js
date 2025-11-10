const path = require('path');
const admin = require('firebase-admin');

const serviceAccountPath = path.resolve(
    process.env.FIREBASE_SERVICE_ACCOUNT || path.join(__dirname, 'medtrack-firebase-adminsdk.json')
);

let serviceAccount;
try {
    serviceAccount = require(serviceAccountPath);
} catch (err) {
    console.error('⚠️ Could not load Firebase service account JSON file.');
    console.error('Path tried:', serviceAccountPath);
    throw err;
}

// Initialize Firebase Admin only once
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
    });
    console.log('✅ Firebase Admin initialized successfully');
}

// Send Push Notification
exports.sendPush = async(token, title, body, data = {}) => {
    const message = { token, notification: { title, body }, data };
    try {
        const response = await admin.messaging().send(message);
        console.log('✅ Push sent successfully:', response);
        return response;
    } catch (error) {
        console.error('❌ Push failed:', error.message);
        throw error;
    }
};