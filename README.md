# Frontdesk — Support Ticket Management System

Frontdesk is a modern support ticket management system built for **Arvo Systems** to replace spreadsheet-based customer support. It features strict SLA enforcement, atomic concurrency control, customer/agent data isolation, and an immutable audit trail.

---

## 🚀 Live Demo & Repository
- **Live URL**: [Add your deployed Vercel link here]
- **Repository**: [Add your GitHub repository link here]

---

## 🛠 Tech Stack
- **Framework**: Next.js 15 (App Router, TypeScript)
- **Styling**: Tailwind CSS
- **Database**: PostgreSQL (Neon Serverless Postgres)
- **ORM**: Prisma ORM
- **Deployment**: Vercel

---

## 📐 Key Architectural Decisions & Problem Resolutions

### 1. INC-0291: Atomic Ticket Claiming (Concurrency & Race Conditions)
- **The Problem**: Two agents clicked "Take this ticket" simultaneously, resulting in double-assignment and conflicting answers to the client.
- **The Solution**: Implemented optimistic locking with transactional checks in `POST /api/tickets/[id]/claim`.
  ```sql
  UPDATE "Ticket" 
  SET "assignedToId" = $agentId, "status" = 'IN_PROGRESS', "version" = "version" + 1 
  WHERE "id" = $id AND "assignedToId" IS NULL AND "version" = $expectedVersion;
  ```
  If another agent claims the ticket in the same millisecond, the second transaction fails immediately and returns `409 Conflict`, prompting the UI to show *"Already claimed by Agent X"*.

### 2. INC-0304: Strict Internal Note Isolation (Data Leak Prevention)
- **The Problem**: An internal note explaining how to deal with a difficult client was accidentally sent to the customer.
- **The Solution**: 
  - Messages are categorized as `PUBLIC_REPLY` vs. `INTERNAL_NOTE`.
  - Customer queries in `GET /api/tickets/[id]` **structurally filter** out `INTERNAL_NOTE` at the database level (`where: { type: "PUBLIC_REPLY" }`).
  - In `POST /api/tickets/[id]/messages`, customers are strictly forbidden (`403 Forbidden`) from authoring internal notes.
  - Distinct UI warnings: Yellow highlight and prominent banner indicating private team-only visibility.

### 3. INC-0318: Immutable Audit Trail (Non-Repudiation)
- **The Problem**: Disputed response times between customer and support lead with zero proof of history.
- **The Solution**: Append-only `AuditLog` table recording `ticketId`, `actorId`, `action` (CREATED, CLAIMED, STATUS_CHANGE, PRIORITY_CHANGE, MESSAGE_SENT), previous value, new value, and an immutable timestamp. No update or delete operations are permitted.

### 4. Working Hours SLA Calculation Engine
- **Business Hours**: Mon–Fri, 09:30 AM to 06:30 PM (9 business hours/day). Excludes weekends and festival holidays.
- **SLA Tiers**:
  - **HIGH**: 2 working hrs (1st reply), 9 working hrs (resolution - same day).
  - **MEDIUM**: 4.5 working hrs (1st reply), 27 working hrs (resolution - 3 days).
  - **LOW**: 9 working hrs (1st reply), 45 working hrs (resolution - 5 days).
- **Pause on Customer**: When status changes to `WAITING_ON_CUSTOMER`, the SLA countdown timer is paused; resumes when customer replies.
- **Mid-Flight Priority Escalation (Meera's Question)**: Calculated **proportionally**:
  $$\text{new\_remaining} = \left(\frac{\text{old\_remaining}}{\text{old\_total}}\right) \times \text{new\_total}$$
  This prevents resetting the clock unfairly while honoring the higher priority tier.

---

## 💻 Local Setup Instructions

1. **Clone the repository**:
   ```bash
   git clone <repo-url>
   cd frontdesk
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env` file in the root directory:
   ```env
   DATABASE_URL="your-postgresql-connection-string"
   ```

4. **Initialize Database & Seed Data**:
   ```bash
   npx prisma db push
   npx tsx prisma/seed.ts
   ```

5. **Start Development Server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) to view the application.

---

## 📝 Post-Mortem Note (What did you not finish, and why?)

See [SUBMISSION_NOTE.md](file:///e:/nav%20tech/frontdesk/SUBMISSION_NOTE.md) for detailed evaluation reflection.

