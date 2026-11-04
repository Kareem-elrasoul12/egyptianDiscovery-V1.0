import "server-only";
import { createClient } from "../supabase/server";
import { destinations as previewDestinations, trips as previewTrips } from "../../data/content";
import { isDemoMode, isSupabaseConfigured } from "../supabase/config";

const destinationFields = "id,slug,name_en,name_ar,region_en,region_ar,description_en,description_ar,hero_image,images,latitude,longitude,highlights_en,highlights_ar,activities_en,activities_ar,travel_info_en,travel_info_ar";
const tripFields = "id,slug,name_en,name_ar,description_en,description_ar,destination_id,trip_type,duration_days,price_per_person,currency,deposit_percent,min_travelers,max_capacity,booking_deadline,departure_date,preferred_dates,hero_image,images,itinerary_en,itinerary_ar,included_en,included_ar,excluded_en,excluded_ar,accommodation_en,accommodation_ar,transport_en,transport_ar,requirements_en,requirements_ar,bring_en,bring_ar,cancellation_policy_en,cancellation_policy_ar,status,priority_starts_at,priority_ends_at";

function mapDestination(row) {
  return { ...row, id: row.slug, dbId: row.id, name: row.name_en, ar: row.name_ar, region: row.region_en, regionAr: row.region_ar, description: row.description_en, descAr: row.description_ar, image: row.hero_image || row.images?.[0] || "photo-1509316785289-025f5b846b35", images: row.images?.length ? row.images : [row.hero_image || "photo-1509316785289-025f5b846b35"], preview: false };
}

function mapTrip(row, demand) {
  const preferred = row.preferred_dates || [];
  const images = row.images?.length ? row.images : [row.hero_image || "photo-1500530855697-b586d89ba3ee"];
  return { ...row, id: row.slug, dbId: row.id, name: row.name_en, ar: row.name_ar, description: row.description_en || "", descriptionAr: row.description_ar || "", place: row.destinations?.name_en || "Egypt", placeAr: row.destinations?.name_ar || "مصر", placeSlug: row.destinations?.slug || "", type: row.trip_type, typeAr: row.trip_type, duration: `${row.duration_days} days`, durationAr: `${row.duration_days} أيام`, price: `${row.currency || "EGP"} ${Number(row.price_per_person).toLocaleString("en-EG")}`, date: row.departure_date || preferred[0] || "Dates to be confirmed", dateAr: row.departure_date || preferred[0] || "سيتم تحديد التاريخ", image: row.hero_image || images[0], images, note: row.itinerary_en?.[0]?.title || "Agency planned journey", noteAr: row.itinerary_ar?.[0]?.title || "رحلة بتخطيط الوكالة", paidTravelers:demand?.paid_travelers||0, demandStatus:demand?.demand_status||row.status, preview: false };
}

export async function getPublicDestinations() {
  if (!isSupabaseConfigured()) return isDemoMode() ? previewDestinations.map((item) => ({ ...item, preview: true })) : [];
  const supabase = await createClient();
  const { data, error } = await supabase.from("destinations").select(destinationFields).eq("status", "published").order("sort_order");
  if (error) throw new Error("Could not load destinations.");
  return (data || []).map(mapDestination);
}

export async function getPublicTrips({ destinationId, limit } = {}) {
  if (!isSupabaseConfigured()) return isDemoMode() ? previewTrips.map((item,index) => ({ ...item, preview: true, demoAvailable:true, priceValue:[4800,3250,1650][index]||2400, min_travelers:[13,16,10][index]||12, max_capacity:[24,26,22][index]||24, paidTravelers:[9,16,5][index]||0, status:["gathering","under_review","gathering"][index]||"gathering", preferred_dates:["2026-12-12","2027-01-09"], booking_deadline:"2026-12-05" })) : [];
  const supabase = await createClient();
  let query = supabase.from("trips").select(`${tripFields},destinations(name_en,name_ar,slug)`).in("status", ["gathering", "under_review", "confirmed", "fully_booked"]).order("created_at", { ascending: false });
  if (destinationId) query = query.eq("destination_id", destinationId);
  if (limit) query = query.limit(limit);
  const [{ data, error },{data:demand}] = await Promise.all([query,supabase.from("trip_demand").select("trip_id,paid_travelers,demand_status")]);
  if (error) throw new Error("Could not load trips.");
  const byTrip=new Map((demand||[]).map(row=>[row.trip_id,row]));
  return (data || []).map(row=>mapTrip(row,byTrip.get(row.id)));
}

export async function getPublicProducts({ categoryId, limit } = {}) {
  if (!isSupabaseConfigured() && isDemoMode()) {
    const { previewProducts } = await import("../../data/content");
    return previewProducts.slice(0, limit || previewProducts.length);
  }
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();
  let query = supabase.from("products").select("id,slug,name_en,name_ar,description_en,description_ar,price,currency,images,stock_quantity,availability,category_id,product_categories(name_en,name_ar)").eq("status", "published").eq("availability", true).order("sort_order");
  if (categoryId) query = query.eq("category_id", categoryId);
  if (limit) query = query.limit(limit);
  const { data, error } = await query;
  if (error) throw new Error("Could not load products.");
  return (data || []).map(row=>({...row,dbId:row.id,id:row.slug,category:row.product_categories,preview:false}));
}

export async function getPublicGovernorates() {
  if (!isSupabaseConfigured() && isDemoMode()) return [
    {code:"cairo",name_en:"Cairo",name_ar:"القاهرة",delivery_fee:80},
    {code:"giza",name_en:"Giza",name_ar:"الجيزة",delivery_fee:90},
    {code:"alexandria",name_en:"Alexandria",name_ar:"الإسكندرية",delivery_fee:120},
  ];
  if (!isSupabaseConfigured()) return [];
  const supabase=await createClient();
  const {data,error}=await supabase.from("governorates").select("code,name_en,name_ar,delivery_fee").eq("enabled",true).order("name_en");
  if(error)throw new Error("Could not load delivery areas.");
  return data||[];
}

export async function getPublicLeaderboard(limit = 5) {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();
  const { data, error } = await supabase.from("monthly_leaderboard").select("profile_id,display_name,points,rank").order("rank").limit(limit);
  if (error) return [];
  return data || [];
}

export async function getPublicReviews(limit = 6) {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();
  const { data, error } = await supabase.from("public_reviews").select("id,display_name,rating,review_en,review_ar,trip_name_en,trip_name_ar,created_at").order("created_at", { ascending: false }).limit(limit);
  if (error) return [];
  return data || [];
}

export async function getPublicGallery(limit = 18) {
  if (!isSupabaseConfigured()) return [];
  const supabase=await createClient();
  const {data,error}=await supabase.from("gallery_items").select("id,image_path,caption_en,caption_ar,trips(name_en,name_ar)").eq("status","published").order("created_at",{ascending:false}).limit(limit);
  if(error)return [];
  return data||[];
}
