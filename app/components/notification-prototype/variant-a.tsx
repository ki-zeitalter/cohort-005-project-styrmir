import { useState, useRef, useEffect } from "react";
import { Link } from "react-router";
import {
  Bell,
  Sparkles,
  BookOpen,
  Award,
  Check,
  CheckCheck,
  ExternalLink,
  PlusCircle,
  RotateCcw,
} from "lucide-react";
import { Button } from "~/components/ui/button";
import {
  INITIAL_NOTIFICATIONS,
  type StudentNotification,
  type NotificationType,
} from "./mock-data";

export function VariantA() {
  const [notifications, setNotifications] = useState<StudentNotification[]>(INITIAL_NOTIFICATIONS);
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const popoverRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const simulateNewNotification = () => {
    const newNotif: StudentNotification = {
      id: `sim-${Date.now()}`,
      type: "new_course",
      title: "New Course Alert: Real-time WebSockets & SSE",
      body: "Just published: architecting event-driven frontends in full-stack apps.",
      timestamp: "Just now",
      read: false,
      actionUrl: "/courses",
      actionLabel: "View Course",
    };
    setNotifications((prev) => [newNotif, ...prev]);
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

  const filteredNotifications = notifications.filter((n) =>
    filter === "all" ? true : !n.read
  );

  return (
    <div className="mb-6 rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center rounded-md bg-indigo-50 dark:bg-indigo-950/60 px-2 py-1 text-xs font-medium text-indigo-700 dark:text-indigo-300 ring-1 ring-inset ring-indigo-600/20">
              Variant A: Bell Popover Drawer
            </span>
            <span className="text-xs text-muted-foreground">
              (Header-integrated popover with unread counter)
            </span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Standard unobtrusive bell in the header bar. Click the bell to open the drawer.
          </p>
        </div>

        {/* Prototype interactive test controls */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={simulateNewNotification}
            className="text-xs h-8 gap-1.5"
          >
            <PlusCircle className="size-3.5 text-indigo-500" />
            Simulate Push Notification
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

          {/* Persistent Header Bell Affordance */}
          <div className="relative" ref={popoverRef}>
            <button
              type="button"
              onClick={() => setIsOpen((prev) => !prev)}
              aria-label={`Notifications (${unreadCount} unread)`}
              className="relative flex h-10 w-10 items-center justify-center rounded-full border border-border bg-background hover:bg-accent transition text-foreground"
            >
              <Bell className="size-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[11px] font-bold text-white shadow-sm ring-2 ring-background">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>

            {/* Dropdown Popover */}
            {isOpen && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl border border-border bg-popover text-popover-foreground shadow-xl z-40 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                <div className="flex items-center justify-between border-b border-border px-4 py-3 bg-muted/40">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold">Notifications</h3>
                    {unreadCount > 0 && (
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={markAllAsRead}
                      className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition"
                    >
                      <CheckCheck className="size-3.5" />
                      Mark all read
                    </button>
                  )}
                </div>

                {/* Filter pills */}
                <div className="flex border-b border-border px-4 py-2 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setFilter("all")}
                    className={`rounded-md px-2.5 py-1 font-medium transition ${
                      filter === "all"
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    All ({notifications.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilter("unread")}
                    className={`rounded-md px-2.5 py-1 font-medium transition ${
                      filter === "unread"
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    Unread ({unreadCount})
                  </button>
                </div>

                {/* Notification List */}
                <div className="max-h-96 divide-y divide-border overflow-y-auto">
                  {filteredNotifications.length === 0 ? (
                    <div className="p-8 text-center text-sm text-muted-foreground">
                      No {filter === "unread" ? "unread " : ""}notifications.
                    </div>
                  ) : (
                    filteredNotifications.map((notif) => (
                      <div
                        key={notif.id}
                        className={`group relative flex items-start gap-3 p-4 transition ${
                          notif.read ? "bg-background hover:bg-muted/40" : "bg-primary/5 hover:bg-primary/10"
                        }`}
                      >
                        <div className="mt-0.5 rounded-lg bg-background p-2 border border-border/80 shadow-xs">
                          {getIcon(notif.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline justify-between gap-2">
                            <h4
                              className={`text-xs font-semibold leading-tight ${
                                notif.read ? "text-foreground" : "text-primary font-bold"
                              }`}
                            >
                              {notif.title}
                            </h4>
                            <span className="text-[10px] text-muted-foreground shrink-0">
                              {notif.timestamp}
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                            {notif.body}
                          </p>
                          <div className="mt-2 flex items-center justify-between">
                            <Link
                              to={notif.actionUrl}
                              onClick={() => {
                                markAsRead(notif.id);
                                setIsOpen(false);
                              }}
                              className="text-xs font-medium text-primary hover:underline flex items-center gap-1"
                            >
                              {notif.actionLabel}
                              <ExternalLink className="size-3" />
                            </Link>
                            {!notif.read && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  markAsRead(notif.id);
                                }}
                                className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1"
                              >
                                <Check className="size-3" />
                                Mark read
                              </button>
                            )}
                          </div>
                        </div>
                        {!notif.read && (
                          <span className="size-2 shrink-0 rounded-full bg-primary mt-1" />
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
