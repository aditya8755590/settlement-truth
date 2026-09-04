# Settlement Truth — Architecture and Evaluation

## Design principle

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