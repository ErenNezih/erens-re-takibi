import { getMeals, getRecentFoods } from "@/lib/actions/nutrition";
import { getSettings } from "@/lib/db";
import { toDateInputValue, today } from "@/lib/utils";
import { NutritionClient } from "@/components/nutrition/nutrition-client";

interface NutritionPageProps {
  searchParams: Promise<{ date?: string }>;
}

export default async function NutritionPage({ searchParams }: NutritionPageProps) {
  const params = await searchParams;
  const date = params.date ?? toDateInputValue(today());
  const [meals, recentFoods, settings] = await Promise.all([
    getMeals(date),
    getRecentFoods(),
    getSettings(),
  ]);

  return (
    <NutritionClient
      meals={meals}
      recentFoods={recentFoods}
      settings={settings}
      date={date}
    />
  );
}
