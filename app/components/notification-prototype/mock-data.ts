export type NotificationType = "new_course" | "lesson_added" | "milestone_completed";

export interface StudentNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  timestamp: string; // e.g. "10m ago"
  read: boolean;
  actionUrl: string;
  actionLabel: string;
}

export const INITIAL_NOTIFICATIONS: StudentNotification[] = [
  {
    id: "notif-1",
    type: "new_course",
    title: "New Course: Production SQLite Architecture",
    body: "A brand new deep dive into embedded databases and WAL replication by Platform Team is now live.",
    timestamp: "12m ago",
    read: false,
    actionUrl: "/courses",
    actionLabel: "Explore Course",
  },
  {
    id: "notif-2",
    type: "lesson_added",
    title: "New Lesson Added in React Router",
    body: "Instructor added lesson 'Handling Optimistic Mutations & Pending UI' to your enrolled course.",
    timestamp: "2h ago",
    read: false,
    actionUrl: "/courses",
    actionLabel: "Watch Lesson",
  },
  {
    id: "notif-3",
    type: "milestone_completed",
    title: "Milestone Reached: Halfway There! 🎉",
    body: "You've completed 50% of Full Stack Web Development! Keep up the momentum.",
    timestamp: "1d ago",
    read: false,
    actionUrl: "/dashboard",
    actionLabel: "View Progress",
  },
  {
    id: "notif-4",
    type: "new_course",
    title: "New Course: Modern Tailwind & Radix UI",
    body: "Learn how to build accessible design systems from scratch in this new video course.",
    timestamp: "3d ago",
    read: true,
    actionUrl: "/courses",
    actionLabel: "View Course",
  },
  {
    id: "notif-5",
    type: "milestone_completed",
    title: "Course Completed: TypeScript Mastery 🏆",
    body: "Congratulations! You finished all modules in TypeScript Mastery.",
    timestamp: "5d ago",
    read: true,
    actionUrl: "/dashboard",
    actionLabel: "Review Course",
  },
];
