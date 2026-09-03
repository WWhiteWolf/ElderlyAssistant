import { NativeModule, requireNativeModule } from 'expo';

// Native (iOS) surface. The three functions are synchronous UserDefaults
// reads/writes — fast and tiny, so no need for async. Values are passed as
// JSON strings to keep the native marshalling trivial; index.ts wraps them in
// a typed API.
declare class AppGroupModule extends NativeModule<{}> {
  setDailyItems(json: string): void;
  getPendingNote(): string | null;
  clearPendingNote(): void;
}

export default requireNativeModule<AppGroupModule>('AppGroup');
