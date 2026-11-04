import {getPublicProducts} from "../../src/lib/data/public";
import ShopCatalog from "../../src/components/shop-catalog";

export const metadata={title:"Field shop · Egyptian Discovery"};
export default async function ShopPage(){const products=await getPublicProducts();return <ShopCatalog products={products}/>;}
