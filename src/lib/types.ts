export type OrbitCategory = 'food' | 'travel' | 'gear' | 'fun' | 'health';

export const CATEGORIES: { id: OrbitCategory; label: string; emoji: string; color: string }[] = [
  { id: 'food', label: 'Food', emoji: '\uD83C\uDF55', color: '#FF6B6B' },
  { id: 'travel', label: 'Travel', emoji: '\u2708\uFE0F', color: '#4ECDC4' },
  { id: 'gear', label: 'Gear', emoji: '\u2699\uFE0F', color: '#45B7D1' },
  { id: 'fun', label: 'Fun', emoji: '\uD83C\uDFAE', color: '#96CEB4' },
  { id: 'health', label: 'Health', emoji: '\uD83D\uDC9A', color: '#FFEAA7' },
];

export interface Expense {
  id: string;
  amount: number;
  category: OrbitCategory;
  timestamp: number;
  x: number; // landing position in universe (0-1)
  y: number;
}

export type OrbitMode = 'slingshot' | 'gravity-well' | 'seal';

export interface GroupUser {
  id: string;
  name: string;
  balance: number; // positive = owed, negative = owes
  color: string;
}
