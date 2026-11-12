import { describe, it, expect, beforeEach } from "vitest";
import { eq } from "drizzle-orm";
import { createTestDb, seedBaseData } from "~/test/setup";
import * as schema from "~/db/schema";
import { UserRole } from "~/db/schema";
import {
  toggleBookmark,
  getBookmark,
  saveNote,
  getNote,
  listSavedBookmarks,
  listSavedNotes,
  MAX_NOTE_LENGTH,
} from "./bookmarks-and-notes.server";
import {
  approveRefundRequest,
  raiseRefundRequest,
} from "./refunds.server";
import { fakeNotifications } from "./notifications.fake.server";

type TestDb = ReturnType<typeof createTestDb>;

const T1 = new Date(2026, 9, 6, 12, 0, 0);
const T2 = new Date(2026, 9, 6, 12, 30, 0);
const T3 = new Date(2026, 9, 6, 13, 0, 0);

let db: TestDb;
let base: ReturnType<typeof seedBaseData>;
let moduleId: number;
let lesson1Id: number;
let lesson2Id: number;
let otherUserId: number;

beforeEach(() => {
  db = createTestDb();
  base = seedBaseData(db);

  const module = db
    .insert(schema.modules)
    .values({ courseId: base.course.id, title: "Module 1", position: 1 })
    .returning()
    .get();
  moduleId = module.id;

  lesson1Id = db
    .insert(schema.lessons)
    .values({ moduleId: module.id, title: "Lesson 1", position: 1 })
    .returning()
    .get().id;

  lesson2Id = db
    .insert(schema.lessons)
    .values({ moduleId: module.id, title: "Lesson 2", position: 2 })
    .returning()
    .get().id;

  const otherUser = db
    .insert(schema.users)
    .values({
      name: "Other Student",
      email: "other@example.com",
      role: UserRole.Student,
    })
    .returning()
    .get();
  otherUserId = otherUser.id;
});

describe("toggleBookmark", () => {
  it("toggling a lesson with no bookmark creates one; toggling again removes it", () => {
    expect(getBookmark(db, base.user.id, lesson1Id)).toBeUndefined();

    // First toggle creates it
    const firstToggle = toggleBookmark(db, base.user.id, lesson1Id);
    expect(firstToggle).toBe(true);

    const bookmark = getBookmark(db, base.user.id, lesson1Id);
    expect(bookmark).toBeDefined();
    expect(bookmark?.userId).toBe(base.user.id);
    expect(bookmark?.lessonId).toBe(lesson1Id);

    // Second toggle removes it
    const secondToggle = toggleBookmark(db, base.user.id, lesson1Id);
    expect(secondToggle).toBe(false);
    expect(getBookmark(db, base.user.id, lesson1Id)).toBeUndefined();
  });

  it("enforces unique constraint: a student never ends up with two bookmarks on the same lesson", () => {
    toggleBookmark(db, base.user.id, lesson1Id);

    // Attempting direct duplicate insertion fails at the database level
    expect(() => {
      db.insert(schema.bookmarks)
        .values({ userId: base.user.id, lessonId: lesson1Id })
        .run();
    }).toThrow();
  });
});

describe("saveNote", () => {
  it("saving a note on a lesson with none creates it", () => {
    const result = saveNote(db, base.user.id, lesson1Id, "First thoughts", T1);

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.note).toMatchObject({
      userId: base.user.id,
      lessonId: lesson1Id,
      body: "First thoughts",
      createdAt: T1.toISOString(),
      updatedAt: T1.toISOString(),
    });

    const stored = getNote(db, base.user.id, lesson1Id);
    expect(stored?.body).toBe("First thoughts");
  });

  it("saving again replaces the body and moves updatedAt on, without changing createdAt", () => {
    saveNote(db, base.user.id, lesson1Id, "Initial note", T1);

    const secondResult = saveNote(
      db,
      base.user.id,
      lesson1Id,
      "Updated note",
      T2
    );

    expect(secondResult.ok).toBe(true);
    if (!secondResult.ok) return;

    expect(secondResult.note).toMatchObject({
      userId: base.user.id,
      lessonId: lesson1Id,
      body: "Updated note",
      createdAt: T1.toISOString(),
      updatedAt: T2.toISOString(),
    });

    const stored = getNote(db, base.user.id, lesson1Id);
    expect(stored?.body).toBe("Updated note");
    expect(stored?.createdAt).toBe(T1.toISOString());
    expect(stored?.updatedAt).toBe(T2.toISOString());
  });

  it("enforces unique constraint: a student never ends up with two notes on the same lesson", () => {
    saveNote(db, base.user.id, lesson1Id, "Initial note", T1);

    // Direct insertion violating unique constraint must throw
    expect(() => {
      db.insert(schema.notes)
        .values({
          userId: base.user.id,
          lessonId: lesson1Id,
          body: "Another note",
        })
        .run();
    }).toThrow();
  });

  it("accepts a note of exactly 2,000 characters and refuses a note over 2,000 characters", () => {
    const exactNote = "x".repeat(MAX_NOTE_LENGTH);
    const accepted = saveNote(db, base.user.id, lesson1Id, exactNote, T1);
    expect(accepted.ok).toBe(true);

    const tooLongNote = "x".repeat(MAX_NOTE_LENGTH + 1);
    const refused = saveNote(db, base.user.id, lesson1Id, tooLongNote, T2);
    expect(refused).toEqual({
      ok: false,
      error: "That note is too long to save.",
    });

    // Stored note remains the previous valid one
    const stored = getNote(db, base.user.id, lesson1Id);
    expect(stored?.body).toBe(exactNote);
  });

  it("saving an empty body clears/deletes the note", () => {
    saveNote(db, base.user.id, lesson1Id, "Some notes", T1);
    expect(getNote(db, base.user.id, lesson1Id)).toBeDefined();

    const cleared = saveNote(db, base.user.id, lesson1Id, "   ", T2);
    expect(cleared).toEqual({ ok: true, note: null });
    expect(getNote(db, base.user.id, lesson1Id)).toBeUndefined();
  });
});

