import AppIntents
import Foundation

// Siri "mark item done".
//
// How it fits the Approach-B design:
//   • The RN app publishes its current Daily items into the App Group box
//     (key "dailyItems") via the AppGroup native module.
//   • DailyItemQuery reads that box so Siri can offer your real, live items by
//     voice — say "Mark medication done in Remember" and Siri matches
//     "medication" against the published item labels.
//   • When the intent runs it does NOT touch the app's data directly. It only
//     drops a tiny note (key "pendingNote") describing the action, and opens
//     the app. The existing React Native code reads that note on app-active and
//     runs Daily's already-tested done-logic. All real logic stays in JS.
//
// App Intents are iOS 16+, so everything is gated behind @available.

private let APP_GROUP = "group.com.molliedog.ElderlyAssistant"

// A single Daily item, mirrored from what the RN side published. This is the
// type the spoken parameter resolves to, so its display title is the label
// Siri matches the spoken word against.
@available(iOS 16.0, *)
struct DailyItemEntity: AppEntity, Identifiable {
    let id: String
    let label: String

    static var typeDisplayRepresentation: TypeDisplayRepresentation = "Daily Item"
    var displayRepresentation: DisplayRepresentation { DisplayRepresentation(title: LocalizedStringResource(stringLiteral: label)) }

    static var defaultQuery = DailyItemQuery()
}

// Reads the live item list out of the App Group box the RN side writes.
// Conforms to EntityStringQuery (not just EntityQuery): a parameterized App
// Shortcut phrase ("Mark <item> done in …") only registers if the entity's
// query can resolve a spoken/typed string to an entity. Without
// entities(matching:) iOS silently drops the whole "Mark item done" shortcut.
@available(iOS 16.0, *)
struct DailyItemQuery: EntityStringQuery {
    private struct RawItem: Decodable {
        let id: String
        let label: String
    }

    private func loadItems() -> [DailyItemEntity] {
        guard
            let defaults = UserDefaults(suiteName: APP_GROUP),
            let json = defaults.string(forKey: "dailyItems"),
            let data = json.data(using: .utf8),
            let raws = try? JSONDecoder().decode([RawItem].self, from: data)
        else {
            return []
        }
        return raws.map { DailyItemEntity(id: $0.id, label: $0.label) }
    }

    // Resolve specific ids back to entities (Siri uses this once an item is
    // chosen / when re-running a saved shortcut).
    func entities(for identifiers: [String]) async throws -> [DailyItemEntity] {
        let all = loadItems()
        return all.filter { identifiers.contains($0.id) }
    }

    // Match a spoken/typed word against the live item labels so Siri can resolve
    // e.g. "Mark medication done" to the medication entity. Required by
    // EntityStringQuery; without it the parameterized phrase won't register.
    func entities(matching string: String) async throws -> [DailyItemEntity] {
        let needle = string.lowercased()
        return loadItems().filter { $0.label.lowercased().contains(needle) }
    }

    // The list Siri offers by voice and in the Shortcuts app.
    func suggestedEntities() async throws -> [DailyItemEntity] {
        return loadItems()
    }
}

@available(iOS 16.0, *)
struct MarkItemDoneIntent: AppIntent {
    static var title: LocalizedStringResource = "Mark Item Done"
    static var description = IntentDescription("Marks one of your Daily items done in Remember.")

    // Bring the app forward so the React Native side wakes and applies the note.
    static var openAppWhenRun: Bool = true

    @Parameter(title: "Item")
    var item: DailyItemEntity

    @MainActor
    func perform() async throws -> some IntentResult {
        guard let defaults = UserDefaults(suiteName: APP_GROUP) else {
            return .result()
        }
        // Drop the Approach-B note. firedAt is epoch MILLISECONDS so the JS side
        // can build a Date directly (matches how the app stamps history).
        let note: [String: Any] = [
            "action": "markDone",
            "itemId": item.id,
            "label": item.label,
            "firedAt": Int(Date().timeIntervalSince1970 * 1000),
        ]
        if let data = try? JSONSerialization.data(withJSONObject: note),
           let json = String(data: data, encoding: .utf8) {
            defaults.set(json, forKey: "pendingNote")
        }
        return .result()
    }
}

// Makes the intents discoverable by Siri voice and the Shortcuts app with
// spoken phrases. \(.applicationName) expands to the app's display name, and
// \(\.$item) is the spoken item Siri matches against the live Daily list.
//
// An app may have only ONE AppShortcutsProvider, so every voice command is
// listed here.
@available(iOS 16.0, *)
struct RememberShortcuts: AppShortcutsProvider {
    static var appShortcuts: [AppShortcut] {
        AppShortcut(
            intent: MarkItemDoneIntent(),
            phrases: [
                "Mark \(\.$item) done with \(.applicationName)",
                "Mark \(\.$item) complete with \(.applicationName)",
                "Mark \(\.$item) done in \(.applicationName)",
                "Mark \(\.$item) done in the \(.applicationName) app",
                "Complete \(\.$item) with \(.applicationName)"
            ],
            shortTitle: "Mark item done",
            systemImageName: "checkmark.circle"
        )
    }
}
