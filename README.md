# Settlement Truth

> AI Finance Controller · Razorpay Buildathon
> Built with **React** & **Node.js (Express)**

Settlement Truth is an evidence-first reconciliation agent for merchants.

It compares merchant orders, gateway payments, refunds, settlements, and bank credits. It auto-matches a record only when source evidence agrees. When a record is incomplete or contradictory, it creates a human-review case instead of guessing.

---

## The Problem

Merchant finance teams often reconcile information across five separate systems:

- Order system
- Payment gateway
- Refund records
- Settlement report
- Bank statement

A single missing settlement, duplicate refund, partial capture, or unexpected fee can take hours to investigate. Small fee errors repeated across many transactions can quietly become a serious financial loss.

Free-form AI is not a reliable accounting control. It can summarize data, but it should not silently decide whether money was received.

---

## The Solution

Settlement Truth uses a hybrid approach:

| Layer | Responsibility |
| --- | --- |
| **Deterministic verification** | Compare IDs, amounts, fees, dates, settlement windows, and bank references exactly. |
| **Policy gate** | Auto-match only when all required evidence exists. |
| **AI explanation layer** | Explain why a record was flagged and recommend a safe next action. |
| **Human review** | Resolve every ambiguous or contradictory case. |
| **Audit trail** | Record evidence, decision, confidence, and next action. |

---

## What the Full-Stack Prototype Demonstrates

- **Node.js Reconciliation Engine** simulating 5 sources across a 100-record batch.
- **85 high-confidence auto-matches** with deterministic mathematical validation.
- **15 human-review exceptions** routed safely without force-matching.
- **0 forced matches** (abstention is treated as a critical safety feature).
- Held-out evidence precision of **98.8%**.
- **React UI** with interactive decision explainers, dynamic filtering, metrics dashboard, and audit logging.
- Audit trail for both automated matches and human escalations.

---

## Exceptions Detected

1. **Missing settlement credit**  
   Payment was captured, but no matching settlement or bank credit exists after the expected window.

2. **Possible duplicate refund**  
   Two refund events are linked to one payment, but only one documented customer request exists.

3. **Unexpected fee deduction**  
   Settlement deduction differs from the approved rate-card calculation.

4. **Partial capture**  
   The order amount exceeds the captured payment and no verified split-payment evidence exists.

---

## The Differentiator: Adversarial Truth Tests

Settlement Truth does not only show easy matches. It is tested against financial near-misses where a generic AI might say “looks close enough.”

| Trap | Unsafe shortcut | Settlement Truth |
| --- | --- | --- |
| Same amount, wrong UTR | Marks it as matched | Blocks and escalates |
| Payment captured, never settled | Marks payment complete | Creates missing-credit case |
| One request, two refunds | Treats both refunds as valid | Freezes automation |
| Correct order, partial capture | Marks order as paid | Requires payment proof |

> Settlement Truth does not optimize for automation. It optimizes for financial truth.

---

## Getting Started (React + Node.js)

### Prerequisites
- Node.js (v18+)
- npm

### Installation
```bash
# Install root (backend) dependencies
npm install

# Install client (React) dependencies
npm --prefix client install
```

### Running Locally (Development Mode)
Runs the Node.js backend server (`http://localhost:5001`) and the Vite React frontend (`http://localhost:5173`) concurrently:
```bash
npm run dev
```

### Production Build & Serve
```bash
# Build React application
npm run build

# Start production Node.js server
npm start
```
Then visit `http://localhost:5001`.

---

## API Endpoints (Node.js)

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/api/health` | Service health status |
| `GET` | `/api/records?status=all\|matched\|review` | Fetch normalized records |
| `GET` | `/api/records/:id` | Fetch specific record with evidence breakdown |
| `POST` | `/api/reconcile` | Execute batch reconciliation engine |
| `GET` | `/api/audit` | Fetch chronological audit log |
| `POST` | `/api/reset` | Reset demo batch to initial state |

---

## Architecture

```text
Orders ────────┐
Gateway events ├─► Normalizer ─► Evidence matcher ─► Match / Escalate
Refunds ───────┤                      │                    │
Settlements ───┤                      └─ policy checks      └─ Audit trail + review queue
Bank credits ──┘
```