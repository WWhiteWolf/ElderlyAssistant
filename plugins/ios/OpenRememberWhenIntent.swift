import AppIntents
import Foundation

// STAGE 0 FEASIBILITY SPIKE — a trivial, no-op Siri App Intent.
// Its ONLY job is to prove the pipeline: a config plugin can inject Swift
// App Intent code into this CNG (gitignored ios/) app, the intent compiles,
// and it surfaces to Siri / the Shortcuts app and opens the app when run.
// It deliberately does NOT touch My Day, AsyncStorage, or any App Group note
// yet — that's a later stage, only if this proves out.
//
// App Intents are iOS 16+, so everything is gated behind @available.

@available(iOS 16.0, *)
struct OpenRememberWhenIntent: AppIntent {
    static var title: LocalizedStringResource = "Open Remember When"
    static var description = IntentDescription("Opens the Remember When app.")

    // Bring the app to the foreground when this intent runs. This is the
    // "wake the app" behaviour Stage 1 / Stage 2 will confirm.
    static var openAppWhenRun: Bool = true

    @MainActor
    func perform() async throws -> some IntentResult {
        return .result()
    }
}

// Makes the intents discoverable by Siri voice and the Shortcuts app with
// spoken phrases. \(.applicationName) expands to the app's display name, and
// \(\.$item) is the spoken item Siri matches against the live My Day list.
//
// An app may have only ONE AppShortcutsProvider, so every voice command is
// listed here. MarkItemDoneIntent and MyDayItemEntity are defined in
// MarkItemDoneIntent.swift — same build target, so they're visible here.
@available(iOS 16.0, *)
struct RememberWhenShortcuts: AppShortcutsProvider {
    static var appShortcuts: [AppShortcut] {
        AppShortcut(
            intent: OpenRememberWhenIntent(),
            phrases: [
                "Open \(.applicationName)",
                "Show \(.applicationName)"
            ],
            shortTitle: "Open Remember When",
            systemImageName: "app.badge"
        )
        AppShortcut(
            intent: MarkItemDoneIntent(),
            phrases: [
                "Mark \(\.$item) done in \(.applicationName)",
                "Mark \(\.$item) complete in \(.applicationName)",
                "Complete \(\.$item) in \(.applicationName)"
            ],
            shortTitle: "Mark item done",
            systemImageName: "checkmark.circle"
        )
    }
}
