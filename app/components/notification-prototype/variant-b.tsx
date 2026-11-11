import { useState } from "react";
import { Link } from "react-router";
import {
  Sparkles,
  BookOpen,
  Award,
  CheckCheck,
  Check,
  PlusCircle,
  RotateCcw,
  SlidersHorizontal,
  Flame,
  Search,
} from "lucide-react";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import {
  INITIAL_NOTIFICATIONS,
  type StudentNotification,
  type NotificationType,
} from "./mock-data";

interface VariantBProps {
  children: React.ReactNode;
}

export function VariantB({ children }: VariantBProps) {
  const [activeTab, setActiveTab] = useState<"courses" | "notifications">("notifications");
  const [notifications, setNotifications] = useState<StudentNotification[]>(INITIAL_NOTIFICATIONS);
  const [categoryFilter, setCategoryFilter] = useState<"all" | NotificationType>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const unreadCount = notifications.filter((n) => !n.read).length;

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
      type: "lesson_added",
      title: "New Lesson Added: Production Caching Patterns",
      body: "Module 4 has a new video and source code repository available.",
      timestamp: "Just now",
      read: false,
      actionUrl: "/courses",
      actionLabel: "Watch Lesson",
    };
    setNotifications((prev) => [newNotif, ...prev]);
  };

  const resetNotifications = () => {
    setNotifications(INITIAL_NOTIFICATIONS);
  };

  const filtered = notifications.filter((n) => {
    const matchesCategory = categoryFilter === "all" || n.type === categoryFilter;
    const matchesSearch =
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.body.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getBadge = (type: NotificationType) => {
    switch (type) {
      case "new_course":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[11px] font-medium text-amber-600 dark:text-amber-400">
            <Sparkles className="size-3" /> New Course
          </span>
        );
      case "lesson_added":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2 py-0.5 text-[11px] font-medium text-blue-600 dark:text-blue-400">
            <BookOpen className="size-3" /> Content Update
          </span>
        );
      case "milestone_completed":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
            <Award className="size-3" /> Milestone
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner indicating Variant B */}
      <div className="rounded-xl border border-border bg-card p-4 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center rounded-md bg-purple-50 dark:bg-purple-950/60 px-2 py-1 text-xs font-medium text-purple-700 dark:text-purple-300 ring-1 ring-inset ring-purple-600/20">
              Variant B: Dedicated Notification Feed & Tab
            </span>
            <span className="text-xs text-muted-foreground">
              (First-class page tab with search, categories, and summary metrics)
            </span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Notifications get equal billing with courses directly inside the dashboard view.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={simulateNewNotification}
            className="text-xs h-8 gap-1.5"
          >
            <PlusCircle className="size-3.5 text-purple-500" />
            Simulate Incoming Event
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

      {/* Segmented View Tab Switcher */}
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("courses")}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
              activeTab === "courses"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-muted"
            }`}
          >
            My Enrolled Courses
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("notifications")}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition ${
              activeTab === "notifications"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-muted"
            }`}
          >
            Activity & Notifications
            {unreadCount > 0 && (
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                  activeTab === "notifications"
                    ? "bg-white text-primary dark:bg-slate-900 dark:text-white"
                    : "bg-primary/10 text-primary"
                }`}
              >
                {unreadCount}
              </span>
            )}
          </button>
        </div>

        {activeTab === "notifications" && unreadCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={markAllAsRead}
            className="text-xs gap-1.5"
          >
            <CheckCheck className="size-4" /> Mark all read
          </Button>
        )}
      </div>

      {/* Body depending on active tab */}
      {activeTab === "courses" ? (
        children
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Feed Column */}
          <div className="lg:col-span-2 space-y-4">
            {/* Search and Category Filter Bar */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Filter notifications..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background pl-9 pr-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="flex items-center gap-1 overflow-x-auto">
                <Button
                  size="sm"
                  variant={categoryFilter === "all" ? "default" : "outline"}
                  onClick={() => setCategoryFilter("all")}
                  className="h-8 text-xs"
                >
                  All
                </Button>
                <Button
                  size="sm"
                  variant={categoryFilter === "new_course" ? "default" : "outline"}
                  onClick={() => setCategoryFilter("new_course")}
                  className="h-8 text-xs gap-1"
                >
                  <Sparkles className="size-3 text-amber-500" /> Releases
                </Button>
                <Button
                  size="sm"
                  variant={categoryFilter === "lesson_added" ? "default" : "outline"}
                  onClick={() => setCategoryFilter("lesson_added")}
                  className="h-8 text-xs gap-1"
                >
                  <BookOpen className="size-3 text-blue-500" /> Lessons
                </Button>
                <Button
                  size="sm"
                  variant={categoryFilter === "milestone_completed" ? "default" : "outline"}
                  onClick={() => setCategoryFilter("milestone_completed")}
                  className="h-8 text-xs gap-1"
                >
                  <Award className="size-3 text-emerald-500" /> Milestones
                </Button>
              </div>
            </div>

            {/* Notification Cards List */}
            {filtered.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border p-12 text-center text-muted-foreground">
                <SlidersHorizontal className="mx-auto mb-3 size-8 opacity-40" />
                <p className="text-sm font-medium">No notifications matching your filter.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filtered.map((notif) => (
                  <Card
                    key={notif.id}
                    className={`transition border ${
                      notif.read
                        ? "bg-card/70 border-border"
                        : "bg-primary/5 border-primary/30 shadow-xs"
                    }`}
                  >
                    <CardHeader className="pb-2 pt-4 px-5 flex flex-row items-start justify-between gap-3 space-y-0">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          {getBadge(notif.type)}
                          <span className="text-xs text-muted-foreground">
                            {notif.timestamp}
                          </span>
                        </div>
                        <h4
                          className={`text-base font-semibold ${
                            notif.read ? "text-foreground" : "text-primary font-bold"
                          }`}
                        >
                          {notif.title}
                        </h4>
                      </div>

                      {!notif.read && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => markAsRead(notif.id)}
                          className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground gap-1"
                        >
                          <Check className="size-3.5" /> Mark read
                        </Button>
                      )}
                    </CardHeader>
                    <CardContent className="px-5 pb-4 pt-0">
                      <p className="text-sm text-muted-foreground">{notif.body}</p>
                      <div className="mt-3 flex items-center justify-between">
                        <Link to={notif.actionUrl} onClick={() => markAsRead(notif.id)}>
                          <Button size="sm" variant={notif.read ? "outline" : "default"}>
                            {notif.actionLabel}
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Right Sidebar Summary */}
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">Learning Activity Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-center justify-between py-1 border-b border-border/60">
                  <span className="text-muted-foreground">Unread alerts</span>
                  <span className="font-semibold text-primary">{unreadCount}</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-border/60">
                  <span className="text-muted-foreground">Course updates this week</span>
                  <span className="font-semibold">2</span>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="text-muted-foreground">Milestones achieved</span>
                  <span className="font-semibold text-emerald-600 flex items-center gap-1">
                    <Flame className="size-4" /> 2 Completed
                  </span>
                </div>
              </CardContent>
            </Card>

            <div className="rounded-xl border border-border/60 bg-muted/40 p-4 text-xs text-muted-foreground space-y-1">
              <p className="font-medium text-foreground">Student Notification Tip</p>
              <p>
                In Variant B, the student can browse announcements and updates without missing critical course curriculum additions.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
