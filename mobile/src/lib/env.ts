/**
 * Whether to show the screens meant for building the app rather than using
 * it. Always on in development; a release build can opt in so the design
 * system can be reviewed and screenshotted on a real device.
 */
export const showDeveloperTools = __DEV__ || process.env.EXPO_PUBLIC_DEVELOPER_TOOLS === '1';
