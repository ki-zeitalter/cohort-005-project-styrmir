# Research: Evaluating Notification Services vs. Native SQLite for Real-Time In-App Student Notifications

## Executive Summary

This evaluation investigates whether Cadence should adopt a third-party notification platform (**Knock**, **Novu**, **Courier**) or implement a **native SQLite + Drizzle + Server-Sent Events (SSE)** architecture for student real-time in-app notifications.

### Recommendation
**Adopt Native SQLite + Drizzle with Server-Sent Events (SSE).**

Native SQLite + SSE is the superior architectural fit for Cadence:
1. **Strict Architectural Alignment with [ADR 0006](file:///docs/adr/0006-one-sqlite-file-through-drizzle.md)**: Cadence operates as a single server process with a local SQLite database (`data.db`). A native implementation keeps all student data, course progress, and notification state consolidated in one database without introducing external network roundtrips, foreign state silos, or distributed consistency hazards.
2. **Transactional Integrity (ACID)**: Emitting a notification (e.g., student completes a lesson, receives course certificate, or claims a seat) executes inside the exact same database transaction as the domain event. Third-party notification SaaS requires dual-writes across network boundaries, introducing edge cases where notifications fail or desync from application state.
3. **Flawless Local Development DX**: Cadence relies heavily on an in-browser DevUI switcher ([`app/components/dev-ui.tsx`](file:///app/components/dev-ui.tsx)) to switch between Students, Instructors, and Admins instantaneously. A native SQLite store responds instantly to local seed data and user switching without requiring internet connectivity, cloud API credentials, or third-party subscriber synchronization.
4. **Scope Fit**: The project scope explicitly places external channels (Email digests, SMS, Mobile Push) out of scope (see [Issue #1](https://github.com/ki-zeitalter/cohort-005-project-styrmir/issues/1)). The primary value proposition of third-party platforms (cross-channel fan-out, email template authoring, SMS routing) is unused in Cadence, leaving only their operational overhead and latency.
5. **Zero Cost and Infinite Scalability for Target Volume**: Native SSE over standard HTTP avoids monthly subscription costs, per-notification fees, and third-party rate limits.

---

## Evaluation Criteria

Each candidate was evaluated against the following criteria:
1. **Developer Experience & React SDK**: Availability of drop-in UI components (notification bell, unread badge, popover feed) and headless hooks, compatible with React 19 and Tailwind CSS.
2. **Real-Time Push Delivery Mechanism**: Transport protocol (WebSockets vs. SSE), reconnection resilience, connection state management, and efficiency.
3. **Local Development DX & Offline/Mock Support**: Ability to develop, test, and seed offline without internet access or complex external services; seamless integration with Cadence's DevUI switcher and Vitest test suite.
4. **Pricing & Free-Tier Limits**: Monthly quotas, scaling costs, overage pricing, and maintenance overhead.
5. **Architectural Fit with Cadence / SQLite**: Alignment with ADR 0006 (single SQLite database via Drizzle ORM, single Node process), transaction safety, and data sovereignty.

---

## Comparison Matrix

| Evaluation Dimension | Knock | Novu | Courier | Native SQLite + Drizzle (SSE) |
| :--- | :--- | :--- | :--- | :--- |
| **Primary Real-Time Transport** | WebSockets (`wss://api.knock.app`) | WebSockets (`wss://ws.novu.co` or self-hosted) | WebSockets (`wss://realtime.courier.com`) | Server-Sent Events (SSE, `text/event-stream`) |
| **React 19 SDK Support** | Full (`@knocklabs/react` v0.x supporting React 16-19) | Full (`@novu/react` v3.x supporting React 18-19) | Full (`@trycourier/courier-react` v9.x) | Native React component tree (Tailwind + Radix UI + `sonner`) |
| **Prebuilt UI Components** | `<NotificationIconButton>`, `<NotificationFeedPopover>`, `<NotificationFeed>` | `<Inbox />` (composed of `<Bell />`, `<Notifications />`, `<Preferences />`) | `<CourierInbox />`, `<CourierInboxPopupMenu />`, `<CourierToast />` | Handled via existing Cadence UI components (Radix Popover, Lucide icons, Sonner toasts) |
| **Local Dev & Offline DX** | Requires internet & Knock Cloud credentials. Mocking requires network stubs (MSW). | Cloud requires internet; Self-hosted requires Docker Compose (MongoDB, Redis, Worker). | Cloud-only; requires external network and API key. | 100% offline; runs instantly with `npm run dev` and `npm run db:seed`. |
| **DevUI Switcher Integration** | Difficult: switching students requires minting new JWTs and syncing subscribers to Cloud. | Difficult: subscriber IDs must exist or be dynamically created in external cloud. | Difficult: backend must issue user-scoped JWTs for each switch. | Instant: queries local SQLite synchronously by active `session.userId`. |
| **Database & Transaction Model** | Dual-write: SQLite commits first, API called separately (vulnerable to network failure). | Dual-write: external document store in cloud or MongoDB. | Dual-write: external store in Courier cloud. | Single-write: notification row inserted in same SQLite transaction as domain event. |
| **Pricing & Quota Limits** | Free tier: 10,000 notifications/mo. Paid starter: $250/mo. | Free tier: 10,000 workflow runs/mo. Paid tiers scale up. | Free tier: 10,000 sends/mo. Paid: ~$0.005/notification. | $0 forever. Unlimited notifications and zero rate limits. |
| **External Dependencies** | Node SDK (`@knocklabs/node`) + React SDK (`@knocklabs/react`) | Node SDK (`@novu/node`) + React SDK (`@novu/react`) | Node SDK (`@trycourier/courier`) + React SDK (`@trycourier/courier-react`) | Zero new dependencies (uses existing `better-sqlite3`, `drizzle-orm`, `react-router`, `sonner`, `lucide-react`). |
| **Architectural Fit (ADR 0006)** | Poor: introduces external cloud state silo. | Poor: requires external SaaS or heavy Docker infrastructure. | Poor: introduces external cloud state silo. | Ideal: directly follows ADR 0006 single-process, single-database architecture. |

---

## In-Depth Candidate Analysis

### 1. Knock

* **Primary Documentation**: [Knock React SDK Documentation](https://docs.knock.app/in-app-ui/react/overview), [Knock Feed Components](https://docs.knock.app/in-app-ui/react/feed), [Knock Pricing](https://knock.app/pricing).
* **Architecture**: Knock is a developer-centric notification infrastructure platform. It provides managed workflows, message delivery tracking, multi-channel fan-out, and an in-app feed channel.
* **React Integration**: Knock provides `@knocklabs/react` and `@knocklabs/react-core`. It includes prebuilt components (`NotificationFeedPopover`, `NotificationIconButton`) and headless hooks (`useNotifications`, `useFeed`). It supports React 19.
* **Real-time Delivery**: Uses persistent WebSockets connecting to Knock's managed infrastructure (`wss://api.knock.app`). Real-time badge counter and feed state are updated automatically on the client.
* **Evaluation for Cadence**:
  * *Strengths*: Highly polished UI components; strong developer documentation; headless hooks offer styling flexibility.
  * *Weaknesses*: Cloud-dependent. Every local development run, automated end-to-end test, or Vitest run requires an active internet connection and valid API credentials, or complex MSW mocks. When switching students in the Cadence DevUI, the frontend must reinitialize the Knock client and synchronize state. Furthermore, notification history is stored in Knock's cloud rather than Cadence's database.

### 2. Novu

* **Primary Documentation**: [Novu React SDK & Inbox Overview](https://docs.novu.co/inbox/react/get-started), [Novu Architecture](https://docs.novu.co/getting-started/how-novu-works), [Novu Docker Compose](https://docs.novu.co/deployment/docker-compose).
* **Architecture**: Novu is an open-source notification system offering both a managed cloud service and self-hosted deployments. It includes an Inbox component with built-in notification center and user preference tabs.
* **React Integration**: Novu provides `@novu/react` (v3). Components include `<Inbox />`, `<Bell />`, and `<Notifications />`. It features a "Keyless Mode" for instant mock testing without credentials.
* **Real-time Delivery**: WebSockets connecting to Novu Cloud (`wss://ws.novu.co`) or self-hosted Socket.io instances.
* **Evaluation for Cadence**:
  * *Strengths*: Composable components; keyless prototyping mode; open-source code.
  * *Weaknesses*: Novu Cloud has the same dual-write and offline testing drawbacks as Knock. While Novu can be self-hosted to run locally, doing so requires running Redis, MongoDB, an API service, and a background worker container via Docker Compose. For a project whose core architectural mandate is "one SQLite file reached through Drizzle" to avoid database server complexity ([ADR 0006](file:///docs/adr/0006-one-sqlite-file-through-drizzle.md)), running a 4-container microservice fleet just for notifications is unacceptable overhead.

### 3. Courier

* **Primary Documentation**: [Courier React Inbox Quickstart](https://docs.courier.com/docs/react-inbox), [Courier In-App Notifications](https://docs.courier.com/docs/inbox), [Courier Pricing](https://courier.com/pricing).
* **Architecture**: Courier focuses on notification orchestration across multi-channel routing (email, SMS, push, chat, and in-app inbox).
* **React Integration**: Provided via `@trycourier/courier-react`. Requires a backend route that uses `@trycourier/courier` to issue signed JSON Web Tokens (JWT) scoped to the user ID before the client calls `courier.shared.signIn()`.
* **Real-time Delivery**: WebSockets connecting to `wss://realtime.courier.com`.
* **Evaluation for Cadence**:
  * *Strengths*: Broad multi-channel orchestration; drop-in `<CourierInboxPopupMenu />` and toast components.
  * *Weaknesses*: Unnecessary architectural complexity. Generating authentication tokens on the server and passing them to the client adds plumbing for every user session. Because Cadence's notification scope explicitly excludes external channels like Email and SMS, Courier's core strengths are unused.

### 4. Native SQLite + Drizzle + Server-Sent Events (SSE)

* **Primary Documentation**: [ADR 0006: Keep all data in one SQLite file](file:///docs/adr/0006-one-sqlite-file-through-drizzle.md), [MDN Server-Sent Events API](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events), [React Router v7 Resource Routes](https://reactrouter.com).
* **Architecture**:
  * **Database**: A `notifications` table added to [`app/db/schema.ts`](file:///app/db/schema.ts) storing `id`, `userId`, `type`, `title`, `body`, `linkUrl`, `readAt`, and `createdAt`.
  * **Real-Time Push Transport**: An SSE resource route in React Router (e.g. `/api/notifications/stream`) returning a standard Web API `Response` with `Content-Type: text/event-stream`.
  * **In-Process Pub/Sub**: Since Cadence runs as a single Node process (`react-router-serve`), a simple in-memory `EventEmitter` in Node broadcasts notification events directly to active client SSE streams for that specific `userId`.
  * **Client Consumer**: A lightweight custom React hook (`useStudentNotifications`) leveraging the browser's native `EventSource` API. Incoming events update the unread count in real-time and trigger a floating toast via `sonner` (already installed in Cadence).
  * **UI**: A Bell button with an unread badge counter in the navigation header, paired with a popover feed dropdown built with Cadence's existing Radix UI primitives and Tailwind CSS.
* **Evaluation for Cadence**:
  * *Strengths*:
    1. **100% ACID Compliance**: Notifications are inserted atomically inside the existing Drizzle transactions that update lesson progress, course enrollment, or refund status.
    2. **Zero External Dependencies**: Uses existing packages already in `package.json` (`drizzle-orm`, `better-sqlite3`, `sonner`, `radix-ui`, `lucide-react`).
    3. **Zero Configuration Local DX**: Developers run `npm run dev` and notifications work out of the box. Switching users via the DevUI switcher instantly loads the correct notifications from SQLite without network requests.
    4. **Native Browser Reconnection**: `EventSource` has automatic reconnection with exponential backoff and event resumption built directly into all modern web browsers.
    5. **Cost & Privacy**: No recurring fees, zero rate limits, and student activity data remains strictly on-premise in the local database.
  * *Weaknesses*:
    * Requires authoring the UI popover and feed list (~150 lines of React/Tailwind code) rather than importing a pre-assembled widget. However, this ensures the UI seamlessly matches Cadence's design system without overriding third-party CSS.

---

## Detailed Comparison: WebSockets vs. Server-Sent Events (SSE)

For in-app student notifications in Cadence, the transport comparison between WebSockets and SSE is clear:

| Feature | Server-Sent Events (SSE) | WebSockets (WS) |
| :--- | :--- | :--- |
| **Directionality** | Unidirectional (Server to Client) — matches notification push. | Bidirectional (Full duplex) — unnecessary for notification push. |
| **Protocol** | Standard HTTP/1.1 or HTTP/2 (`text/event-stream`). | WebSocket protocol (`ws://`, `wss://`) requiring connection handshake upgrade. |
| **Browser Support** | Native `EventSource` API in all modern browsers. | Native `WebSocket` API in all modern browsers. |
| **Reconnection Handling** | **Built-in automatically** by browser, with configurable retry interval and `Last-Event-ID` header. | Manual client-side reconnection and backoff logic required. |
| **React Router v7 Integration** | Returned directly from standard route `loader` via Web `Response` stream. | Requires custom HTTP server hook or standalone WebSocket server process outside React Router. |
| **Firewall / Proxy Traversal** | Standard HTTP traffic; seamlessly passes through corporate proxies and CDN caches. | Often intercepted or throttled by restrictive proxies or intermediary firewalls. |

**Verdict**: Server-Sent Events (SSE) is the ideal transport for Cadence. Notifications are strictly push-based (server notifying the student). Actions originating from the student (such as marking a notification as read) are standard HTTP POST/PATCH mutations handled by React Router action functions.

---

## Proposed Native Schema & Architecture Blueprint

### 1. Drizzle Schema Addition (`app/db/schema.ts`)
```typescript
export const notificationTypeEnum = [
  "lesson_completed",
  "course_completed",
  "seat_claimed",
  "refund_approved",
  "refund_declined",
  "announcement",
] as const;

export const notifications = sqliteTable(
  "notifications",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type", { enum: notificationTypeEnum }).notNull(),
    title: text("title").notNull(),
    body: text("body").notNull(),
    linkUrl: text("link_url"),
    readAt: integer("read_at", { mode: "timestamp" }),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [
    index("notifications_user_idx").on(table.userId),
    index("notifications_user_unread_idx").on(table.userId, table.readAt),
  ]
);
```

### 2. In-Memory Event Hub (`app/lib/notifications.server.ts`)
```typescript
import { EventEmitter } from "node:events";

class NotificationHub extends EventEmitter {
  notifyUser(userId: number, payload: unknown) {
    this.emit(`user:${userId}`, payload);
  }
}

export const notificationHub = new NotificationHub();
```

### 3. SSE Stream Resource Route (`app/routes/api.notifications.stream.ts`)
```typescript
import type { LoaderFunctionArgs } from "react-router";
import { requireUser } from "~/lib/auth.server";
import { notificationHub } from "~/lib/notifications.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireUser(request);

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();
      const send = (data: unknown) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      const handler = (notification: unknown) => send(notification);
      notificationHub.on(`user:${user.id}`, handler);

      request.signal.addEventListener("abort", () => {
        notificationHub.off(`user:${user.id}`, handler);
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
```

---

## Primary Sources & References

1. **Cadence Architectural Decision Record 0006**:
   - Path: [`docs/adr/0006-one-sqlite-file-through-drizzle.md`](file:///docs/adr/0006-one-sqlite-file-through-drizzle.md)
   - Mandate: Single SQLite file (`data.db`), queried synchronously via `better-sqlite3` and Drizzle ORM in a single server process.
2. **Cadence Glossary & Domain Model**:
   - Path: [`GLOSSARY.md`](file:///GLOSSARY.md)
   - Defines student, enrollment, seat, purchase, and refund terminology.
3. **Knock Documentation**:
   - React SDK & Components: [https://docs.knock.app/in-app-ui/react/overview](https://docs.knock.app/in-app-ui/react/overview)
   - In-App Feed: [https://docs.knock.app/in-app-ui/react/feed](https://docs.knock.app/in-app-ui/react/feed)
   - Pricing: [https://knock.app/pricing](https://knock.app/pricing)
4. **Novu Documentation**:
   - React SDK & Inbox: [https://docs.novu.co/inbox/react/get-started](https://docs.novu.co/inbox/react/get-started)
   - Architecture: [https://docs.novu.co/getting-started/how-novu-works](https://docs.novu.co/getting-started/how-novu-works)
   - Self-Hosting Docker Compose: [https://docs.novu.co/deployment/docker-compose](https://docs.novu.co/deployment/docker-compose)
5. **Courier Documentation**:
   - React SDK: [https://docs.courier.com/docs/react-inbox](https://docs.courier.com/docs/react-inbox)
   - In-App Notification Center: [https://docs.courier.com/docs/inbox](https://docs.courier.com/docs/inbox)
   - Pricing: [https://courier.com/pricing](https://courier.com/pricing)
6. **W3C / WHATWG Specifications**:
   - Server-Sent Events Specification: [https://html.spec.whatwg.org/multipage/server-sent-events.html](https://html.spec.whatwg.org/multipage/server-sent-events.html)
   - MDN `EventSource`: [https://developer.mozilla.org/en-US/docs/Web/API/EventSource](https://developer.mozilla.org/en-US/docs/Web/API/EventSource)

---

## Architectural Recommendation & Next Steps

1. **Resolution on Map Issue #1**: Formally record the selection of Native SQLite + Drizzle with Server-Sent Events (SSE) for in-app student notifications.
2. **Proceed to Ticket #5 (Select delivery architecture and real-time push mechanism)**:
   - Establish SSE as the official push mechanism.
   - Specify the reconnection backoff, event payload structure, and in-memory event bus lifecycle for React Router v7.
3. **Proceed to Ticket #4 (Define student notification event triggers and payload schema)**:
   - Add the `notifications` table to `app/db/schema.ts`.
   - Implement the notification triggers within course, enrollment, and refund action handlers.
4. **Proceed to Ticket #3 (Prototype in-app student notification UI surfaces)**:
   - Implement the notification bell icon with unread badge counter in the student navigation header.
   - Build the dropdown popover feed displaying notification items with read/unread statuses.
   - Integrate `sonner` toasts for real-time notifications arriving while the student is active.
