const { sendPush } = require('../services/fcmService');

if (user.fcmToken) {
  await sendPush(
    user.fcmToken,
    `Time for ${med.name}`,
    `Take ${med.dosage} now at ${time}`,
    { medicationId: med._id.toString(), time }
  );
}
