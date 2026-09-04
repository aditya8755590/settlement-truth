import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const OUTPUT_DIR = path.join(__dirname, "demo_data");
const NUM_NORMAL = 500;

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR);
}

// Data stores
const orders = [];
const payments = [];
const settlements = [];
const bankCredits = [];
const refunds = [];

// Helper to generate dates
const d = (daysOffset) => {
  const date = new Date("2026-09-01T10:00:00Z");
  date.setDate(date.getDate() + daysOffset);
  return date.toISOString();
};

// 1. Generate 500 clean flows
for (let i = 1; i <= NUM_NORMAL; i++) {
  const orderId = `ORD-NORM-${i}`;
  const payId = `PAY-NORM-${i}`;
  const stlId = `STL-NORM-${i}`;
  const utr = `UTR-NORM-${i}`;
  
  const amount = 1000 + (i % 100) * 10;
  const fee = Math.floor(amount * 0.02);
  const tax = Math.floor(fee * 0.18);
  const net = amount - fee - tax;

  orders.push(`${orderId},${amount},CUST-NORM-${i},${d(0)}`);
  payments.push(`${payId},${orderId},${amount},${fee},${tax},${d(0)}`);
  settlements.push(`${stlId},${payId},${net},${d(2)}`);
  bankCredits.push(`${utr},${stlId},${net},${d(3)}`);
}

// 2. Inject Anomaly: Orphaned Order (No payment)
orders.push(`ORD-ORPHAN-001,5000,CUST-ORPHAN,${d(0)}`);

// 3. Inject Anomaly: Duplicate Payment
orders.push(`ORD-DUPPAY-002,7500,CUST-DUP,${d(0)}`);
payments.push(`PAY-DUP-1,ORD-DUPPAY-002,7500,150,27,${d(0)}`);
payments.push(`PAY-DUP-2,ORD-DUPPAY-002,7500,150,27,${d(0)}`);
settlements.push(`STL-DUP,PAY-DUP-1,7323,${d(2)}`);
bankCredits.push(`UTR-DUP,STL-DUP,7323,${d(3)}`);

// 4. Inject Anomaly: Fee Creep Mismatch
// Expected net = 3000 - 60 - 10 = 2930. We will inject a net of 2800 (variance 130 > 25 tolerance)
orders.push(`ORD-FEECREEP-003,3000,CUST-FEE,${d(0)}`);
payments.push(`PAY-FEE,ORD-FEECREEP-003,3000,60,10,${d(0)}`);
settlements.push(`STL-FEE,PAY-FEE,2800,${d(2)}`); 
bankCredits.push(`UTR-FEE,STL-FEE,2800,${d(3)}`);

// 5. Inject Anomaly: Missing Bank Settlement
orders.push(`ORD-NOBANK-004,4200,CUST-NOBANK,${d(0)}`);
payments.push(`PAY-NOBANK,ORD-NOBANK-004,4200,84,15,${d(0)}`);
settlements.push(`STL-NOBANK,PAY-NOBANK,4101,${d(2)}`);
// Missing the bank credit row intentionally

// Build CSVs
const writeCsv = (filename, header, data) => {
  const content = header + "\n" + data.join("\n");
  fs.writeFileSync(path.join(OUTPUT_DIR, filename), content);
};

writeCsv("orders.csv", "order_id,amount,customer_id,created_at", orders);
writeCsv("payments.csv", "payment_id,order_id,captured_amount,fee,tax,captured_at", payments);
writeCsv("settlements.csv", "settlement_id,payment_ids,net_amount,settled_at", settlements);
writeCsv("bank_credits.csv", "utr,reference,amount,credit_date", bankCredits);
writeCsv("refunds.csv", "refund_id,order_id,customer_id,refund_amount,refund_created_at", refunds);

console.log(`\n✅ Successfully generated 504 records in ${OUTPUT_DIR}/`);
console.log(`\nDataset includes:
- 500 clean O(N) matched transactions
- 1 Orphaned Order (ORD-ORPHAN-001)
- 1 Duplicate Payment (ORD-DUPPAY-002)
- 1 Fee Creep Anomaly (ORD-FEECREEP-003)
- 1 Missing Bank Settlement (ORD-NOBANK-004)\n`);
