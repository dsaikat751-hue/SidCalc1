import { Alert, Platform, ToastAndroid } from 'react-native';

/** Show a short message: a native toast on Android, an alert elsewhere. */
export function notify(message: string): void {
  if (Platform.OS === 'android') {
    ToastAndroid.show(message, ToastAndroid.SHORT);
  } else {
    Alert.alert(message);
  }
}
