import { useState } from "react";
import { Link } from "react-router";
import {
  Sparkles,
  BookOpen,
  Award,
  Bell,
  X,
  ExternalLink,
  PlusCircle,
  RotateCcw,
  CheckCheck,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { Button } from "~/components/ui/button";
import { toast } from "sonner";
import {
  INITIAL_NOTIFICATIONS,
  type StudentNotification,
  type NotificationType,
} from "./mock-data";

export function VariantC() {
  const [notifications, setNotifications] = useState<StudentNotification[]>(INITIAL_NOTIFICATIONS);
  const [isDockOpen, setIsDockOpen] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const simulateIncomingToast = () => {
    const id = `toast-${Date.now()}`;
    const newNotif: StudentNotification = {
      id,
      type: "milestone_completed",
      title: "Quiz Passed: Advanced React Patterns",
      body: "Great job! You scored 100% on the Section 2 assessment.",
      timestamp: "Just now",
      read: false,
      actionUrl: "/dashboard",
      actionLabel: "View Results",
    };

    setNotifications((prev) => [newNotif, ...prev]);

    // Fire real floating toast alert via Sonner
    toast.custom((t) => (
      <div className="flex w-full items-start gap-3 rounded-xl border border-emerald-500/30 bg-card p-4 text-card-foreground shadow-2xl ring-1 ring-black/5">
        <div className="mt-0.5 rounded-lg bg-emerald-500/10 p-2 text-emerald-600 dark:text-emerald-400">
          <Award className="size-5" />
        </div>
        <div className="flex-1 space-y-1">
          <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
            Real-time Milestone Push
          </p>
          <h4 className="text-sm font-bold text-foreground leading-tight">
            {newNotif.title}
          </h4>
          <p className="text-xs text-muted-foreground">{newNotif.body}</p>
          <div className="mt-2 flex items-center gap-3">
            <Link
              to={newNotif.actionUrl}
              onClick={() => {
                markAsRead(id);
                toast.dismiss(t);
              }}
              className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
            >
              {newNotif.actionLabel}
              <ExternalLink className="size-3" />
            </Link>
            <button
              type="button"
              onClick={() => {
                markAsRead(id);
                toast.dismiss(t);
              }}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Dismiss
            </button>
          </div>
        </div>
        <button
          type="button"
          onClick={() => toast.dismiss(t)}
          className="rounded p-1 text-muted-foreground hover:text-foreground"
        >
          <X className="size-4" />
        </button>
      </div>
    ));
  };

  const resetNotifications = () => {
    setNotifications(INITIAL_NOTIFICATIONS);
  };

  const getIcon = (type: NotificationType) => {
    switch (type) {
      case "new_course":
        return <Sparkles className="size-4 text-amber-500" />;
      case "lesson_added":
        return <BookOpen className="size-4 text-blue-500" />;
      case "milestone_completed":
        return <Award className="size-4 text-emerald-500" />;
    }
  };

  return (
    <>
      {/* Top Banner explaining Variant C */}
      <div className="mb-6 rounded-xl border border-border bg-card p-4 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center rounded-md bg-emerald-50 dark:bg-emerald-950/60 px-2 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-300 ring-1 ring-inset ring-emerald-600/20">
              Variant C: Floating Toast Banners & Activity Dock
            </span>
            <span className="text-xs text-muted-foreground">
              (Non-disruptive floating toasts + collapsible bottom dock)
            </span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Zero header or dashboard layout alteration. Notifications arrive as animated action toasts, accessible via a floating dock.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="default"
            size="sm"
            onClick={simulateIncomingToast}
            className="text-xs h-8 gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <PlusCircle className="size-3.5" />
            Fire Simulated Live Toast
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={resetNotifications}
            className="text-xs h-8 text-muted-foreground"
            title="Reset to default mock state"
          >
            <RotateCcw className="size-3.5" />
          </Button>
        </div>
      </div>

      {/* Floating Bottom-Right Activity Dock */}
      <div className="fixed bottom-20 right-6 z-40 flex flex-col items-end">
        {isDockOpen && (
          <div className="mb-3 w-80 sm:w-96 rounded-2xl border border-border bg-popover text-popover-foreground shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-150">
            <div className="flex items-center justify-between border-b border-border bg-muted/40 px-4 py-3">
              <div className="flex items-center gap-2">
                <Bell className="size-4 text-emerald-600" />
                <h3 className="text-sm font-semibold">Live Activity Dock</h3>
                {unreadCount > 0 && (
                  <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold text-emerald-600">
                    {unreadCount} unread
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={markAllAsRead}
                    className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                  >
                    <CheckCheck className="size-3.5" /> Mark read
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsDockOpen(false)}
                  className="rounded p-1 hover:bg-muted text-muted-foreground hover:text-foreground"
                >
                  <X className="size-4" />
                </button>
              </div>
            </div>

            <div className="max-h-80 divide-y divide-border overflow-y-auto">
              {notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`p-3 text-xs transition flex items-start gap-3 ${
                    notif.read ? "bg-background opacity-80" : "bg-emerald-500/5 font-medium"
                  }`}
                >
                  <div className="mt-0.5 rounded-md bg-background p-1.5 border border-border">
                    {getIcon(notif.type)}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-baseline justify-between gap-1">
                      <span className="font-semibold text-foreground">{notif.title}</span>
                      <span className="text-[10px] text-muted-foreground shrink-0">{notif.timestamp}</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground line-clamp-2">{notif.body}</p>
                    <div className="flex items-center justify-between pt-1">
                      <Link
                        to={notif.actionUrl}
                        onClick={() => {
                          markAsRead(notif.id);
                          setIsDockOpen(false);
                        }}
                        className="text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 font-semibold"
                      >
                        {notif.actionLabel}
                        <ExternalLink className="size-3" />
                      </Link>
                      {!notif.read && (
                        <button
                          type="button"
                          onClick={() => markAsRead(notif.id)}
                          className="text-[10px] text-muted-foreground hover:text-foreground"
                        >
                          Mark read
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Collapsible Dock Toggle Button */}
        <button
          type="button"
          onClick={() => setIsDockOpen((prev) => !prev)}
          className="flex items-center gap-2.5 rounded-full border border-border bg-card px-4 py-2.5 text-card-foreground shadow-xl hover:shadow-2xl hover:bg-accent transition ring-1 ring-black/5"
        >
          <div className="relative">
            <Bell className="size-4 text-emerald-600" />
            {unreadCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 size-2 rounded-full bg-emerald-500 animate-pulse" />
            )}
          </div>
          <span className="text-xs font-semibold">Activity</span>
          {unreadCount > 0 && (
            <span className="rounded-full bg-emerald-500 px-1.5 py-0.2 text-[10px] font-bold text-white">
              {unreadCount}
            </span>
          )}
          {isDockOpen ? (
            <ChevronDown className="size-3.5 text-muted-foreground" />
          ) : (
            <ChevronUp className="size-3.5 text-muted-foreground" />
          )}
        </button>
      </div>
    </>
  );
}
