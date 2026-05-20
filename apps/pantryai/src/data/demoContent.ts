import type { DetectedItem, MealPlan, ShoppingItem } from '../lib/types';

export const DEMO_DETECTED_ITEMS: DetectedItem[] = [
  { id: '1', name: 'Chicken breast', confidence: 0.94, category: 'protein', userConfirmed: true },
  { id: '2', name: 'Whole milk', confidence: 0.97, category: 'dairy', userConfirmed: true },
  { id: '3', name: 'Broccoli', confidence: 0.91, category: 'produce', userConfirmed: true },
  { id: '4', name: 'Cheddar cheese', confidence: 0.88, category: 'dairy', userConfirmed: true },
  { id: '5', name: 'Eggs ×6', confidence: 0.96, category: 'protein', userConfirmed: true },
  { id: '6', name: 'Greek yogurt', confidence: 0.89, category: 'dairy', userConfirmed: true },
  { id: '7', name: 'Bell peppers', confidence: 0.92, category: 'produce', userConfirmed: true },
  { id: '8', name: 'Baby spinach', confidence: 0.85, category: 'produce', userConfirmed: true },
  { id: '9', name: 'Penne pasta', confidence: 0.87, category: 'grains', userConfirmed: true },
  { id: '10', name: 'Olive oil', confidence: 0.93, category: 'condiments', userConfirmed: true },
  { id: '11', name: 'Garlic', confidence: 0.79, category: 'produce', userConfirmed: true },
  { id: '12', name: 'Tomato sauce', confidence: 0.91, category: 'condiments', userConfirmed: true },
];

