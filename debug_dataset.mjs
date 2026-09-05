import { parseCSVStream, buildDataset } from './server/csvParser.js';

const [ordersResult, paymentsResult, settlementsResult, bankCreditsResult] = await Promise.all([
  parseCSVStream('demo_data/orders.csv', 'orders.csv'),
  parseCSVStream('demo_data/payments.csv', 'payments.csv'),
  parseCSVStream('demo_data/settlements.csv', 'settlements.csv'),
  parseCSVStream('demo_data/bank_credits.csv', 'bank_credits.csv'),
]);

const dataset = buildDataset({orders: ordersResult, payments: paymentsResult, settlements: settlementsResult, bankCredits: bankCreditsResult});

console.log('Orders count:', dataset.orders.length);
console.log('Payments count:', dataset.payments.length);
console.log('Settlements count:', dataset.settlements.length);
console.log('BankCredits count:', dataset.bankCredits.length);
console.log('First payment:', JSON.stringify(dataset.payments[0]));
console.log('DUP payment:', JSON.stringify(dataset.payments.find(p => p.orderId === 'ORD-DUPPAY-002')));
console.log('First settlement:', JSON.stringify(dataset.settlements[0]));
console.log('First bankCredit:', JSON.stringify(dataset.bankCredits[0]));
