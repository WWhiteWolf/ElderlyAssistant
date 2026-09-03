import ExpoModulesCore

// Shared-box bridge (Step 1 of the Siri "mark item done" feature).
//
// This module is the ONLY way the React Native side and the Siri App Intent
// (Swift, injected by plugins/withSiriIntent.js) can talk to each other. They
// run in separate contexts and can't share memory, so they pass data through
// an App Group's UserDefaults — a small key/value box both sides can see.
//
// The App Group id must match the entitlement added by withSiriIntent.js.
// On the Simulator entitlements aren't enforced, so this still works there for
// smoke testing; on device the App Group capability must be enabled for the
// App ID in Apple's developer portal (noted in withSiriIntent.js).
//
// Two keys live in the box:
//   "dailyItems"  — written by RN: a JSON string of the current Daily items
//                   ([{ "id": ..., "label": ... }]). The Siri intent reads it
//                   so it can offer your real, live items by voice.
//   "pendingNote" — written by the Siri intent: a JSON string describing one
//                   action ({ action, itemId, label, firedAt }). RN reads it on
//                   app-active, applies it, then clears it.

private let APP_GROUP = "group.com.molliedog.ElderlyAssistant"

public class AppGroupModule: Module {
  public func definition() -> ModuleDefinition {
    Name("AppGroup")

    // RN -> box: store the current Daily items (already JSON-stringified in JS).
    Function("setDailyItems") { (json: String) in
      UserDefaults(suiteName: APP_GROUP)?.set(json, forKey: "dailyItems")
    }

    // box -> RN: read the note the Siri intent dropped, or nil if none.
    Function("getPendingNote") { () -> String? in
      return UserDefaults(suiteName: APP_GROUP)?.string(forKey: "pendingNote")
    }

    // Clear the note once RN has applied it.
    Function("clearPendingNote") {
      UserDefaults(suiteName: APP_GROUP)?.removeObject(forKey: "pendingNote")
    }
  }
}
