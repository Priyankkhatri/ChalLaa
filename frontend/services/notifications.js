import * as Notifications from 'expo-notifications';

// Configure foreground notification presentation handler per Unit 4 conventions
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

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
    console.warn('[Local Notification Error]', error);
  }
};
