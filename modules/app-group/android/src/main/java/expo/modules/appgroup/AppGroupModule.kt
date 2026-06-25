package expo.modules.appgroup

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

// Android no-op. This feature is iOS-only (Siri App Intents + App Group), but
// the JS imports the module unconditionally, so Android needs matching
// functions that simply do nothing / return null to avoid a crash on load.
class AppGroupModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("AppGroup")

    Function("setMyDayItems") { _: String -> }

    Function("getPendingNote") { -> null as String? }

    Function("clearPendingNote") { }
  }
}
