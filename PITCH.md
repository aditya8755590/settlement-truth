# Settlement Truth — Five-Minute Pitch

## Title

**Settlement Truth: Reconcile cash. Never invent the truth.**

---

## 0:00–0:35 — The problem

“Every online merchant has a quiet finance problem.

A customer pays. The order system says paid. The gateway says captured. The settlement report says pending. The bank statement says nothing.

Someone in finance must open multiple dashboards and spreadsheets to answer one simple question:

**Did the merchant actually receive the money?**”

---

## 0:35–1:00 — Why normal AI is dangerous

“Many teams might upload financial spreadsheets into a general AI tool and ask it to find missing payments.

That is unsafe.

A language model is useful for explanation, but it is not an accounting control. A tiny fee mismatch, a wrong bank UTR, or one skipped row can become a real financial loss.

Finance does not need an AI that sounds confident. It needs a system that can prove every decision.”

---

## 1:00–1:25 — The product

“This is Settlement Truth.

Settlement Truth compares five financial sources:

1. Merchant orders  
2. Gateway payments  
3. Refund events  
4. Settlement reports  
5. Bank credits  

It matches a record only when the evidence agrees. If evidence is missing or contradictory, it refuses to guess and creates a review case.”

Show the hero section and the “Run reconciliation” button.

---

## 1:25–1:45 — Run the batch

“This demo uses 100 synthetic records.

I will run the reconciliation now.”

Click **Run reconciliation**.

“It auto-matched 85 records, routed 15 records to human review, and most importantly: it made zero forced matches.”

Point to:

- 85 / 100 auto-matched
- 98.8% evidence precision
- 15 exceptions
- ₹31,480 cash at risk

---

## 1:45–2:30 — Exception 1: missing settlement

Click `ORD-88135`.

“This payment was captured for ₹4,260.

But Settlement Truth found no settlement record and no matching bank credit after the expected settlement window.

A weak system could see ‘captured’ and mark the order as paid.

Settlement Truth does not. It shows the evidence, explains the missing proof, and creates a safe next action:

**Escalate to payments operations. Do not mark paid.**”

---

## 2:30–3:10 — Exception 2: duplicate refund

Click `ORD-88142`.

“Here, two refund events are connected to one original payment, but only one customer support request exists.

The system does not auto-refund again and does not silently accept both records.

It freezes the automatic workflow until a human verifies the refund intent.

This protects both merchant cash and customer trust.”

---

## 3:10–4:00 — The differentiator

Scroll to **The Differentiator** section.

“This is what makes Settlement Truth different.

We deliberately test dangerous near-matches:

- Same amount, but wrong bank UTR
- Payment captured, but never settled
- One request, but two refunds
- Correct order, but only partial payment captured

A generic AI may call these close enough.

Settlement Truth requires proof.

One failed proof is enough to stop automatic reconciliation.”

---

## 4:00–4:35 — How it works

“Under the hood, Settlement Truth uses deterministic verification for money:

- Exact amount checks
- Payment and order ID linking
- Settlement-window validation
- Fee tolerance checks
- Bank reference matching
- Duplicate-refund checks

AI is used only after verification to explain the exception in clear language and recommend a safe human workflow.

The AI does not move money. The human remains in control.”

Show the audit trail.

---

## 4:35–5:00 — Close

“Settlement Truth does not optimize for automation.

It optimizes for financial truth.

It gives merchant finance teams a faster way to find missing cash, duplicate refunds, fee creep, and partial captures—without creating a new category of silent AI financial mistakes.

**Reconcile cash. Never invent the truth.**”