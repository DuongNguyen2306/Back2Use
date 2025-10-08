export interface RewardPoints {
  id: string;
  points: number;
  earnedFrom: string;
  createdAt: Date;
  description?: string;
}

export interface Voucher {
  id: string;
  code: string;
  name: string;
  description: string;
  discountPercent: number;
  requiredPoints: number;
  maxUsers: number;
  usedCount: number;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  category?: 'food' | 'beverage' | 'general' | 'premium' | 'eco';
  icon?: string;
}

export interface CustomerVoucher {
  id: string;
  voucherId: string;
  voucher: Voucher;
  code: string;
  status: 'available' | 'used' | 'expired';
  redeemedAt: Date;
  usedAt?: Date;
  expiresAt: Date;
}

export interface RewardsPanelProps {
  rewards: RewardPoints[];
  totalPoints: number;
  userRank?: number;
}
