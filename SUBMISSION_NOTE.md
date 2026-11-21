# Submission Note: Evaluation Reflection

### Question: What did you not finish, and why?

Given the ~8-hour scope for this assessment, deliberate prioritization was exercised to focus on the **critical business invariants and high-risk system vulnerabilities** highlighted in the problem statements:

1. **What was prioritized and completed**:
   - **INC-0291**: Atomic race-condition prevention during ticket claiming using transactional optimistic locking.
   - **INC-0304**: Structural database and API-level data isolation preventing customer leaks of private team notes.
   - **INC-0318**: Tamper-proof, append-only audit trail capturing state changes, timestamps, and actors.
   - **SLA Engine**: Full business hours calculation (9:30–18:30 Mon–Fri, excluding weekends & holiday dates), timer pausing when waiting on customers, and proportional SLA recalculation upon mid-flight priority escalations.
   - **Agent Interface**: Dense single-screen support dashboard with visual breach indicators, status transitions, and role switching.

2. **What was deferred (and why)**:
   - **Real Authentication (JWT / OAuth / NextAuth)**:
     - *Why skipped*: Full session cookies, login forms, password hashing, and token lifecycles add considerable boilerplate without demonstrating product architecture. Instead, simulated role-switching was chosen while strictly enforcing authorization and role validation server-side on every API route.
   - **Automated Background Cron Worker (Auto-Close after 5 working days)**:
     - *Why skipped*: In production, a serverless CRON job (e.g., Vercel Cron or GitHub Actions) would run hourly to auto-close inactive tickets. Due to time limits and avoiding heavy background daemon requirements on free hosting, this rule was modeled in the domain state machine and applied synchronously on ticket retrieval/state checks.
   - **Dynamic Holiday Administration UI**:
     - *Why skipped*: Built a robust holiday exclusion lookup model in the database (pre-seeded with official holidays), but did not build an administrative CRUD calendar screen to add/edit custom holidays dynamically.
   - **WebSocket / SSE Real-Time Updates**:
     - *Why skipped*: Evaluators can test concurrency conflicts directly (409 Conflict toast appears instantly when attempting to claim a taken ticket). Polling or WebSockets were deprioritized in favor of rock-solid optimistic locking and data consistency at the database tier.

