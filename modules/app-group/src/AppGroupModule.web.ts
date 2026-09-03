import { registerWebModule, NativeModule } from 'expo';

// Web no-op (the app's web target never runs Siri). Functions match the native
// surface so index.ts type-checks and any accidental web call is harmless.
class AppGroupModule extends NativeModule<{}> {
  setDailyItems(_json: string): void {}
  getPendingNote(): string | null {
    return null;
  }
  clearPendingNote(): void {}
}

export default registerWebModule(AppGroupModule, 'AppGroupModule');
