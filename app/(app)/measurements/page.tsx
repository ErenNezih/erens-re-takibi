import { getMeasurements } from "@/lib/actions/measurements";
import { MeasurementsClient } from "@/components/measurements/measurements-client";

export default async function MeasurementsPage() {
  const measurements = await getMeasurements();
  return <MeasurementsClient measurements={measurements} />;
}
