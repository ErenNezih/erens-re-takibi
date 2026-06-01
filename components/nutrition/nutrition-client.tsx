"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/use-toast";
import { createMeal, deleteMeal } from "@/lib/actions/nutrition";
import { toDateInputValue, today } from "@/lib/utils";
import type { MealLog, UserSetting } from "@prisma/client";

interface NutritionClientProps {
  meals: MealLog[];
  recentFoods: Pick<MealLog, "foodName" | "calories" | "protein" | "carbs" | "fat" | "amount">[];
  settings: UserSetting;
  date: string;
}

export function NutritionClient({ meals, recentFoods, settings, date }: NutritionClientProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const totals = meals.reduce(
    (acc, m) => ({
      calories: acc.calories + (m.calories ?? 0),
      protein: acc.protein + (m.protein ?? 0),
      carbs: acc.carbs + (m.carbs ?? 0),
      fat: acc.fat + (m.fat ?? 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  const calorieProgress = Math.min(
    (totals.calories / settings.calorieTargetMax) * 100,
    100
  );
  const proteinProgress = Math.min(
    (totals.protein / settings.proteinTarget) * 100,
    100
  );

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    formData.set("date", date);
    startTransition(async () => {
      await createMeal(formData);
      toast({ title: "Eklendi" });
      setOpen(false);
      router.refresh();
    });
  }

  function fillFromRecent(food: NutritionClientProps["recentFoods"][0]) {
    const form = document.getElementById("meal-form") as HTMLFormElement;
    if (!form) return;
    (form.elements.namedItem("foodName") as HTMLInputElement).value = food.foodName;
    (form.elements.namedItem("amount") as HTMLInputElement).value = food.amount ?? "";
    (form.elements.namedItem("calories") as HTMLInputElement).value = food.calories?.toString() ?? "";
    (form.elements.namedItem("protein") as HTMLInputElement).value = food.protein?.toString() ?? "";
    (form.elements.namedItem("carbs") as HTMLInputElement).value = food.carbs?.toString() ?? "";
    (form.elements.namedItem("fat") as HTMLInputElement).value = food.fat?.toString() ?? "";
    setOpen(true);
  }

  return (
    <>
      <PageHeader title="Beslenme" description="Günlük öğün ve makro takibi">
        <Input
          type="date"
          value={date}
          onChange={(e) => router.push(`/nutrition?date=${e.target.value}`)}
          className="w-auto"
        />
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Öğün Ekle
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Öğün Ekle</DialogTitle>
            </DialogHeader>
            <form id="meal-form" onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Öğün Adı</Label>
                  <Input name="mealName" placeholder="Kahvaltı" required />
                </div>
                <div className="space-y-1">
                  <Label>Saat</Label>
                  <Input name="time" type="time" />
                </div>
              </div>
              <div className="space-y-1">
                <Label>Besin Adı</Label>
                <Input name="foodName" required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Miktar</Label>
                  <Input name="amount" placeholder="200g" />
                </div>
                <div className="space-y-1">
                  <Label>Kalori</Label>
                  <Input name="calories" type="number" />
                </div>
                <div className="space-y-1">
                  <Label>Protein (g)</Label>
                  <Input name="protein" type="number" />
                </div>
                <div className="space-y-1">
                  <Label>Karbonhidrat (g)</Label>
                  <Input name="carbs" type="number" />
                </div>
                <div className="space-y-1">
                  <Label>Yağ (g)</Label>
                  <Input name="fat" type="number" />
                </div>
              </div>
              <div className="space-y-1">
                <Label>Not</Label>
                <Textarea name="notes" rows={2} />
              </div>
              <Button type="submit" disabled={isPending} className="w-full">Kaydet</Button>
            </form>
          </DialogContent>
        </Dialog>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center justify-between">
              Kalori
              <Badge variant={totals.calories >= settings.calorieTargetMin && totals.calories <= settings.calorieTargetMax ? "success" : "warning"}>
                {totals.calories} / {settings.calorieTargetMin}-{settings.calorieTargetMax}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={calorieProgress} className="h-3" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center justify-between">
              Protein
              <Badge variant={totals.protein >= settings.proteinTarget ? "success" : "warning"}>
                {totals.protein}g / {settings.proteinTarget}g
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={proteinProgress} className="h-3" />
          </CardContent>
        </Card>
      </div>

      {recentFoods.length > 0 && (
        <Card className="mb-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Son Kullanılan Besinler</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {recentFoods.slice(0, 10).map((food) => (
              <Button key={food.foodName} variant="outline" size="sm" onClick={() => fillFromRecent(food)}>
                {food.foodName}
              </Button>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Bugünkü Öğünler — K: {totals.calories} | P: {totals.protein}g | KH: {totals.carbs}g | Y: {totals.fat}g
          </CardTitle>
        </CardHeader>
        <CardContent>
          {meals.length === 0 ? (
            <p className="text-muted-foreground text-sm py-4 text-center">Henüz öğün kaydı yok</p>
          ) : (
            <div className="space-y-2">
              {meals.map((meal) => (
                <div key={meal.id} className="flex items-center justify-between p-3 rounded-lg border border-border">
                  <div>
                    <p className="font-medium">{meal.foodName}</p>
                    <p className="text-xs text-muted-foreground">
                      {meal.mealName} {meal.time && `• ${meal.time}`} • {meal.calories ?? 0} kcal
                      {meal.protein != null && ` • P: ${meal.protein}g`}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      startTransition(async () => {
                        await deleteMeal(meal.id);
                        router.refresh();
                      });
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
