# Settlement Truth

> AI Finance Controller · Razorpay Buildathon

Settlement Truth is an evidence-first reconciliation agent for merchants.

It compares merchant orders, gateway payments, refunds, settlements, and bank credits. It auto-matches a record only when source evidence agrees. When a record is incomplete or contradictory, it creates a human-review case instead of guessing.

## The problem

Merchant finance teams often reconcile information across five separate systems:

- Order system
- Payment gateway
- Refund records
- Settlement report
- Bank statement

A single missing settlement, duplicate refund, partial capture, or unexpected fee can take hours to investigate. Small fee errors repeated across many transactions can quietly become a serious financial loss.

Free-form AI is not a reliable accounting control. It can summarize data, but it should not silently decide whether money was received.

## The solution

Settlement Truth uses a hybrid approach:

| Layer | Responsibility |
| --- | --- |
| Deterministic verification | Compare IDs, amounts, fees, dates, settlement windows, and bank references exactly. |
| Policy gate | Auto-match only when all required evidence exists. |
| AI explanation layer | Explain why a record was flagged and recommend a safe next action. |
| Human review | Resolve every ambiguous or contradictory case. |
| Audit trail | Record evidence, decision, confidence, and next action. |

## What the prototype demonstrates

- A deterministic **100-record synthetic batch**
- **85 high-confidence auto-matches**
- **15 human-review exceptions**
- **0 forced matches**
- Illustrative held-out evidence precision of **98.8%**
- Evidence checks and safe next actions for every record
- An audit trail for both matches and abstentions

## Exceptions detected

1. **Missing settlement credit**  
   Payment was captured, but no matching settlement or bank credit exists after the expected window.

2. **Possible duplicate refund**  
   Two refund events are linked to one payment, but only one documented customer request exists.

3. **Unexpected fee deduction**  
   Settlement deduction differs from the approved rate-card calculation.

4. **Partial capture**  
   The order amount exceeds the captured payment and no verified split-payment evidence exists.

## The differentiator: adversarial truth tests

Settlement Truth does not only show easy matches. It is tested against financial near-misses where a generic AI might say “looks close enough.”

| Trap | Unsafe shortcut | Settlement Truth |
| --- | --- | --- |
| Same amount, wrong UTR | Marks it as matched | Blocks and escalates |
| Payment captured, never settled | Marks payment complete | Creates missing-credit case |
| One request, two refunds | Treats both refunds as valid | Freezes automation |
| Correct order, partial capture | Marks order as paid | Requires payment proof |

> Settlement Truth does not optimize for automation. It optimizes for financial truth.

## Run locally

This is a static project. No API key, installation, or server is required.

Open `index.html` in a modern browser.

## Architecture

```text
Orders ────────┐
Gateway events ├─► Normalizer ─► Evidence matcher ─► Match / Escalate
Refunds ───────┤                      │                    │
Settlements ───┤                      └─ policy checks      └─ Audit trail + review queue
Bank credits ──┘