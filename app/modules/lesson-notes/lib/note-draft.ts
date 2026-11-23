import { MAX_NOTE_LENGTH } from "~/lib/notes";

export type NoteDraftStatus =
  | "empty"
  | "saved"
  | "unsaved"
  | "blank"
  | "too-long";

export type NoteDraft = {
  /** Characters that will be saved: the server trims the note first. */
  length: number;
  maxLength: number;
  tooLong: boolean;
  canSave: boolean;
  status: NoteDraftStatus;
};

export function describeNoteDraft(draft: string, saved: string): NoteDraft {
  const body = draft.trim();
  const length = body.length;
  const tooLong = length > MAX_NOTE_LENGTH;
  const unsaved = body !== saved.trim();

  return {
    length,
    maxLength: MAX_NOTE_LENGTH,
    tooLong,
    canSave: unsaved && length > 0 && !tooLong,
    status: draftStatus({ tooLong, unsaved, length, saved: saved.trim() }),
  };
}

function draftStatus({
  tooLong,
  unsaved,
  length,
  saved,
}: {
  tooLong: boolean;
  unsaved: boolean;
  length: number;
  saved: string;
}): NoteDraftStatus {
  if (tooLong) return "too-long";
  // The server rejects an empty note, so clearing one cannot be saved.
  if (unsaved && length === 0) return "blank";
  if (unsaved) return "unsaved";
  return saved.length > 0 ? "saved" : "empty";
}
