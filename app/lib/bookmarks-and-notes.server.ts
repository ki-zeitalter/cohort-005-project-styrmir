import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import { and, desc, eq } from "drizzle-orm";
import * as schema from "~/db/schema";
import { bookmarks, courses, lessons, modules, notes } from "~/db/schema";

export type Db = BetterSQLite3Database<typeof schema>;

export const MAX_NOTE_LENGTH = 2000;

export type Bookmark = typeof bookmarks.$inferSelect;
export type Note = typeof notes.$inferSelect;

export interface SavedBookmarkRow {
  id: number;
  lessonId: number;
  lessonTitle: string;
  moduleId: number;
  moduleTitle: string;
  courseTitle: string;
  courseSlug: string;
  createdAt: string;
}

export interface SavedNoteRow {
  id: number;
  lessonId: number;
  lessonTitle: string;
  moduleId: number;
  moduleTitle: string;
  courseTitle: string;
  courseSlug: string;
  body: string;
  createdAt: string;
  updatedAt: string;
}

export function getBookmark(db: Db, userId: number, lessonId: number): Bookmark | undefined {
  return db
    .select()
    .from(bookmarks)
    .where(and(eq(bookmarks.userId, userId), eq(bookmarks.lessonId, lessonId)))
    .get();
}

/**
 * Toggles a bookmark on a lesson for a student.
 * Returns true if the lesson is now bookmarked, false if the bookmark was removed.
 */
export function toggleBookmark(db: Db, userId: number, lessonId: number): boolean {
  const existing = getBookmark(db, userId, lessonId);

  if (existing) {
    db.delete(bookmarks).where(eq(bookmarks.id, existing.id)).run();
    return false;
  }

  db.insert(bookmarks).values({ userId, lessonId }).run();
  return true;
}

export function getNote(db: Db, userId: number, lessonId: number): Note | undefined {
  return db
    .select()
    .from(notes)
    .where(and(eq(notes.userId, userId), eq(notes.lessonId, lessonId)))
    .get();
}

export type SaveNoteResult =
  | { ok: true; note: Note | null }
  | { ok: false; error: string };

/**
 * Saves a student's note on a lesson.
 * Trims whitespace. Caps at MAX_NOTE_LENGTH (2,000 chars).
 * An empty string deletes the note.
 */
export function saveNote(
  db: Db,
  userId: number,
  lessonId: number,
  body: string,
  now: Date = new Date()
): SaveNoteResult {
  const trimmed = body.trim();

  if (trimmed.length > MAX_NOTE_LENGTH) {
    return { ok: false, error: "That note is too long to save." };
  }

  const existing = getNote(db, userId, lessonId);
  const nowIso = now.toISOString();

  if (trimmed.length === 0) {
    if (existing) {
      deleteNote(db, userId, lessonId);
    }
    return { ok: true, note: null };
  }

  if (existing) {
    const updated = db
      .update(notes)
      .set({ body: trimmed, updatedAt: nowIso })
      .where(eq(notes.id, existing.id))
      .returning()
      .get();
    return { ok: true, note: updated };
  }

  const created = db
    .insert(notes)
    .values({
      userId,
      lessonId,
      body: trimmed,
      createdAt: nowIso,
      updatedAt: nowIso,
    })
    .returning()
    .get();

  return { ok: true, note: created };
}

export function deleteNote(db: Db, userId: number, lessonId: number): void {
  db.delete(notes)
    .where(and(eq(notes.userId, userId), eq(notes.lessonId, lessonId)))
    .run();
}

/**
 * Lists all bookmarks for a student, newest first,
 * with joined course, module, and lesson information.
 */
export function listSavedBookmarks(db: Db, userId: number): SavedBookmarkRow[] {
  return db
    .select({
      id: bookmarks.id,
      lessonId: lessons.id,
      lessonTitle: lessons.title,
      moduleId: modules.id,
      moduleTitle: modules.title,
      courseTitle: courses.title,
      courseSlug: courses.slug,
      createdAt: bookmarks.createdAt,
    })
    .from(bookmarks)
    .innerJoin(lessons, eq(bookmarks.lessonId, lessons.id))
    .innerJoin(modules, eq(lessons.moduleId, modules.id))
    .innerJoin(courses, eq(modules.courseId, courses.id))
    .where(eq(bookmarks.userId, userId))
    .orderBy(desc(bookmarks.createdAt))
    .all();
}

/**
 * Lists all notes for a student, newest first (by updatedAt),
 * with joined course, module, and lesson information.
 */
export function listSavedNotes(db: Db, userId: number): SavedNoteRow[] {
  return db
    .select({
      id: notes.id,
      lessonId: lessons.id,
      lessonTitle: lessons.title,
      moduleId: modules.id,
      moduleTitle: modules.title,
      courseTitle: courses.title,
      courseSlug: courses.slug,
      body: notes.body,
      createdAt: notes.createdAt,
      updatedAt: notes.updatedAt,
    })
    .from(notes)
    .innerJoin(lessons, eq(notes.lessonId, lessons.id))
    .innerJoin(modules, eq(lessons.moduleId, modules.id))
    .innerJoin(courses, eq(modules.courseId, courses.id))
    .where(eq(notes.userId, userId))
    .orderBy(desc(notes.updatedAt))
    .all();
}
