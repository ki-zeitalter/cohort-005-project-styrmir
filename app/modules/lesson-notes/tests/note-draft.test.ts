import { describe, expect, it } from "vitest";
import { describeNoteDraft } from "~/modules/lesson-notes";
import { MAX_NOTE_LENGTH } from "~/lib/notes";

describe("describeNoteDraft", () => {
  it("is empty when there is no note and nothing typed", () => {
    expect(describeNoteDraft("", "")).toEqual({
      length: 0,
      maxLength: MAX_NOTE_LENGTH,
      tooLong: false,
      canSave: false,
      status: "empty",
    });
  });

  it("can save a new note", () => {
    const draft = describeNoteDraft("Narrow with a type guard", "");
    expect(draft.status).toBe("unsaved");
    expect(draft.canSave).toBe(true);
    expect(draft.length).toBe(24);
  });

  it("is saved when the draft matches the saved note", () => {
    const draft = describeNoteDraft("Use Result types", "Use Result types");
    expect(draft.status).toBe("saved");
    expect(draft.canSave).toBe(false);
  });

  it("ignores surrounding whitespace, as the server trims it", () => {
    const draft = describeNoteDraft(
      "  Use Result types \n",
      "Use Result types"
    );
    expect(draft.status).toBe("saved");
    expect(draft.length).toBe(16);
  });

  it("has unsaved changes when the draft differs from the saved note", () => {
    const draft = describeNoteDraft("Use Result types!", "Use Result types");
    expect(draft.status).toBe("unsaved");
    expect(draft.canSave).toBe(true);
  });

  it("cannot save a cleared note", () => {
    const draft = describeNoteDraft("   ", "Use Result types");
    expect(draft.status).toBe("blank");
    expect(draft.canSave).toBe(false);
  });

  it("allows a note of exactly the maximum length", () => {
    const draft = describeNoteDraft("a".repeat(MAX_NOTE_LENGTH), "");
    expect(draft.tooLong).toBe(false);
    expect(draft.canSave).toBe(true);
  });

  it("cannot save a note over the maximum length", () => {
    const draft = describeNoteDraft("a".repeat(MAX_NOTE_LENGTH + 1), "");
    expect(draft.tooLong).toBe(true);
    expect(draft.status).toBe("too-long");
    expect(draft.canSave).toBe(false);
  });

  it("reports too long before unsaved changes", () => {
    const saved = "a".repeat(10);
    const draft = describeNoteDraft("a".repeat(MAX_NOTE_LENGTH + 1), saved);
    expect(draft.status).toBe("too-long");
  });

  it("ignores whitespace around the saved note too", () => {
    const draft = describeNoteDraft("Use Result types", "Use Result types\n");
    expect(draft.status).toBe("saved");
    expect(draft.canSave).toBe(false);
  });

  it("treats a whitespace-only saved note as empty", () => {
    expect(describeNoteDraft("", "  ").status).toBe("empty");
  });
});
