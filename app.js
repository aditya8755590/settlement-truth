const showcaseRecords = [
    {
        id: "ORD-88104",
        type: "Order + gateway + settlement",
        amount: 2499,
        status: "matched",
        evidence: 100,
        title: "Exact settlement match",
        reason:
            "Order, captured payment, settlement entry and bank credit agree on amount, date and payment reference.",
        checks: [
            "Order ID ORD-88104 found",
            "Payment pay_H12 captured for ₹2,499",
            "Settlement setl_042 contains payment",
            "Bank reference UTR-9017 agrees",
        ],
        action: "Auto-matched. No money action taken.",
    },
    {
        id: "ORD-88109",
        type: "Order + gateway + settlement",
        amount: 1899,
        status: "matched",
        evidence: 98,
        title: "Fee-adjusted settlement match",
        reason:
            "The settlement is lower than the order only because the documented gateway fee and GST are present.",
        checks: [
            "Gross amount ₹1,899",
            "Gateway fee ₹35.89 + GST ₹6.46",
            "Expected net ₹1,856.65",
            "Bank credit ₹1,856.65",
        ],
        action: "Auto-matched with fee explanation.",
    },
    {
        id: "ORD-88121",
        type: "Refund + gateway + bank",
        amount: 749,
        status: "matched",
        evidence: 97,
        title: "Refund correctly linked",
        reason:
            "Refund reference, original payment and bank debit are internally consistent.",
        checks: [
            "Refund rfnd_K19 linked to pay_D91",
            "Refunded amount equals ₹749",
            "Refund event is inside policy window",
            "Bank debit matches settlement cycle",
        ],
        action: "Auto-matched. Refund marked complete.",
    },
    {
        id: "ORD-88135",
        type: "Settlement exception",
        amount: 4260,
        status: "review",
        evidence: 61,
        title: "Missing settlement credit",
        reason:
            "Captured payment exists, but no settlement item or matching bank credit appears after the expected T+2 window.",
        checks: [
            "Payment pay_F71 captured",
            "Expected settlement date: Aug 28",
            "No settlement line found",
            "No bank credit found",
        ],
        action:
            "Escalate to payments operations. Do not retry or mark paid.",
    },
    {
        id: "ORD-88142",
        type: "Refund exception",
        amount: 1299,
        status: "review",
        evidence: 54,
        title: "Possible duplicate refund",
        reason:
            "Two refund events have the same amount and original payment, but only one customer request is documented.",
        checks: [
            "Two refund IDs link to pay_P44",
            "Amounts are both ₹1,299",
            "Only one support ticket exists",
            "Bank debit status is pending",
        ],
        action: "Freeze automated action. Human must verify refund intent.",
    },
    {
        id: "ORD-88157",
        type: "Fee exception",
        amount: 8990,
        status: "review",
        evidence: 73,
        title: "Unexpected fee deduction",
        reason:
            "Settlement is ₹182 lower than the documented rate-card expectation.",
        checks: [
            "Gross amount ₹8,990",
            "Expected net ₹8,810.18",
            "Actual bank credit ₹8,628.18",
            "Fee variance ₹182",
        ],
        action: "Create fee-dispute packet with source records.",
    },
    {
        id: "ORD-88162",
        type: "Order + gateway + settlement",
        amount: 3299,
        status: "matched",
        evidence: 99,
        title: "Exact settlement match",
        reason:
            "All source records agree and the settlement landed within the expected window.",
        checks: [
            "Order and payment ID link",
            "Captured amount matches",
            "Settlement reference matches",
            "Bank credit matches",
        ],
        action: "Auto-matched. No money action taken.",
    },
    {
        id: "ORD-88176",
        type: "Settlement exception",
        amount: 2750,
        status: "review",
        evidence: 68,
        title: "Partial capture requires review",
        reason:
            "The order is ₹2,750 but the gateway shows only ₹1,375 captured. The remaining balance has no payment evidence.",
        checks: [
            "Order value ₹2,750",
            "Captured payment ₹1,375",
            "No second payment found",
            "No valid split-payment flag",
        ],
        action:
            "Escalate to merchant support; do not infer a second payment.",
    },
];

const exceptionTemplates = [
    {
        type: "Settlement exception",
        title: "Missing settlement credit",
        reason:
            "Captured payment has passed the expected settlement window, but no settlement item or matching bank credit was found.",
        checks: [
            "Captured gateway event is present",
            "Expected settlement window expired",
            "No settlement line found",
            "No bank credit found",
        ],
        action:
            "Escalate to payments operations. Do not mark paid.",
        evidence: 61,
    },
    {
        type: "Refund exception",
        title: "Possible duplicate refund",
        reason:
            "Two refund events share the same original payment and amount, while only one documented customer request exists.",
        checks: [
            "Two refunds link to one payment",
            "Equal refund amounts",
            "Single support request",
            "Second debit still pending",
        ],
        action:
            "Freeze automated action; human verification required.",
        evidence: 54,
    },
    {
        type: "Fee exception",
        title: "Unexpected fee deduction",
        reason:
            "The credited amount differs from the rate-card calculation by more than the approved tolerance.",
        checks: [
            "Gross amount verified",
            "Expected fee calculated",
            "Bank credit observed",
            "Variance exceeds ₹25 tolerance",
        ],
        action:
            "Create an evidence packet for fee review.",
        evidence: 73,
    },
    {
        type: "Payment exception",
        title: "Partial capture requires review",
        reason:
            "The order amount exceeds the captured payment and no verified split-payment evidence exists.",
        checks: [
            "Order value available",
            "Partial gateway capture found",
            "No second payment reference",
            "No split-payment flag",
        ],
        action:
            "Escalate to merchant support; do not infer payment completion.",
        evidence: 68,
    },
];

