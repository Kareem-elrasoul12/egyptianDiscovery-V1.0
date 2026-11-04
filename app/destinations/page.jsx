import DestinationsBrowser from "../../src/components/destinations-browser";
import { getPublicDestinations } from "../../src/lib/data/public";

export const metadata = { title: "Destinations · Egyptian Discovery" };

export default async function DestinationsPage() {
  const liveDestinations = await getPublicDestinations();
  return <DestinationsBrowser liveDestinations={liveDestinations}/>;
}
