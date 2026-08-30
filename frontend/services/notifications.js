import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Safe foreground presentation handler registration with try/catch guard for Expo Go SDK 54
try {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
} catch (e) {
  // Graceful fallback in environments with restricted push listener bindings
}

export const sendLocalNotification = async (title, body, data = {}) => {
  try {
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
        trigger: null, // Deliver immediately
      });
    }
  } catch (error) {
    // Non-blocking fallback in Expo Go
    console.log(`[Notification Fallback] ${title}: ${body}`);
  }
};
