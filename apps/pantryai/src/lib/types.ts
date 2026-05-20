export type DietaryPref = 'none' | 'vegetarian' | 'vegan';

export type IngredientCategory =
  | 'produce'
  | 'protein'
  | 'dairy'
  | 'grains'
  | 'condiments'
  | 'beverages'
  | 'other';

export interface DetectedItem {
  id: string;
  name: string;
  confidence: number;
  category: IngredientCategory;
  userConfirmed: boolean;
}

export interface RecipeRef {
  name: string;
  ingredients: string[];
  prepTimeMinutes: number;
  instructions: string;
}

export interface DayMeals {
  day: string;
  breakfast: RecipeRef;
  lunch: RecipeRef;
  dinner: RecipeRef;
}

export interface MealPlan {
  id: string;
  scanId: string;
  weekOf: string;
  meals: DayMeals[];
  createdAt?: unknown;
}

export interface ShoppingItem {
  id: string;
  name: string;
  quantity: string;
  category: IngredientCategory;
  checked: boolean;
}

export interface ShoppingList {
  id: string;
  planId: string;
  items: ShoppingItem[];
  createdAt?: unknown;
}

export interface PantryScan {
  id: string;
  status: 'processing' | 'done' | 'failed';
  detectedItems: DetectedItem[];
  createdAt?: unknown;
}

export interface UserProfile {
  name: string;
  email: string;
  dietaryPref: DietaryPref;
  createdAt?: unknown;
}

export interface UserSubscription {
  tier: 'free' | 'premium';
  scansThisMonth: number;
  periodResetAt?: unknown;
}
