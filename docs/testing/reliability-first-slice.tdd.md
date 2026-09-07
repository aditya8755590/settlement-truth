# Reliability First Slice — TDD Evidence

Source: approved reliability-first implementation brief; no plan file was used.

## User journeys

1. As a finance operator, I need malformed monetary values rejected so reconciliation never treats bad evidence as zero.
2. As a finance operator, I need an unlinked settlement to remain unmatched even when dates are close.
3. As a finance operator, I need imported payment states preserved during reconciliation.
4. As a finance operator, I need the gateway-rate policy to reject ambiguous or implausible requests.

## Results

| Guarantee | Test | Result |
| --- | --- | --- |
| Invalid money is rejected instead of coerced to zero | `test/reliability.test.js` | PASS |
| A failed payment status is preserved | `test/reliability.test.js` | PASS |
| Date-only settlement matching cannot auto-match a payment | `test/reliability.test.js` | PASS |
| Gateway rates must be finite numbers from 0% to 20% | `test/reliability.test.js` | PASS |

RED evidence: `npm test` initially failed because the required reconciliation policy module did not exist.

GREEN evidence: `npm test` passed all four tests. `node --test --experimental-test-coverage test/reliability.test.js` passed all four tests; the focused suite reported 100% line coverage for `server/reconciliationPolicy.js` and 63.84% aggregate coverage for the exercised server modules. `npm run build` also completed successfully.

Known gap: this focused suite does not provide 80% coverage across the existing parser and engine; broader test coverage remains follow-up work.
