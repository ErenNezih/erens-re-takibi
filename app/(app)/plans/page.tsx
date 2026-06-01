import { PlansClient } from "@/components/plans-client";
import { getPlans } from "@/lib/actions/plans";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WorkoutTemplateManager } from "@/components/workout-plans-tab";
import { getAllTemplates } from "@/lib/workout";
import { PLAN_TYPES } from "@/lib/tasks";

interface PlansPageProps {
  searchParams: Promise<{ tab?: string }>;
}

export default async function PlansPage({ searchParams }: PlansPageProps) {
  const params = await searchParams;
  const tab = params.tab ?? PLAN_TYPES.DIET;
  const [plans, templates] = await Promise.all([getPlans(), getAllTemplates()]);

  return (
    <div>
      <Tabs defaultValue={tab}>
        <TabsList className="w-full grid grid-cols-5 h-auto">
          <TabsTrigger value={PLAN_TYPES.DIET} className="text-xs px-1">Diyet</TabsTrigger>
          <TabsTrigger value={PLAN_TYPES.SUPPLEMENT} className="text-xs px-1">Supp.</TabsTrigger>
          <TabsTrigger value={PLAN_TYPES.CYCLE} className="text-xs px-1">Kür</TabsTrigger>
          <TabsTrigger value={PLAN_TYPES.BLOODWORK} className="text-xs px-1">Kan</TabsTrigger>
          <TabsTrigger value="WORKOUT" className="text-xs px-1">Antren.</TabsTrigger>
        </TabsList>

        <TabsContent value={PLAN_TYPES.DIET} className="mt-4">
          <PlansClient plans={plans} activeTab={PLAN_TYPES.DIET} />
        </TabsContent>
        <TabsContent value={PLAN_TYPES.SUPPLEMENT} className="mt-4">
          <PlansClient plans={plans} activeTab={PLAN_TYPES.SUPPLEMENT} />
        </TabsContent>
        <TabsContent value={PLAN_TYPES.CYCLE} className="mt-4">
          <PlansClient plans={plans} activeTab={PLAN_TYPES.CYCLE} />
        </TabsContent>
        <TabsContent value={PLAN_TYPES.BLOODWORK} className="mt-4">
          <PlansClient plans={plans} activeTab={PLAN_TYPES.BLOODWORK} />
        </TabsContent>
        <TabsContent value="WORKOUT" className="mt-4">
          <WorkoutTemplateManager templates={templates} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
