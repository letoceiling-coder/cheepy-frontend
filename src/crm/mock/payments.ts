import { rnd, pick, date, firstNames, lastNames } from './helpers';

export interface PaymentMethod {
  id: string;
  name: string;
  type: 'card' | 'cod' | 'stripe' | 'tinkoff' | 'sber' | 'atol';
  active: boolean;
  commission: number;
}

export interface Transaction {
  id: string;
  userId: string;
  userName: string;
  amount: number;
  status: 'success' | 'failed' | 'refunded' | 'pending';
  type: 'payment' | 'refund' | 'payout';
  method: string;
  createdAt: string;
  orderId: string;
}

export interface PaymentStats {
  successful: number;
  failed: number;
  refunded: number;
  totalCommission: number;
  totalVolume: number;
}

export const paymentMethods: PaymentMethod[] = [
  { id: 'PM1', name: 'Банковская карта', type: 'card', active: true, commission: 2.5 },
  { id: 'PM2', name: 'Наложенный платеж', type: 'cod', active: true, commission: 0 },
  { id: 'PM3', name: 'Т-Банк', type: 'tinkoff', active: true, commission: 2.9 },
  { id: 'PM4', name: 'Сбер', type: 'sber', active: true, commission: 2.75 },
  { id: 'PM5', name: 'АТОЛ (чеки)', type: 'card', active: true, commission: 0 },
];

const txStatuses: Transaction['status'][] = ['success','success','success','success','failed','refunded','pending'];
const txTypes: Transaction['type'][] = ['payment','payment','payment','refund','payout'];

export const transactions: Transaction[] = Array.from({ length: 200 }, (_, i) => ({
  id: `TX-${String(i + 1).padStart(5, '0')}`,
  userId: `U${String(rnd(1, 200)).padStart(4, '0')}`,
  userName: `${firstNames[i % firstNames.length]} ${lastNames[i % lastNames.length]}`,
  amount: rnd(500, 50000),
  status: txStatuses[i % txStatuses.length],
  type: txTypes[i % txTypes.length],
  method: paymentMethods[i % paymentMethods.length].name,
  createdAt: date(rnd(0, 90)),
  orderId: `ORD-2025-${String(rnd(1, 500)).padStart(4, '0')}`,
}));

export const paymentStats: PaymentStats = {
  successful: transactions.filter(t => t.status === 'success').length,
  failed: transactions.filter(t => t.status === 'failed').length,
  refunded: transactions.filter(t => t.status === 'refunded').length,
  totalCommission: 342500,
  totalVolume: transactions.filter(t => t.status === 'success').reduce((s, t) => s + t.amount, 0),
};
