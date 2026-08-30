import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform } from 'react-native';

const isExpoGo =
  Constants.appOwnership === 'expo' ||
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient ||
  Constants.executionEnvironment === 'storeClient';

let Notifications = null;

// Only execute expo-notifications in standalone/dev builds to avoid Expo Go SDK 54 Android push token removal error
if (!isExpoGo) {
  try {
    Notifications = require('expo-notifications');
    if (Notifications && Notifications.setNotificationHandler) {
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: false,
        }),
      });
    }
  } catch (err) {
    // Graceful fallback
  }
}

export const sendLocalNotification = async (title, body, data = {}) => {
  try {
    if (Notifications && !isExpoGo) {
      const { status } = await Notifications.getPermissionsAsync();
      let finalStatus = status;

      if (status !== 'granted') {
        const { status: reqStatus } = await Notifications.requestPermissionsAsync();
        finalStatus = reqStatus;
      }

      if (finalStatus === 'granted') {
        await Notifications.scheduleNotificationAsync({
          content: {
            title,
            body,
            data,
            sound: 'default',
          },
          trigger: null,
        });
        return;
      }
    }
  } catch (error) {
    // Non-blocking in Expo Go
  }

  // Graceful local feedback for Expo Go environment
  console.log(`[ChalLaa Notification] ${title} - ${body}`);
};
