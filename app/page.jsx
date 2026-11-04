import HomePage from "../src/components/home-page";
import { getPublicDestinations, getPublicProducts, getPublicReviews, getPublicTrips } from "../src/lib/data/public";

export default async function Page() {
  const [destinations, trips, products, reviews] = await Promise.all([
    getPublicDestinations(), getPublicTrips({ limit: 3 }), getPublicProducts({ limit: 3 }), getPublicReviews(1),
  ]);
  return <HomePage destinations={destinations} trips={trips} products={products} reviews={reviews}/>;
}
