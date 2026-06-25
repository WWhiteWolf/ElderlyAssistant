// A single My Day item as shared with the Siri side (just what Siri needs to
// offer it by voice and tell us which one was picked).
export type MyDayItem = {
  id: string;
  label: string;
};

// The instruction the Siri intent drops into the shared box for the app to
// apply on next launch. Kept deliberately tiny — all real logic stays in JS.
export type PendingNote = {
  action: 'markDone';
  itemId?: string;
  label?: string;
  firedAt?: number; // epoch ms, when the intent ran
};