export const DEMO_MEAL_PLAN: MealPlan = {
  id: 'demo-plan-1',
  scanId: 'demo-scan-1',
  weekOf: '2026-05-18',
  meals: [
    {
      day: 'Monday',
      breakfast: {
        name: 'Greek Yogurt & Berry Bowl',
        ingredients: ['Greek yogurt', 'honey', '1/2 cup blueberries'],
        prepTimeMinutes: 5,
        instructions: 'Spoon yogurt into a bowl, drizzle with honey, and top with berries.',
      },
      lunch: {
        name: 'Chicken & Spinach Wrap',
        ingredients: ['Chicken breast', 'baby spinach', 'bell peppers', 'olive oil', 'salt'],
        prepTimeMinutes: 15,
        instructions:
          'Slice grilled chicken, toss with spinach and peppers in a wrap. Drizzle olive oil.',
      },
      dinner: {
        name: 'Pasta Primavera',
        ingredients: ['Penne pasta', 'broccoli', 'tomato sauce', 'garlic', 'olive oil', 'cheddar'],
        prepTimeMinutes: 25,
        instructions:
          'Cook pasta al dente. Sauté minced garlic and broccoli florets in olive oil until tender. Toss with tomato sauce and top with shredded cheddar.',
      },
    },
    {
      day: 'Tuesday',
      breakfast: {
        name: 'Scrambled Eggs & Spinach',
        ingredients: ['Eggs ×2', 'baby spinach', 'olive oil', 'salt & pepper'],
        prepTimeMinutes: 8,
        instructions:
          'Whisk eggs, pour into oiled pan on medium heat. Fold in spinach until eggs are just set.',
      },
      lunch: {
        name: 'Broccoli Cheddar Soup',
        ingredients: ['Broccoli', 'whole milk', 'cheddar cheese', 'garlic', 'olive oil'],
        prepTimeMinutes: 20,
        instructions:
          'Sauté garlic, add broccoli and milk, simmer 10 min, blend half the mixture for creamy texture, stir in cheddar.',
      },
      dinner: {
        name: 'Stuffed Bell Peppers',
        ingredients: ['Bell peppers ×2', 'chicken breast', 'tomato sauce', 'cheddar cheese'],
        prepTimeMinutes: 35,
        instructions:
          'Halve peppers, fill with cooked diced chicken and tomato sauce. Top with cheddar and bake 25 min at 200°C.',
      },
    },
    {
      day: 'Wednesday',
      breakfast: {
        name: 'Cheese & Egg Toast',
        ingredients: ['Eggs ×2', 'cheddar cheese', 'whole milk'],
        prepTimeMinutes: 10,
        instructions:
          'Make a cheesy omelette with whisked eggs, a splash of milk, and melted cheddar.',
      },
      lunch: {
        name: 'Pasta Salad',
        ingredients: ['Penne pasta', 'bell peppers', 'olive oil', 'garlic'],
        prepTimeMinutes: 15,
        instructions:
          'Cook pasta, cool, toss with diced peppers, minced garlic, and olive oil. Season to taste.',
      },
      dinner: {
        name: 'Garlic Chicken with Broccoli',
        ingredients: ['Chicken breast', 'broccoli', 'garlic', 'olive oil'],
        prepTimeMinutes: 25,
        instructions:
          'Sear chicken breast in olive oil with garlic until golden. Steam broccoli and serve alongside.',
      },
    },
    {
      day: 'Thursday',
      breakfast: {
        name: 'Yogurt & Granola',
        ingredients: ['Greek yogurt', 'granola (pantry)'],
        prepTimeMinutes: 3,
        instructions: 'Layer yogurt and granola in a bowl. Simple and quick.',
      },
      lunch: {
        name: 'Spinach & Egg Frittata',
        ingredients: ['Eggs ×3', 'baby spinach', 'cheddar cheese', 'olive oil'],
        prepTimeMinutes: 20,
        instructions:
          'Whisk eggs with salt, pour over sautéed spinach in oven-safe pan, top with cheddar, bake 10 min at 180°C.',
      },
      dinner: {
        name: 'Tomato Pasta with Chicken',
        ingredients: ['Penne pasta', 'chicken breast', 'tomato sauce', 'garlic', 'olive oil'],
        prepTimeMinutes: 30,
        instructions:
          'Brown diced chicken with garlic, add tomato sauce, simmer 10 min. Toss with al-dente pasta.',
      },
    },
    {
      day: 'Friday',
      breakfast: {
        name: 'Veggie Omelette',
        ingredients: ['Eggs ×2', 'bell peppers', 'baby spinach', 'olive oil'],
        prepTimeMinutes: 10,
        instructions:
          'Dice peppers and sauté briefly. Pour in whisked eggs, add spinach, fold when set.',
      },
      lunch: {
        name: 'Cheesy Broccoli Pasta',
        ingredients: ['Penne pasta', 'broccoli', 'cheddar cheese', 'whole milk', 'garlic'],
        prepTimeMinutes: 20,
        instructions:
          'Make a quick cheese sauce with milk and cheddar. Toss with cooked pasta and broccoli.',
      },
      dinner: {
        name: 'Chicken & Pepper Stir-fry',
        ingredients: ['Chicken breast', 'bell peppers', 'garlic', 'olive oil', 'tomato sauce'],
        prepTimeMinutes: 20,
        instructions:
          'Slice chicken thin, stir-fry with peppers and garlic. Add tomato sauce for final 2 min.',
      },
    },
    {
      day: 'Saturday',
      breakfast: {
        name: 'Fluffy Scrambled Eggs',
        ingredients: ['Eggs ×3', 'whole milk', 'cheddar cheese', 'olive oil'],
        prepTimeMinutes: 10,
        instructions:
          'Whisk eggs with milk, cook slowly on low heat, fold in cheddar just before serving.',
      },
      lunch: {
        name: 'Spinach Pasta Soup',
        ingredients: ['Penne pasta', 'baby spinach', 'tomato sauce', 'garlic'],
        prepTimeMinutes: 15,
        instructions:
          'Simmer tomato sauce with garlic and 2 cups water. Add pasta and spinach, cook until tender.',
      },
      dinner: {
        name: 'Roasted Chicken & Veg',
        ingredients: ['Chicken breast', 'broccoli', 'bell peppers', 'garlic', 'olive oil'],
        prepTimeMinutes: 40,
        instructions:
          'Toss chicken and veg with olive oil and garlic. Roast at 200°C for 30–35 min until golden.',
      },
    },
    {
      day: 'Sunday',
      breakfast: {
        name: 'Yogurt Smoothie Bowl',
        ingredients: ['Greek yogurt', 'whole milk', 'honey'],
        prepTimeMinutes: 5,
        instructions:
          'Blend yogurt with a splash of milk until smooth. Top with a drizzle of honey.',
      },
      lunch: {
        name: 'Cheese Omelette',
        ingredients: ['Eggs ×3', 'cheddar cheese', 'baby spinach', 'olive oil'],
        prepTimeMinutes: 12,
        instructions:
          'Cook a classic omelette, stuff with cheese and spinach, fold and serve.',
      },
      dinner: {
        name: 'Sunday Pasta Bake',
        ingredients: ['Penne pasta', 'chicken breast', 'tomato sauce', 'cheddar cheese', 'broccoli'],
        prepTimeMinutes: 45,
        instructions:
          'Combine cooked pasta, diced chicken, broccoli, and tomato sauce in a baking dish. Top with cheddar, bake 20 min at 190°C until bubbling.',
      },
    },
  ],
};

export const DEMO_SHOPPING_ITEMS: ShoppingItem[] = [
  { id: 's1', name: 'Blueberries', quantity: '1 punnet', category: 'produce', checked: false },
  { id: 's2', name: 'Honey', quantity: '1 jar', category: 'condiments', checked: false },
  { id: 's3', name: 'Granola', quantity: '1 bag', category: 'grains', checked: false },
  { id: 's4', name: 'Salt & pepper', quantity: 'as needed', category: 'condiments', checked: false },
  { id: 's5', name: 'Lemons ×2', quantity: '2', category: 'produce', checked: false },
  { id: 's6', name: 'Cherry tomatoes', quantity: '1 cup', category: 'produce', checked: false },
];

export const CATEGORY_EMOJI: Record<string, string> = {
  produce: '🥦',
  protein: '🍗',
  dairy: '🥛',
  grains: '🌾',
  condiments: '🫙',
  beverages: '🧃',
  other: '📦',
};

export const DIETARY_PREF_LABELS: Record<string, string> = {
  none: 'No restrictions',
  vegetarian: 'Vegetarian',
  vegan: 'Vegan',
};

export const DIETARY_PREF_DESCRIPTIONS: Record<string, string> = {
  none: 'I eat everything — chicken, fish, dairy, eggs.',
  vegetarian: 'No meat or fish. Dairy and eggs are fine.',
  vegan: 'Plant-based only — no animal products.',
};
