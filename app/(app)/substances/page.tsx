import { getSubstances } from "@/lib/actions/substances";
import { SubstancesClient } from "@/components/substances/substances-client";

export default async function SubstancesPage() {
  const substances = await getSubstances();
  return <SubstancesClient substances={substances} />;
}
