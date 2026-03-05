# rork-properavista-main

> **Troubleshooting**
>
> If you see an error like:
> 
> ```text
> No script URL provided. Make sure the packager is running or you have embedded a JS bundle in your application bundle.
> unsanitizedScriptURLString = (null)
> ```
>
> it means the native binary couldn't find a JavaScript bundle. On a
> physical device this happens when Metro isn't reachable (debug build
> defaults to loading from `localhost`) or when the bundle wasn't generated
> at build time.
>
> Two ways to resolve:
>
> 1. **Run the packager**: start Metro with `npm start` / `expo start` and
>    launch the app while the server is running.
> 2. **Embed a bundle in the APK/IPA** – this repository configures the
>    Gradle/Xcode projects to produce a static bundle for *all* variants so
>    you can install the app on a device without Metro.  Use
>    `npm run bundle-android` or `npm run bundle-ios` manually, or simply
>    build with `npm run android` / `npm run ios` (the bundling step runs
>    automatically thanks to `bundleInDebug = true` / the Xcode run script).
>
> When building release variants (`--variant=release` or `expo run:android
> --no-dev`), the JS is always pre‑bundled.
>
> **Important for iOS device builds**
>
> The default Xcode bundle script looks for `index.js` or `index.ios.js` as the
> entry file.  Expo Router projects use a virtual entry at
> `.expo/.virtual-metro-entry`, so builds launched from Xcode would previously
> produce an empty bundle and the application crashed with the “No script URL”
> error.  This repository now includes a tiny `index.js` shim that imports the
> router entry and the Podfile explicitly sets `ENTRY_FILE` so the bundle is
> always correct.
>
> > If you’re adding new native targets or copying the project you must run
> > `pod install` again to pick up the updated build phase.
>
> When you run `expo run:ios` the same script runs automatically and you don’t
> need to think about any of this.
>
> This information is also surfaced during the initial build so you shouldn't
> need to come back here again.

