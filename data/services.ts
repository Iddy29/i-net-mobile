import { ServiceIconType } from '@/components/ServiceIcon';

export interface Service {
  id: string;
  name: string;
  category: 'Streaming' | 'AI' | 'Trading' | 'Internet';
  description: string;
  price: number;
  duration: string;
  features: string[];
  iconType: ServiceIconType;
  color: string;
}

export const services: Service[] = [
  {
    id: '1',
    name: 'Netflix Premium',
    category: 'Streaming',
    description: '4K UHD, 4 Screens',
    price: 12.99,
    duration: '1-Month',
    features: ['4K Ultra HD', '4 Screens Simultaneously', 'Download Content', 'No Ads'],
    iconType: 'netflix',
    color: '#E50914',
  },
  {
    id: '2',
    name: 'ChatGPT Plus',
    category: 'AI',
    description: 'GPT-4 Access, Priority',
    price: 20.00,
    duration: '1-Month',
    features: ['GPT-4 Access', 'Priority Response', 'Faster Performance', 'Early Features'],
    iconType: 'chatgpt',
    color: '#10A37F',
  },
  {
    id: '3',
    name: 'Spotify Premium',
    category: 'Streaming',
    description: 'Ad-Free, Offline Mode',
    price: 9.99,
    duration: '1-Month',
    features: ['Ad-Free Music', 'Offline Downloads', 'High Quality Audio', 'Unlimited Skips'],
    iconType: 'spotify',
    color: '#1DB954',
  },
  {
    id: '4',
    name: 'TradingView Pro',
    category: 'Trading',
    description: 'Advanced Charts, Alerts',
    price: 14.95,
    duration: '1-Month',
    features: ['Multiple Charts', 'Advanced Alerts', 'Custom Indicators', 'Volume Profile'],
    iconType: 'tradingview',
    color: '#2962FF',
  },
  {
    id: '5',
    name: 'Data Bundle 50GB',
    category: 'Internet',
    description: 'High-Speed 5G Data',
    price: 29.99,
    duration: '1-Month',
    features: ['50GB High-Speed', '5G Compatible', 'No Throttling', 'Rollover Data'],
    iconType: 'data-bundle',
    color: '#8B5CF6',
  },
  {
    id: '6',
    name: 'Disney+ Premium',
    category: 'Streaming',
    description: '4K UHD, 4 Devices',
    price: 10.99,
    duration: '1-Month',
    features: ['4K Quality', 'Star Content', 'Download Content', '4 Devices'],
    iconType: 'disney',
    color: '#113CCF',
  },
  {
    id: '7',
    name: 'Midjourney Pro',
    category: 'AI',
    description: 'Unlimited Generations',
    price: 30.00,
    duration: '1-Month',
    features: ['Unlimited Fast', 'Commercial Use', 'Stealth Mode', 'Priority Queue'],
    iconType: 'midjourney',
    color: '#FF6F61',
  },
  {
    id: '8',
    name: 'Data Bundle 100GB',
    category: 'Internet',
    description: 'Ultra High-Speed 5G',
    price: 49.99,
    duration: '1-Month',
    features: ['100GB High-Speed', '5G Priority', 'Unlimited 3G', 'Hotspot Support'],
    iconType: 'data-bundle-large',
    color: '#EC4899',
  },
];

export type OrderStatus = 'Delivering' | 'Active' | 'Expired';

export interface Order {
  id: string;
  service: Service;
  purchaseDate: Date;
  status: OrderStatus;
  credentials?: {
    username?: string;
    password?: string;
    accountDetails?: string;
  };
}
