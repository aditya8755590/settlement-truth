import React from "react";

export default function TruthTestTraps() {
  return (
    <section className="truth-test">
      <div className="truth-heading">
        <p className="eyebrow">THE DIFFERENTIATOR</p>
        <h2>
          We test whether the agent knows when it is <em>wrong.</em>
        </h2>
        <p>
          A generic assistant can see a similar amount and date and declare a
          match. Settlement Truth is deliberately tested against financial
          near-misses. One failed proof is enough to stop an automatic decision.
        </p>
      </div>

      <div className="trap-grid">
        <article className="trap-card">
          <span className="trap-number">TRAP 01</span>
          <h3>
            Same amount.
            <br />
            Wrong UTR.
          </h3>
          <p>
            Amount and date agree, but the bank reference belongs to another
            payment.
          </p>
          <div className="trap-result">
            <span>Unsafe shortcut</span>
            <b>“Looks matched”</b>
          </div>
          <div className="trap-result safe-result">
            <span>Settlement Truth</span>
            <b>Blocks + escalates</b>
          </div>
        </article>

        <article className="trap-card">
          <span className="trap-number">TRAP 02</span>
          <h3>
            Captured.
            <br />
            Never settled.
          </h3>
          <p>
            The gateway saw success, but the expected settlement window has
            expired.
          </p>
          <div className="trap-result">
            <span>Unsafe shortcut</span>
            <b>“Payment complete”</b>
          </div>
          <div className="trap-result safe-result">
            <span>Settlement Truth</span>
            <b>Missing-credit case</b>
          </div>
        </article>

        <article className="trap-card">
          <span className="trap-number">TRAP 03</span>
          <h3>
            One request.
            <br />
            Two refunds.
          </h3>
          <p>
            Two refund events reference one payment, with only one customer
            request.
          </p>
          <div className="trap-result">
            <span>Unsafe shortcut</span>
            <b>“Both refunds valid”</b>
          </div>
          <div className="trap-result safe-result">
            <span>Settlement Truth</span>
            <b>Freezes automation</b>
          </div>
        </article>

        <article className="trap-card">
          <span className="trap-number">TRAP 04</span>
          <h3>
            Right order.
            <br />
            Partial capture.
          </h3>
          <p>
            The order and payment reference agree, but only half the value was
            captured.
          </p>
          <div className="trap-result">
            <span>Unsafe shortcut</span>
            <b>“Order paid”</b>
          </div>
          <div className="trap-result safe-result">
            <span>Settlement Truth</span>
            <b>Requires proof</b>
          </div>
        </article>
      </div>
    </section>
  );
}