describe("listSavedBookmarks and listSavedNotes", () => {
  it("returns only that student's rows, newest first, carrying lesson and course info", () => {
    // Student 1 bookmarks lesson 1 then lesson 2
    db.insert(schema.bookmarks)
      .values({
        userId: base.user.id,
        lessonId: lesson1Id,
        createdAt: T1.toISOString(),
      })
      .run();

    db.insert(schema.bookmarks)
      .values({
        userId: base.user.id,
        lessonId: lesson2Id,
        createdAt: T2.toISOString(),
      })
      .run();

    // Student 2 bookmarks lesson 1
    db.insert(schema.bookmarks)
      .values({
        userId: otherUserId,
        lessonId: lesson1Id,
        createdAt: T3.toISOString(),
      })
      .run();

    // Student 1 notes
    saveNote(db, base.user.id, lesson1Id, "Note on Lesson 1", T1);
    saveNote(db, base.user.id, lesson2Id, "Note on Lesson 2", T2);
    // Student 1 updates note on Lesson 1 so its updatedAt moves forward
    saveNote(db, base.user.id, lesson1Id, "Updated Note on Lesson 1", T3);

    // Student 2 notes
    saveNote(db, otherUserId, lesson1Id, "Other student note", T2);

    const userBookmarks = listSavedBookmarks(db, base.user.id);
    expect(userBookmarks).toHaveLength(2);
    // Newest first by createdAt: Lesson 2 (T2) before Lesson 1 (T1)
    expect(userBookmarks[0].lessonId).toBe(lesson2Id);
    expect(userBookmarks[0].lessonTitle).toBe("Lesson 2");
    expect(userBookmarks[0].courseTitle).toBe(base.course.title);
    expect(userBookmarks[0].courseSlug).toBe(base.course.slug);
    expect(userBookmarks[0].moduleTitle).toBe("Module 1");

    expect(userBookmarks[1].lessonId).toBe(lesson1Id);

    const userNotes = listSavedNotes(db, base.user.id);
    expect(userNotes).toHaveLength(2);
    // Newest first by updatedAt: Lesson 1 (updated at T3) before Lesson 2 (updated at T2)
    expect(userNotes[0].lessonId).toBe(lesson1Id);
    expect(userNotes[0].body).toBe("Updated Note on Lesson 1");
    expect(userNotes[0].courseTitle).toBe(base.course.title);
    expect(userNotes[0].courseSlug).toBe(base.course.slug);
    expect(userNotes[0].moduleTitle).toBe("Module 1");

    expect(userNotes[1].lessonId).toBe(lesson2Id);
    expect(userNotes[1].body).toBe("Note on Lesson 2");
  });
});

describe("refund preserves bookmarks and notes", () => {
  it("approving a Refund leaves the student's Bookmarks and Notes in place", async () => {
    // Setup purchase and enrollment
    const purchase = db
      .insert(schema.purchases)
      .values({
        userId: base.user.id,
        courseId: base.course.id,
        amountPaid: 7900,
        createdAt: T1.toISOString(),
      })
      .returning()
      .get();

    db.insert(schema.enrollments)
      .values({ userId: base.user.id, courseId: base.course.id })
      .run();

    const admin = db
      .insert(schema.users)
      .values({
        name: "Admin User",
        email: "admin@example.com",
        role: UserRole.Admin,
      })
      .returning()
      .get();

    toggleBookmark(db, base.user.id, lesson1Id);
    saveNote(db, base.user.id, lesson1Id, "Notes before refund", T1);

    const notifications = fakeNotifications();
    const raiseRes = await raiseRefundRequest(
      db,
      purchase.id,
      base.user.id,
      "I want a refund",
      T2,
      notifications
    );
    expect(raiseRes.ok).toBe(true);
    if (!raiseRes.ok) return;

    const approveRes = await approveRefundRequest(
      db,
      raiseRes.refundRequestId,
      admin.id,
      null,
      T3,
      notifications
    );
    expect(approveRes.ok).toBe(true);

    // Verify enrollment is removed
    const enrollment = db
      .select()
      .from(schema.enrollments)
      .where(
        eq(schema.enrollments.userId, base.user.id)
      )
      .get();
    expect(enrollment).toBeUndefined();

    // Verify bookmark and note remain
    const bookmark = getBookmark(db, base.user.id, lesson1Id);
    expect(bookmark).toBeDefined();

    const note = getNote(db, base.user.id, lesson1Id);
    expect(note).toBeDefined();
    expect(note?.body).toBe("Notes before refund");
  });
});
