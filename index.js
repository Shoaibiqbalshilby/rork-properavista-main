// This file exists so that the React Native bundler has a valid entry point
// when the native projects (Xcode, Gradle) invoke `react-native bundle`.
//
// Expo Router projects normally use a virtual entry under
// ".expo/.virtual-metro-entry", but the default scripts look for
// `index.js`/`index.ios.js`/`index.android.js`. By exporting the router
// entry here we keep both worlds working: the bundler can find a file and the
// dev server still sets up the router.

import 'expo-router/entry';
