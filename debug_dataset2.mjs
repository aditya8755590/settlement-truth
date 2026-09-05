import { parseCSVStream, buildDataset } from './server/csvParser.js';

const [ordersResult, paymentsResult, settlementsResult, bankCreditsResult] = await Promise.all([
  parseCSVStream('demo_data/orders.csv', 'orders.csv'),
  parseCSVStream('demo_data/payments.csv', 'payments.csv'),
  parseCSVStream('demo_data/settlements.csv', 'settlements.csv'),
  parseCSVStream('demo_data/bank_credits.csv', 'bank_credits.csv'),
]);

const dataset = buildDataset({orders: ordersResult, payments: paymentsResult, settlements: settlementsResult, bankCredits: bankCreditsResult});

// Check DUP payments  
const dupPayments = dataset.payments.filter(p => p.orderId === 'ORD-DUPPAY-002');
console.log('DUP payments count:', dupPayments.length);
console.log('DUP payments:', JSON.stringify(dupPayments));

// Check ORPHAN  
const orphanPayments = dataset.payments.filter(p => p.orderId === 'ORD-ORPHAN-001');
console.log('ORPHAN payments count:', orphanPayments.length);

// Now run engine
import { runReconciliation } from './server/engine.js';
const result = await runReconciliation(dataset, true, { gatewayRate: 0.0236, gstRate: 0.18 });
console.log('\nMetrics:', JSON.stringify(result.metrics));
const exceptions = result.records.filter(r => r.status === 'Anomaly');
console.log('\nExceptions count:', exceptions.length);
exceptions.forEach(r => console.log(`  ${r.id}: ${r.title}`));
