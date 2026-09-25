import { HomeClient } from "@/components/site/home-client";
import { getHomeData } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function Page() {
  const data = await getHomeData();
  return <HomeClient data={data} />;
}
