import { getPublicGallery } from "../../src/lib/data/public";
import GalleryPageContent from "../../src/components/gallery-page";

export const metadata = { title: "Field gallery · Egyptian Discovery" };

export default async function GalleryPage() {
  const items = await getPublicGallery(24);
  return <GalleryPageContent items={items} />;
}
