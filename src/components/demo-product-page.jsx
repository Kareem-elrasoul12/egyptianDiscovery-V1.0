"use client";
import Link from "next/link";
import {useSite} from "./site-context";
import ProductDetailClient from "./product-detail-client";
export default function DemoProductPage({slug}){
 const {demo,demoReady}=useSite();
 if(!demoReady)return <main className="listing-page">Loading field gear…</main>;
 const product=demo.products.find(x=>x.id===slug||x.slug===slug);
 if(!product)return <main className="listing-page"><h1>Item not found.</h1><Link href="/shop">Back to the field shop ↗</Link></main>;
 return <ProductDetailClient product={{...product,preview:true}}/>;
}
