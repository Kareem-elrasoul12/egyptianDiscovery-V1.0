import { getPublicLeaderboard, getPublicReviews } from "../../src/lib/data/public";
import CommunityPageContent from "../../src/components/community-page";

export const metadata = { title: "Community · Egyptian Discovery" };

export default async function CommunityPage() {
  const [members, reviews] = await Promise.all([getPublicLeaderboard(12), getPublicReviews(8)]);
  return <CommunityPageContent members={members} reviews={reviews} />;
}
