import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';

/** Opens a link in an in-app browser tab, the one way reading leaves the app. */
export function openExternal(href: string): void {
  if (Platform.OS === 'web') {
    window.open(href, '_blank', 'noopener');
    return;
  }
  void WebBrowser.openBrowserAsync(href).catch(() => {});
}

/** A link on one of the university's own sites, which may be another post. */
export function isUowmLink(href: string): boolean {
  try {
    return new URL(href).hostname.endsWith('uowm.gr');
  } catch {
    return false;
  }
}
