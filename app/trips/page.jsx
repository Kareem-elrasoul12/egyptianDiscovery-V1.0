import TripsExplorer from "../../src/components/trips-explorer";
import { getPublicTrips } from "../../src/lib/data/public";

export const metadata = { title: "Trips · Egyptian Discovery" };

export default async function TripsPage() {
  const trips = await getPublicTrips();
  return <TripsExplorer trips={trips} />;
}
