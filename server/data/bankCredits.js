/**
 * Raw Synthetic Bank Credits Table
 * Source: Merchant bank statement (NEFT/RTGS credits from gateway)
 *
 * Rules:
 * - Every settlement produces one bank credit at the settlement's netAmount.
 * - One bank credit has a WRONG UTR reference — it points to a different
 *   settlement (tests the "same amount, wrong UTR" trap TRAP-01).
 * - Settlements excluded from the missing-settlement list have no bank credit.
 */

import { settlements } from "./settlements.js";

// The settlement that will have a UTR mismatch (references wrong settlement)
const UTR_MISMATCH_SETTLEMENT = "setl_001";
const WRONG_REFERENCE = "setl_099"; // Points to a non-existent / wrong settlement

function addHours(isoDate, hours) {
  return new Date(
    new Date(isoDate).getTime() + hours * 60 * 60 * 1000
  ).toISOString();
}

function genBankCredits() {
  const credits = [];
  let seq = 1;

  for (const s of settlements) {
    // Inject UTR mismatch for TRAP-01
    const reference =
      s.settlementId === UTR_MISMATCH_SETTLEMENT
        ? WRONG_REFERENCE
        : s.settlementId;

    credits.push({
      utr: `UTR-${String(90000 + seq).padStart(5, "0")}`,
      amount: s.netAmount,
      creditedAt: addHours(s.settlementDate, 6), // Credits arrive ~6h after settlement date
      reference,                                  // Should match settlementId for a valid link
      currency: "INR",
      bankAccount: "XXXX9781",
    });

    seq++;
  }

  return credits;
}

export const bankCredits = genBankCredits();
export default bankCredits;