function formatINR(value) {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
    }).format(value);
}

const records = [...showcaseRecords];

/*
  Creates a deterministic synthetic batch:
  85 evidence-backed matches + 15 review exceptions.
  No real merchant, payment, customer or bank data is used.
*/
for (let i = 0; i < 92; i += 1) {
    const number = 88180 + i;
    const amount = 599 + ((i * 347) % 9400);
    const isReview = i < 11;

    if (isReview) {
        const issue = exceptionTemplates[i % exceptionTemplates.length];

        records.push({
            id: `ORD-${number}`,
            amount,
            status: "review",
            ...issue,
        });
    } else {
        const fee = Math.round(amount * 0.0236);

        records.push({
            id: `ORD-${number}`,
            type: "Order + gateway + settlement",
            amount,
            status: "matched",
            evidence: i % 7 === 0 ? 98 : 100,
            title:
                i % 5 === 0
                    ? "Fee-adjusted settlement match"
                    : "Exact settlement match",
            reason:
                i % 5 === 0
                    ? "The net bank credit equals the gross amount after the documented gateway fee and tax."
                    : "Order, captured payment, settlement line and bank credit agree within the approved tolerance.",
            checks:
                i % 5 === 0
                    ? [
                        `Gross order amount ${formatINR(amount)}`,
                        `Documented fee and tax ${formatINR(fee)}`,
                        "Settlement reference linked",
                        "Net bank credit agrees",
                    ]
                    : [
                        "Order reference linked",
                        "Captured payment found",
                        "Settlement reference linked",
                        "Bank credit agrees",
                    ],
            action: "Auto-matched. No money action taken.",
        });
    }
}

const body = document.getElementById("recordsBody");
const template = document.getElementById("recordTemplate");

let activeFilter = "all";
let hasRun = false;

function renderRecords() {
    body.innerHTML = "";

    records
        .filter((record) => activeFilter === "all" || record.status === activeFilter)
        .forEach((record) => {
            const row = template.content.cloneNode(true);

            row.querySelector(".record-id").textContent = record.id;
            row.querySelector(".record-type").textContent = record.type;
            row.querySelector(".record-amount").textContent = formatINR(record.amount);

            const badge = row.querySelector(".decision-badge");
            badge.textContent = record.status === "matched" ? "MATCHED" : "REVIEW";
            badge.classList.add(record.status);

            row.querySelector(
                ".evidence-score"
            ).textContent = `${record.evidence}% evidence`;

            row.querySelector(".inspect-button").addEventListener("click", () => {
                showDetails(record);
            });

            body.appendChild(row);
        });
}

function showDetails(record) {
    const panel = document.getElementById("explainPanel");
    const isMatch = record.status === "matched";

    panel.innerHTML = `
    <p class="eyebrow">DECISION EXPLAINER</p>
    <h2>${record.id}</h2>
    <p class="detail-status" style="color: ${isMatch ? "var(--green)" : "var(--red)"
        }">${record.title}</p>
    <p class="detail-copy">${record.reason}</p>

    <p class="detail-label">
      EVIDENCE CHECKS · ${record.evidence}% CONFIDENCE
    </p>

    <ul class="evidence-list">
      ${record.checks.map((check) => `<li><span>✓</span>${check}</li>`).join("")}
    </ul>

    <div class="next-action">
      <b>SAFE NEXT STEP</b>
      ${record.action}
    </div>
  `;
}

function renderAudit() {
    document.getElementById("auditList").innerHTML = `
    <li>
      <span>09:42</span>
      <div>
        <b>Loaded 100 synthetic records from 5 sources</b>
        <p>Orders, gateway events, refunds, settlements and bank credits normalized.</p>
      </div>
    </li>
    <li>
      <span>09:43</span>
      <div>
        <b>Auto-matched 85 evidence-complete records</b>
        <p>Every match met the confidence and source-agreement policy.</p>
      </div>
    </li>
    <li>
      <span>09:43</span>
      <div>
        <b>Abstained on 15 ambiguous records</b>
        <p>No uncertain record was force-matched. ₹31,480 routed to the review queue.</p>
      </div>
    </li>
    <li>
      <span>09:44</span>
      <div>
        <b>Generated auditable next steps</b>
        <p>Each exception contains the evidence and the specific human action required.</p>
      </div>
    </li>
  `;
}

function runDemo() {
    if (hasRun) return;

    hasRun = true;

    const button = document.getElementById("runButton");
    button.disabled = true;
    button.textContent = "Verifying 5 sources…";

    setTimeout(() => {
        document.getElementById("matchedValue").textContent = "85 / 100";
        document.getElementById("matchedHint").textContent = "₹1,84,620 reconciled";

        document.getElementById("precisionValue").textContent = "98.8%";

        document.getElementById("exceptionValue").textContent = "15";
        document.getElementById("exceptionHint").textContent = "0 forced matches";

        document.getElementById("riskValue").textContent = "₹31,480";

        button.textContent = "✓ Reconciliation complete";

        document.querySelectorAll(".workflow-step").forEach((step) => {
            step.classList.add("active");
        });

        renderRecords();
        showDetails(records[3]);
        renderAudit();
    }, 800);
}

document.getElementById("runButton").addEventListener("click", runDemo);

document.getElementById("resetButton").addEventListener("click", () => {
    location.reload();
});

document.querySelectorAll(".filter").forEach((button) => {
    button.addEventListener("click", () => {
        activeFilter = button.dataset.filter;

        document.querySelectorAll(".filter").forEach((filterButton) => {
            filterButton.classList.toggle("active", filterButton === button);
        });

        renderRecords();
    });
});

renderRecords();