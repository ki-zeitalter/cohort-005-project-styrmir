import { useState } from "react";
import { useFetcher } from "react-router";
import { Lock, NotebookPen } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import { Textarea } from "~/components/ui/textarea";
import { cn, formatRelativeTime } from "~/lib/utils";
import { describeNoteDraft, type NoteDraft } from "~/modules/lesson-notes";

type SavedNote = { body: string; updatedAt: string } | null;

/**
 * Laid out like Questions & Discussion further down the page, so the two
 * places a Student writes on a lesson look like one family.
 */
export function LessonNote({ note }: { note: SavedNote }) {
  const fetcher = useFetcher<{ ok: boolean; error?: string }>();
  const [body, setBody] = useState(note?.body ?? "");
  const isSaving = fetcher.state !== "idle";
  const error = isSaving ? undefined : fetcher.data?.error;
  const draft = describeNoteDraft(body, note?.body ?? "");

  return (
    <Card className="mb-8 py-0">
      <CardContent className="p-6">
        <NoteHeader />

        <fetcher.Form method="post" className="space-y-2">
          <input type="hidden" name="intent" value="save-note" />
          <Textarea
            name="body"
            value={body}
            onChange={(event) => setBody(event.target.value)}
            rows={4}
            placeholder="What do you want to remember from this lesson?"
            aria-label="Your notes"
            className="min-h-24 resize-y"
          />
          <div className="flex items-center gap-3">
            <Button
              type="submit"
              size="sm"
              disabled={isSaving || !draft.canSave}
            >
              {isSaving ? "Saving..." : "Save note"}
            </Button>
            <NoteStatus draft={draft} error={error} note={note} />
            <span
              className={cn(
                "ml-auto text-xs",
                draft.tooLong ? "text-destructive" : "text-muted-foreground"
              )}
            >
              {draft.length} / {draft.maxLength}
            </span>
          </div>
        </fetcher.Form>
      </CardContent>
    </Card>
  );
}

function NoteHeader() {
  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
      <div className="flex items-center gap-2">
        <NotebookPen className="size-5 text-primary" />
        <h2 className="text-xl font-semibold">Your notes</h2>
      </div>
      <span className="flex items-center gap-1 text-xs text-muted-foreground">
        <Lock className="size-3.5" />
        Only you can see these
      </span>
    </div>
  );
}

function NoteStatus({
  draft,
  error,
  note,
}: {
  draft: NoteDraft;
  error: string | undefined;
  note: SavedNote;
}) {
  if (error) return <span className="text-sm text-destructive">{error}</span>;

  const message = {
    empty: null,
    blank: "Write something before saving your note.",
    unsaved: "Unsaved changes",
    "too-long": `Your note is over ${draft.maxLength.toLocaleString("en")} characters.`,
    saved: note ? `Saved ${formatRelativeTime(note.updatedAt)}` : null,
  }[draft.status];
  if (!message) return null;

  return (
    <span
      suppressHydrationWarning
      className={cn(
        "text-xs",
        draft.status === "too-long"
          ? "text-destructive"
          : "text-muted-foreground"
      )}
    >
      {message}
    </span>
  );
}
