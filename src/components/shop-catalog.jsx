"use client";
import Link from "next/link";
import {useState} from "react";
import {useSite} from "./site-context";
import {imageUrl} from "../data/content";
import {isDemoMode} from "../lib/supabase/config";

function photo(product,media){const value=product.images?.[0]||"photo-1470770841072-f978cf4d019e";return imageUrl(value,900,media);}
export default function ShopCatalog({products}){
 const {lang,addToCart,demo}=useSite();const [added,setAdded]=useState("");const catalogue=isDemoMode()?demo.products.map(p=>({...p,preview:true})):products;
 return <main className="listing-page"><div className="page-intro"><p className="eyebrow">MADE FOR THE WAY OUT THERE <i/></p><h1>Useful things for the journey.</h1><p>Travel essentials and thoughtful finds inspired by Egypt’s landscapes and makers.</p></div>{catalogue.some(p=>p.preview)&&<div className="notice-strip"><b>Interactive demo shop</b><span>Add items to your bag, place a sample order, submit transfer proof, and move it through fulfillment in the admin workspace.</span></div>}<div className="product-grid">{catalogue.map(product=>{const source=product.images?.[0]||"photo-1470770841072-f978cf4d019e";const image=photo(product,demo.media);return <article className="product-card" key={product.id}><Link href={`/shop/${product.id}`} className="product-photo"><img src={image} alt={product.name_en}/><span>{product.category?.name_en||"Field shop"}</span></Link><div className="product-card-info"><div><h2>{lang==="ar"?product.name_ar:product.name_en}</h2><p>{lang==="ar"?product.description_ar:product.description_en}</p></div><div className="product-buy"><strong>{product.currency||"EGP"} {Number(product.price).toLocaleString("en-EG")}</strong><button aria-label={`Add ${product.name_en} to bag`} onClick={()=>{addToCart({...product,image,image_source:source});setAdded(product.id);}}>＋</button></div>{added===product.id&&<small role="status">Added to your bag</small>}</div></article>;})}</div></main>;
}
