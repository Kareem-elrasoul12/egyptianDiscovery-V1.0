import {getPublicGallery} from "../../src/lib/data/public";
import GalleryGrid from "../../src/components/gallery-grid";
export const metadata={title:"Field gallery · Egyptian Discovery"};
export default async function GalleryPage(){const items=await getPublicGallery(24);return <main className="listing-page"><div className="page-intro"><p className="eyebrow">OUT THERE, TOGETHER <i/></p><h1>Notes from the field.</h1><p>Moments from trips shared by the travel team and our community.</p></div>{items.length?<GalleryGrid items={items}/>:<div className="setup-notice wide-notice"><strong>The field gallery is ready for trip photos.</strong><p>Gallery photos appear after the team uploads and approves them. No stock photos are presented as past customer trips.</p></div>}</main>}
