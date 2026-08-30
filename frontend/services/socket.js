import { io } from 'socket.io-client';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

export const getSocketUrl = () => {
  const hostUri =
    Constants.expoConfig?.hostUri ||
    Constants.manifest2?.extra?.expoGo?.debuggerHost ||
    Constants.manifest?.debuggerHost;

  if (hostUri) {
    const hostIp = hostUri.split(':')[0];
    if (hostIp && hostIp !== 'localhost' && hostIp !== '127.0.0.1') {
      return `http://${hostIp}:5000`;
    }
  }

  const extraSocketUrl = Constants.expoConfig?.extra?.socketUrl;
  if (extraSocketUrl) {
    return extraSocketUrl;
  }

  return Platform.OS === 'android' ? 'http://10.0.2.2:5000' : 'http://localhost:5000';
};

let socket = null;

export const getSocket = () => {
  if (!socket) {
    socket = io(getSocketUrl(), {
      transports: ['websocket'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    });

    socket.on('connect', () => {
      console.log('[Socket Connected]', socket.id);
    });

    socket.on('disconnect', (reason) => {
      console.log('[Socket Disconnected]', reason);
    });

    socket.on('connect_error', (err) => {
      console.warn('[Socket Connection Error]', err.message);
    });
  }

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
