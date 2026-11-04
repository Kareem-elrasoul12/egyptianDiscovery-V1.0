import {redirect} from "next/navigation";
import {createClient} from "../../src/lib/supabase/server";
import {isDemoMode, isSupabaseConfigured} from "../../src/lib/supabase/config";
import AdminDemo from "../../src/components/admin-demo";
import AdminWorkspace from "../../src/components/admin-workspace";
import AdminOperations from "../../src/components/admin-operations";

export const metadata={title:"Operations · Egyptian Discovery"};
export default async function AdminPage(){
 if(!isSupabaseConfigured())return isDemoMode()?<AdminDemo/>:<main className="listing-page"><div className="setup-notice"><strong>Production database is not connected</strong><p>Set the Supabase project URL and publishable key in the deployment environment to open live operations. Sample admin data is disabled.</p></div></main>;
 const supabase=await createClient();const {data:{user}}=await supabase.auth.getUser();if(!user)redirect("/login");
 const {data:profile}=await supabase.from("profiles").select("role").eq("id",user.id).maybeSingle();if(!["admin","main_admin"].includes(profile?.role))redirect("/account");
 const [paymentsResult,tripsResult,ordersResult,settingsResult,reviewsResult,galleryResult,destinationsResult,productsResult,refundsResult,claimsResult,customersResult,expensesResult]=await Promise.all([
  supabase.from("payments").select("id,amount,currency,method,status,proof_path,created_at,reservations(reference),orders(reference)").in("status",["pending","under_review"]).order("created_at"),
  supabase.from("trips").select("id,slug,name_en,name_ar,destination_id,trip_type,duration_days,price_per_person,deposit_percent,min_travelers,max_capacity,booking_deadline,minimum_target_deadline,departure_date,preferred_dates,hero_image,images,status,reservations(seats,status)").in("status",["gathering","under_review","confirmed"]),
  supabase.from("orders").select("id,reference,total,status,created_at").in("status",["awaiting_payment","payment_review","confirmed","preparing","shipped"]).order("created_at",{ascending:false}).limit(12),
  supabase.from("business_settings").select("key,value,updated_at").order("key"),
  supabase.from("reviews").select("id,rating,review_en,created_at,profiles(display_name),trips(name_en)").eq("status","pending").order("created_at"),
  supabase.from("gallery_items").select("id,image_path,caption_en,created_at,trips(name_en)").eq("status","draft").order("created_at"),
  supabase.from("destinations").select("id,slug,name_en,name_ar,hero_image,images,status").order("name_en"),
  supabase.from("products").select("id,slug,name_en,name_ar,images,price,stock_quantity,status,availability").order("name_en"),
  supabase.from("refunds").select("id,payment_id,amount,reason,status,created_at,payments(reference,customer_id)").in("status",["pending","approved"]).order("created_at"),
  supabase.from("defective_claims").select("id,order_id,order_item_id,customer_id,description,proof_paths,status,created_at,orders(reference),order_items(product_name_en)").in("status",["submitted","under_review"]).order("created_at"),
  supabase.from("profiles").select("id,phone,display_name,role,loyalty_points,created_at").eq("role","customer").order("created_at",{ascending:false}).limit(30),
  supabase.from("trip_expenses").select("id,amount,category,description,incurred_on,trips(name_en)").order("incurred_on",{ascending:false}).limit(100),
 ]);
 const payments=await Promise.all((paymentsResult.data||[]).map(async payment=>{if(!payment.proof_path)return {...payment,proofUrl:null};const {data}=await supabase.storage.from("payment-proofs").createSignedUrl(payment.proof_path,300);return {...payment,proofUrl:data?.signedUrl||null};}));
 return <><AdminWorkspace payments={payments} trips={tripsResult.data||[]} orders={ordersResult.data||[]} settings={settingsResult.data||[]} reviews={reviewsResult.data||[]} gallery={galleryResult.data||[]} /><AdminOperations destinations={destinationsResult.data||[]} products={productsResult.data||[]} refunds={refundsResult.data||[]} claims={claimsResult.data||[]} customers={customersResult.data||[]} expenses={expensesResult.data||[]} trips={tripsResult.data||[]} orders={ordersResult.data||[]}/></>;
}
