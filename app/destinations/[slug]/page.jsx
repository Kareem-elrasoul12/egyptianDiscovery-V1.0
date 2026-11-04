import DestinationDetailClient from "../../../src/components/destination-detail-client";
import { getPublicDestinations, getPublicTrips } from "../../../src/lib/data/public";
import { isDemoMode, isSupabaseConfigured } from "../../../src/lib/supabase/config";
import { notFound } from "next/navigation";

export default async function DestinationPage({ params }) {
  const { slug } = await params;
  if (!isSupabaseConfigured()) { if(isDemoMode()) return <DestinationDetailClient slug={slug}/>; notFound(); }
  const [destinations, trips] = await Promise.all([getPublicDestinations(), getPublicTrips()]);
  const destination = destinations.find((item) => item.id === slug || item.slug === slug);
  if (!destination) notFound();
  const related = trips.filter((trip) => trip.destination_id === destination.dbId);
  return <DestinationDetailClient slug={slug} liveDestination={destination} liveTrips={related}/>;
}
