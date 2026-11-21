# Frontdesk — Comprehensive Evaluation Test Cases

This testing matrix maps directly to the stories, incidents, and edge cases specified in the hiring test document.

---

### Test Suite 1: Authentication & Role Gateways

| ID | Objective | Steps to Execute | Expected Behavior |
| :--- | :--- | :--- | :--- |
| **TC-01** | Unauthorized Access Block | Open an Incognito window and visit `http://localhost:3000` | Immediate redirect to `/login`. No tickets or dashboard visible. |
| **TC-02** | Customer Portal Separation | On `/login`, click "Support & Dev", enter `priya@client.com` / `password123` | Login rejected: `403 Access denied: This portal is strictly for Support Agents and Developers`. |
| **TC-03** | Support Agent Access | On `/login`, click "Support & Dev", enter `ravi@arvo.io` / `password123` | Logs in successfully. Access granted to triage queue, claim actions, and internal notes. |
| **TC-04** | Clean Session Sign Out | Click **Sign Out** button in the top-right header | Token destroyed; immediate hard redirect to `/login`. Back button cannot re-enter. |

---

### Test Suite 2: Incident 1 (INC-0291) — Race Conditions & Concurrency

| ID | Objective | Steps to Execute | Expected Behavior |
| :--- | :--- | :--- | :--- |
| **TC-05** | Atomic Claiming (Happy Path) | Log in as `ravi@arvo.io`, open an unassigned `OPEN` ticket, click **"Claim Ticket"** | Ticket status changes to `IN_PROGRESS`, assignee updates to "Ravi Kumar", Claim button disappears. |
| **TC-06** | Double-Claim Collision (**INC-0291**) | Open the same unassigned ticket in two separate browsers (Window A: Ravi, Window B: Sneha). Click "Claim" in Window A, then immediately click "Claim" in Window B. | Window A succeeds. Window B receives `409 Conflict` and displays toast: *"Already claimed by another agent"*. Ticket is never double-assigned. |

---

### Test Suite 3: Incident 2 (INC-0304) — Data Privacy & Note Leaks

| ID | Objective | Steps to Execute | Expected Behavior |
| :--- | :--- | :--- | :--- |
| **TC-07** | Agent Writes Internal Note | Log in as `ravi@arvo.io`, open a ticket, check **"Internal Note"**, type: *"DevOps issue, cert expired"*, click **Send** | Message appears with distinct yellow border and `🔒 INTERNAL NOTE — Team only` header. |
| **TC-08** | Note Leak Prevention (**INC-0304**) | Sign out, log in as Customer `priya@client.com`, open the exact same ticket | The internal note is **completely absent** from the thread. |
| **TC-09** | Network Payload Inspection | In Customer view, open Browser DevTools $\rightarrow$ Network tab $\rightarrow$ inspect `GET /api/tickets/[id]` response | The JSON payload structurally omits `INTERNAL_NOTE` (filtered at the DB layer, not hidden with CSS). |
| **TC-10** | Customer Cannot Post Notes | Using DevTools or curl as Customer, send `POST /api/tickets/[id]/messages` with `type: "INTERNAL_NOTE"` | Backend rejects with `403 Forbidden: Customers cannot create internal notes`. |

---

### Test Suite 4: Incident 3 (INC-0318) — Non-Repudiation & Audit Trail

| ID | Objective | Steps to Execute | Expected Behavior |
| :--- | :--- | :--- | :--- |
| **TC-11** | Immutable Audit Logging | As an Agent, claim a ticket, change status to "Wait on Customer", change priority to "High" | Switch to **"Audit Trail"** tab. Every single action is listed with actor, exact timestamp, and `old_value → new_value`. |
| **TC-12** | Tamper-Proof Audit API | Attempt to send a `PUT`, `PATCH`, or `DELETE` request to `/api/tickets/[id]/audit` | Fails with `405 Method Not Allowed`. Audit rows are strictly append-only. |

---

### Test Suite 5: SLA Business Hours & Meeting Dilemmas

| ID | Objective | Steps to Execute | Expected Behavior |
| :--- | :--- | :--- | :--- |
| **TC-13** | Working Hours Exclusion | Inspect a ticket created Friday 6:00 PM (30 mins before closing) with a 2-hour reply SLA | Deadline is scheduled for **Monday 10:00 AM** (skipping Saturday and Sunday entirely). |
| **TC-14** | SLA Pause on Customer | As Agent, click **"Wait on Customer"** | Status updates to `WAITING_ON_CUSTOMER`. An amber indicator confirms: `⏸ SLA paused (waiting on customer)`. |
| **TC-15** | SLA Timer Auto-Resume | Log in as Customer and send a reply message | Status automatically reverts to `IN_PROGRESS`; paused duration is calculated and SLA timer resumes. |
| **TC-16** | Priority Escalation (Meera's Question) | On an active Medium ticket (4.5 hr SLA), escalate priority to **"HIGH"** (2 hr SLA) | Remaining SLA time is recalculated **proportionally**: $\text{Remaining}_{\text{new}} = (\text{Remaining}_{\text{old}} / \text{Total}_{\text{old}}) \times \text{Total}_{\text{new}}$. |
| **TC-17** | Ticket Reopen Window | 1. Customer replies to a ticket resolved < 7 days ago.<br/>2. Customer attempts to reopen a ticket resolved > 7 days ago. | 1. Reopens successfully to `REOPENED`.<br/>2. Rejected with message: *"Cannot reopen: more than 7 days since resolution. Please create a new ticket."* |
| **TC-18** | SLA Breach Filter | In Agent dashboard, check the **"⚠ Overdue Only"** filter box | Filter instantly isolates only tickets that breached their reply or resolve deadlines, highlighted with red `⚠ SLA BREACH` badges. |
