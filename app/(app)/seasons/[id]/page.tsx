import { notFound } from "next/navigation";
import { SeasonDetailClient } from "@/components/season-detail-client";
import { getSeasonReport } from "@/lib/season-report";

interface SeasonDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function SeasonDetailPage({ params }: SeasonDetailPageProps) {
  const { id } = await params;
  const report = await getSeasonReport(id);
  if (!report) notFound();

  return <SeasonDetailClient report={report} />;
}
