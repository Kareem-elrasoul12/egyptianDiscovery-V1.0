import {notFound} from "next/navigation";
import {getPublicProducts} from "../../../src/lib/data/public";
import ProductDetailClient from "../../../src/components/product-detail-client";
import DemoProductPage from "../../../src/components/demo-product-page";
import {isDemoMode,isSupabaseConfigured} from "../../../src/lib/supabase/config";
export default async function ProductPage({params}){const {slug}=await params;if(!isSupabaseConfigured()){if(isDemoMode())return <DemoProductPage slug={slug}/>;notFound();}const products=await getPublicProducts();const product=products.find(p=>p.id===slug);if(!product)notFound();return <ProductDetailClient product={product}/>;}
