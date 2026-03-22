export interface Integration {
  id: string;
  name: string;
  category: 'payments' | 'delivery' | 'crm' | 'erp';
  icon: string;
  status: 'connected' | 'disconnected';
  apiKey: string;
  webhookUrl: string;
  lastSync: string;
  description: string;
}

export const integrations: Integration[] = [
  { id: 'INT4', name: 'СДЭК', category: 'delivery', icon: '📦', status: 'connected', apiKey: 'cdek_***_8f3a', webhookUrl: 'https://api.cheepy.ru/webhooks/cdek', lastSync: '2025-02-28', description: 'Доставка по России и СНГ' },
  { id: 'INT5', name: 'Новая Почта', category: 'delivery', icon: '📨', status: 'disconnected', apiKey: '', webhookUrl: '', lastSync: '-', description: 'Украинская служба доставки' },
  { id: 'INT6', name: 'DHL', category: 'delivery', icon: '🚀', status: 'disconnected', apiKey: '', webhookUrl: '', lastSync: '-', description: 'Международная доставка' },
  { id: 'INT7', name: 'Bitrix24', category: 'crm', icon: '🔷', status: 'connected', apiKey: 'bx24_***_1c9d', webhookUrl: 'https://api.cheepy.ru/webhooks/bitrix', lastSync: '2025-02-27', description: 'CRM и управление продажами' },
  { id: 'INT8', name: 'HubSpot', category: 'crm', icon: '🟠', status: 'disconnected', apiKey: '', webhookUrl: '', lastSync: '-', description: 'Marketing & Sales CRM' },
  { id: 'INT9', name: '1C', category: 'erp', icon: '🟡', status: 'connected', apiKey: '1c_***_7e5b', webhookUrl: 'https://api.cheepy.ru/webhooks/1c', lastSync: '2025-02-28', description: 'Учётная система и складской учёт' },
  { id: 'INT10', name: 'SAP', category: 'erp', icon: '🔵', status: 'disconnected', apiKey: '', webhookUrl: '', lastSync: '-', description: 'Enterprise Resource Planning' },
];
