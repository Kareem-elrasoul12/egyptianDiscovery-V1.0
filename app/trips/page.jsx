import TripsExplorer from "../../src/components/trips-explorer";
import { getPublicDestinations, getPublicTrips } from "../../src/lib/data/public";

export const metadata = { title: "Trips · Egyptian Discovery" };

export default async function TripsPage({ searchParams }) {
  const params = await searchParams;
  const destinations = await getPublicDestinations();
  const trips = await getPublicTrips({destinationId: destinationsId(params?.place, destinations)});
  return <TripsExplorer trips={trips} initialQuery={params?.q || ""} initialPlace={params?.place || ""} />;
}

function destinationsId(slug, rows) { return slug ? rows.find(item => item.id === slug)?.dbId : undefined; }
