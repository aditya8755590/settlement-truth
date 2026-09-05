/**
 * Raw Synthetic Bank Credits Table
 * Source: Merchant bank statement (NEFT/RTGS credits from gateway)
 *
 * Rules:
 * - Every settlement produces exactly one bank credit at the settlement's netAmount.
 * - Every credit references its own settlement (UTR matches settlementId),
 *   so the engine can prove fund movement floor-to-floor.
 */

import { settlements } from "./settlements.js";

function addHours(isoDate, hours) {
  return new Date(
    new Date(isoDate).getTime() + hours * 60 * 60 * 1000
  ).toISOString();
}

function genBankCredits() {
  const credits = [];
  let seq = 1;

  for (const s of settlements) {
    credits.push({
      utr: `UTR-${String(90000 + seq).padStart(5, "0")}`,
      amount: s.netAmount,
      creditedAt: addHours(s.settlementDate, 6), // Credits arrive ~6h after settlement date
      reference: s.settlementId,                 // Matches settlementId → valid UTR link
      currency: "INR",
      bankAccount: "XXXX9781",
    });

    seq++;
  }

  return credits;
}

export const bankCredits = genBankCredits();
export default bankCredits;
