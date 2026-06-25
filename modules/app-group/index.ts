// Shared-box bridge — public API.
//
// This is what the app imports (`import * as AppGroup from '../modules/app-group'`).
// It wraps the raw native module (which speaks JSON strings) in a small typed
// API so callers work with plain objects.

import AppGroupModule from './src/AppGroupModule';
import { MyDayItem, PendingNote } from './src/AppGroup.types';

export { MyDayItem, PendingNote };

// RN -> shared box: publish the current My Day items so the Siri intent can
// offer them by voice. Call this whenever the My Day list changes.
export function setMyDayItems(items: MyDayItem[]): void {
  AppGroupModule.setMyDayItems(JSON.stringify(items));
}

// Shared box -> RN: read the note the Siri intent dropped (or null if none).
export function getPendingNote(): PendingNote | null {
  const raw = AppGroupModule.getPendingNote();
  if (!raw) return null;
  try {
    return JSON.parse(raw) as PendingNote;
  } catch {
    return null;
  }
}

// Clear the note once it's been applied.
export function clearPendingNote(): void {
  AppGroupModule.clearPendingNote();
}
