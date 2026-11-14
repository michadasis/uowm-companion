import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

function run(feedback: () => Promise<void>) {
  // Browsers have no haptics, and a phone with vibration turned off rejects.
  // Feedback is never worth an error.
  if (Platform.OS === 'web') return;
  feedback().catch(() => {});
}

/**
 * Haptics are kept for moments that change something: a selection that
 * moves and a choice that is confirmed. Plain navigation stays silent.
 */
export const haptics = {
  selection: () => run(() => Haptics.selectionAsync()),
  success: () => run(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)),
};
