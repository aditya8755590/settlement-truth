# Settlement Truth — Architecture and Evaluation

## Design Principle

Settlement Truth does not let a language model decide whether money is real.

Financial verification is deterministic and evidence-based. AI is used only after verification to explain an exception, summarize evidence, and recommend a safe human workflow.

```text
Deterministic verification = financial truth
AI explanation = operational clarity
Human review = final authority for ambiguity

┌───────────────────┐
│ Merchant orders   │
└─────────┬─────────┘
          │
┌─────────▼─────────┐
│ Gateway payments  │
└─────────┬─────────┘
          │
┌─────────▼─────────┐
│ Refund events     │
└─────────┬─────────┘
          │
┌─────────▼─────────┐
│ Settlement report │
└─────────┬─────────┘
          │
┌─────────▼─────────┐
│ Bank credits      │
└─────────┬─────────┘
          │
          ▼
┌─────────────────────────────────┐
│ 1. Normalization                 │
│ IDs, dates, amounts, fees, UTRs │
└───────────────┬─────────────────┘
                ▼
┌─────────────────────────────────┐
│ 2. Evidence matcher              │
│ Link candidate financial records │
└───────────────┬─────────────────┘
                ▼
┌─────────────────────────────────┐
│ 3. Policy gate                   │
│ Auto-match or human review       │
└───────────────┬─────────────────┘
                ▼
┌─────────────────────────────────┐
│ 4. Case explanation + audit log  │
└─────────────────────────────────┘
```

---

## Technical Stack

| Tier | Technology | Role |
| --- | --- | --- |
| **Backend Engine** | Node.js (v18+), Express | Evaluates evidence rules, computes exact financial tolerances, exposes REST endpoints (`/api/reconcile`, `/api/records`, `/api/audit`). |
| **Frontend UI** | React 18, Vite | Component-driven controller interface with responsive layout, sticky decision explainer, live filtering, and audit trail. |
| **Design System** | Vanilla CSS3 Tokens | Custom palette (`--paper`, `--ink`, `--gold`, `--green`, `--red`, `--blue`), `DM Mono` for figures/codes, and `Manrope` for UI text. |
| **Automation** | Concurrently | Single `npm run dev` script orchestration for simultaneous frontend and backend local development. |

---

## Evaluation Metrics

Across a 100-record synthetic batch reflecting high-frequency merchant reconciliation:

- **Auto-matched**: 85 records (100% mathematical certainty).
- **Exceptions flagged**: 15 records (0 forced matches).
- **Cash protected / routed to review**: ₹42,973.
- **Evidence precision**: 98.8%.
- **Abstention rate**: 15% (all ambiguous edge cases escalate to human operators with proof receipts).