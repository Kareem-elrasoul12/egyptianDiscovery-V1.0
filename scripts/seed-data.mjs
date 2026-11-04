import { createClient } from "@supabase/supabase-js";
import fs from "fs";

const env = fs.readFileSync(".env.local", "utf8");
const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)?.[1]?.trim();
const secret = env.match(/SUPABASE_SECRET_KEY=(.*)/)?.[1]?.trim();

if (!url || !secret) {
  console.error("Missing Supabase URL or Secret Key in .env.local");
  process.exit(1);
}

const supabase = createClient(url, secret);

async function seed() {
  console.log("Seeding Egyptian Discovery database...");

  // 1. Governorates
  const governorates = [
    { code: "cairo", name_en: "Cairo", name_ar: "القاهرة", delivery_fee: 70, enabled: true },
    { code: "giza", name_en: "Giza", name_ar: "الجيزة", delivery_fee: 75, enabled: true },
    { code: "alexandria", name_en: "Alexandria", name_ar: "الإسكندرية", delivery_fee: 90, enabled: true },
    { code: "south_sinai", name_en: "South Sinai", name_ar: "جنوب سيناء", delivery_fee: 140, enabled: true },
    { code: "red_sea", name_en: "Red Sea", name_ar: "البحر الأحمر", delivery_fee: 140, enabled: true },
    { code: "matrouh", name_en: "Matrouh & Siwa", name_ar: "مطروح وسيوة", delivery_fee: 150, enabled: true },
    { code: "fayoum", name_en: "Fayoum", name_ar: "الفيوم", delivery_fee: 95, enabled: true },
    { code: "luxor", name_en: "Luxor", name_ar: "الأقصر", delivery_fee: 130, enabled: true },
    { code: "aswan", name_en: "Aswan", name_ar: "أسوان", delivery_fee: 140, enabled: true },
  ];

  for (const g of governorates) {
    await supabase.from("governorates").upsert(g, { onConflict: "code" });
  }
  console.log("Governorates seeded.");

  // 2. Product Categories
  const categories = [
    { slug: "travel-essentials", name_en: "Travel Essentials", name_ar: "أساسيات السفر", sort_order: 1 },
    { slug: "local-craft", name_en: "Local Craft", name_ar: "حرف محلية", sort_order: 2 },
    { slug: "camping-gear", name_en: "Camping Gear", name_ar: "معدات التخييم", sort_order: 3 },
  ];

  const catMap = new Map();
  for (const cat of categories) {
    const { data } = await supabase.from("product_categories").upsert(cat, { onConflict: "slug" }).select();
    if (data?.[0]) catMap.set(cat.slug, data[0].id);
  }
  console.log("Product categories seeded.");

  // 3. Products
  const products = [
    {
      slug: "field-notes",
      name_en: "The Field Notes Journal",
      name_ar: "دفتر ملاحظات الرحلات",
      category_id: catMap.get("travel-essentials"),
      description_en: "A pocket-sized companion for sketches, routes, and small discoveries on desert trails.",
      description_ar: "رفيق صغير لتدوين الرسومات والطرق والاكتشافات في مسارات الصحراء.",
      price: 420,
      currency: "EGP",
      stock_quantity: 45,
      images: ["photo-1455390582262-044cdead277a"],
      status: "published",
      availability: true,
      sort_order: 1
    },
    {
      slug: "desert-bottle",
      name_en: "Trail Bottle · 750 ml",
      name_ar: "زجاجة الرحلات · ٧٥٠ مل",
      category_id: catMap.get("travel-essentials"),
      description_en: "A double-insulated, rugged stainless steel bottle for long sunny days in the open air.",
      description_ar: "زجاجة متينة مزدوجة العزل للمحافظة على برودة الماء في أيام الهواء الطلق المشمسة.",
      price: 680,
      currency: "EGP",
      stock_quantity: 30,
      images: ["photo-1602143407151-7111542de6e8"],
      status: "published",
      availability: true,
      sort_order: 2
    },
    {
      slug: "palm-weave-tote",
      name_en: "Palm Weave Day Bag",
      name_ar: "حقيبة نهارية منسوجة يدويًا",
      category_id: catMap.get("local-craft"),
      description_en: "Handwoven date-palm leaf texture crafted by oasis artisans, with room for your everyday kit.",
      description_ar: "نسيج يدوي من سعف نخيل الواحات صُنع بأيدي حرفيين محليين مع مساحة لأغراضك اليومية.",
      price: 950,
      currency: "EGP",
      stock_quantity: 20,
      images: ["photo-1590874103328-eac38a683ce7"],
      status: "published",
      availability: true,
      sort_order: 3
    },
    {
      slug: "sun-hat",
      name_en: "Wide Brim Sun Hat",
      name_ar: "قبعة شمس واسعة الحواف",
      category_id: catMap.get("travel-essentials"),
      description_en: "A light, breathable, packable shade essential for desert paths and coastal afternoons.",
      description_ar: "حماية خفيفة وقابلة للطي ومانعة للشمس لمسارات الصحراء وأوقات الساحل.",
      price: 760,
      currency: "EGP",
      stock_quantity: 35,
      images: ["photo-1521369909029-2afed882baee"],
      status: "published",
      availability: true,
      sort_order: 4
    },
    {
      slug: "camping-hammock",
      name_en: "Ultralight Camping Hammock",
      name_ar: "أرجوحة تخييم فائقة الخفة",
      category_id: catMap.get("camping-gear"),
      description_en: "Ripstop nylon hammock with high-strength tree straps for stargazing in Sinai and Siwa.",
      description_ar: "أرجوحة من النايلون المقاوم للتمزق مع أحزمة متينة للتأمل في نجوم سيناء وسيوة.",
      price: 890,
      currency: "EGP",
      stock_quantity: 25,
      images: ["photo-1509316785289-025f5b846b35"],
      status: "published",
      availability: true,
      sort_order: 5
    }
  ];

  for (const p of products) {
    await supabase.from("products").upsert(p, { onConflict: "slug" });
  }
  console.log("Products seeded.");

  // 4. Destinations
  const destinations = [
    {
      slug: "siwa",
      name_en: "Siwa Oasis",
      name_ar: "واحة سيوة",
      region_en: "Western Desert",
      region_ar: "الصحراء الغربية",
      description_en: "Salt lakes, ancient olive groves, shimmering dunes, and a timeless desert culture.",
      description_ar: "بحيرات ملحية صافية وبساتين نخيل وزيتون وكثبان رملية ساحرة وهوية واحات متجذرة في التاريخ.",
      hero_image: "photo-1509316785289-025f5b846b35",
      images: ["photo-1509316785289-025f5b846b35", "photo-1518837695005-2083093ee35b"],
      latitude: 29.2032,
      longitude: 25.5195,
      highlights_en: ["Floating in hyper-saline salt pools", "Sunset 4x4 safari across the Great Sand Sea", "Traditional Siwan mud-brick architecture at Shali Fortress"],
      highlights_ar: ["السباحة في بحيرات الملح فائقة الصفاء", "سفاري الغروب بسيارات الدفع الرباعي في بحر الرمال الأعظم", "قلعة شالي الطينية التاريخية وعيون الماء الدافئة"],
      activities_en: ["Desert Safari", "Hot Springs", "Salt Lake Floating", "Cultural Walks"],
      activities_ar: ["سفاري صحراوي", "عيون دافئة", "سباحة في بحيرات الملح", "جولات ثقافية"],
      status: "published",
      sort_order: 1
    },
    {
      slug: "sinai",
      name_en: "South Sinai",
      name_ar: "جنوب سيناء",
      region_en: "Red Sea & Mountains",
      region_ar: "البحر الأحمر والجبال",
      description_en: "Rise above the clouds on ancient mountain trails and sleep beneath a million stars in Bedouin camps.",
      description_ar: "اصعد فوق السحاب على مسارات الجبال الشاهقة ونم تحت قبة من ملايين النجوم في مخيمات بدوية أصيلة.",
      hero_image: "photo-1464822759023-fed622ff2c3b",
      images: ["photo-1464822759023-fed622ff2c3b", "photo-1500530855697-b586d89ba3ee"],
      latitude: 28.5394,
      longitude: 33.9750,
      highlights_en: ["Sunrise from Mount Catherine & Mount Sinai", "Stargazing and dinner around the Bedouin fire", "Wadi Arbaeen & sacred mountain valleys"],
      highlights_ar: ["مشهد شروق الشمس من أعلى قمم سيناء", "مراقبة النجوم حول نار المخيم البدوي", "وادي الأربعين والدروب الجبلية الهادئة"],
      activities_en: ["Mountain Trekking", "Stargazing", "Bedouin Hospitality", "Campfire Gathering"],
      activities_ar: ["تسلق الجبال والهايكنج", "رصد النجوم", "ضيافة بدوية", "جلسات سمر حول النار"],
      status: "published",
      sort_order: 2
    },
    {
      slug: "fayoum",
      name_en: "Fayoum Oasis",
      name_ar: "واحة الفيوم",
      region_en: "Desert Lakes & Dunes",
      region_ar: "بحيرات الصحراء والكثبان",
      description_en: "Serene desert waterfalls, golden sand dunes, and tranquil lakes just a short journey from Cairo.",
      description_ar: "شلالات صحراوية هادئة وكثبان رملية ذهبية وبحيرات ساحرة على مسافة قصيرة من صخب العاصمة.",
      hero_image: "photo-1470770841072-f978cf4d019e",
      images: ["photo-1470770841072-f978cf4d019e", "photo-1455390582262-044cdead277a"],
      latitude: 29.3084,
      longitude: 30.8428,
      highlights_en: ["Sandboarding on the slopes of Wadi El Rayan", "Sunset by Magic Lake (El Bohayra El Sehreyya)", "Tunis Village pottery workshops and bohemian cafes"],
      highlights_ar: ["التزلج على رمال وادي الريان الناعمة", "غروب الشمس على ضفاف البحيرة السحرية", "ورش الفخار والمقاهي الهادئة في قرية تونس"],
      activities_en: ["Sandboarding", "Lake Kayaking", "Pottery Making", "Desert Camping"],
      activities_ar: ["التزلج على الرمال", "كاياك البحيرات", "صناعة الفخار", "تخييم صحراوي"],
      status: "published",
      sort_order: 3
    },
    {
      slug: "white-desert",
      name_en: "White Desert & Bahariya",
      name_ar: "الصحراء البيضاء والواحات البحرية",
      region_en: "Western Desert",
      region_ar: "الصحراء الغربية",
      description_en: "A surreal landscape sculpted by millions of years of wind into giant chalk sculptures that look like snow on Mars.",
      description_ar: "أرض ساحرة نحتتها الرياح عبر ملايين السنين لتتحول إلى منحوتات طباشيرية بيضاء كأنها ثلوج على كوكب آخر.",
      hero_image: "photo-1500530855697-b586d89ba3ee",
      images: ["photo-1500530855697-b586d89ba3ee", "photo-1509316785289-025f5b846b35"],
      latitude: 27.0583,
      longitude: 28.0000,
      highlights_en: ["Campfire under the milky way between glowing white rocks", "Black Desert volcanic peaks", "Crystal Mountain natural mineral formations"],
      highlights_ar: ["المبيت بين الصخور الطباشيرية البيضاء تحت درب التبانة", "أهرامات وتلال الصحراء السوداء البركانية", "جبل الكريستال وتكوينات الكوارتز الطبيعية"],
      activities_en: ["4x4 Expedition", "Wild Camping", "Geological Exploration", "Night Photography"],
      activities_ar: ["رحلة استكشاف 4x4", "تخييم بري أصيل", "استكشاف جيولوجي", "تصوير ليلي وفلكي"],
      status: "published",
      sort_order: 4
    }
  ];

  const destMap = new Map();
  for (const d of destinations) {
    const { data } = await supabase.from("destinations").upsert(d, { onConflict: "slug" }).select();
    if (data?.[0]) destMap.set(d.slug, data[0].id);
  }
  console.log("Destinations seeded.");

  // 5. Trips
  const trips = [
    {
      slug: "siwa-slow-days",
      destination_id: destMap.get("siwa"),
      name_en: "Siwa: Slow Days in the Oasis",
      name_ar: "سيوة: أيام هادئة في سحر الواحة",
      trip_type: "weekend",
      duration_days: 3,
      price_per_person: 4800,
      currency: "EGP",
      deposit_percent: 10,
      min_travelers: 13,
      max_capacity: 24,
      booking_deadline: "2026-12-05T20:00:00Z",
      preferred_dates: ["2026-12-10", "2026-12-17", "2027-01-08"],
      hero_image: "photo-1518837695005-2083093ee35b",
      images: ["photo-1518837695005-2083093ee35b", "photo-1509316785289-025f5b846b35"],
      itinerary_en: [
        { day: 1, title: "Arrival & Salt Pools", desc: "Check into eco-lodge, float in crystal-clear salt lakes, watch sunset from Fatnas Island." },
        { day: 2, title: "Great Sand Sea Safari", desc: "4x4 dunes expedition, sandboarding, natural hot springs swim, Bedouin camp dinner." },
        { day: 3, title: "Shali Fortress & Departure", desc: "Walk through ancient Shali ruins, visit the Temple of Amun, and return journey." }
      ],
      itinerary_ar: [
        { day: 1, title: "الوصول وبحيرات الملح", desc: "التسكين في النزل البيئي، السباحة العائمة في بحيرات الملح النقية، وغروب جزيرة فطناس." },
        { day: 2, title: "سفاري بحر الرمال الأعظم", desc: "رحلة سيارات الدفع الرباعي، التزلج على الرمال، الاسترخاء في العيون الدافئة، وعشاء بدوي أصيل." },
        { day: 3, title: "قلعة شالي وسوق الواحة", desc: "جولة في قلعة شالي الأثرية، معبد آمون، شراء منتجات التمر وزيت الزيتون، ثم رحلة العودة." }
      ],
      status: "gathering"
    },
    {
      slug: "sinai-summit-stars",
      destination_id: destMap.get("sinai"),
      name_en: "Sinai Summit & Bedouin Stars",
      name_ar: "قمة سيناء وسماء النجوم",
      trip_type: "multi-day",
      duration_days: 2,
      price_per_person: 3250,
      currency: "EGP",
      deposit_percent: 10,
      min_travelers: 16,
      max_capacity: 26,
      booking_deadline: "2026-11-25T20:00:00Z",
      preferred_dates: ["2026-11-28", "2026-12-12", "2026-12-25"],
      hero_image: "photo-1464822759023-fed622ff2c3b",
      images: ["photo-1464822759023-fed622ff2c3b", "photo-1500530855697-b586d89ba3ee"],
      itinerary_en: [
        { day: 1, title: "Ascent & Mountain Camp", desc: "Begin trek through mountain passes with local Bedouin guides, dinner around campfire." },
        { day: 2, title: "Sunrise at Summit", desc: "Reach the peak before dawn, watch the sun illuminate the peaks, visit St. Catherine." }
      ],
      itinerary_ar: [
        { day: 1, title: "الصعود والمخيم الجبلي", desc: "بدء مسار الهايكنج برفقة أدلاء بدو، شاي الأعشاب الجبلية، وعشاء دافئ حول النار." },
        { day: 2, title: "شروق الشمس من القمة", desc: "بلوغ القمة قبل الفجر لمشاهدة شروق الشمس المهيب بين سلاسل الجبال ثم النزول." }
      ],
      status: "gathering"
    },
    {
      slug: "fayoum-dunes-escape",
      destination_id: destMap.get("fayoum"),
      name_en: "Fayoum: Beyond the Dunes",
      name_ar: "الفيوم: ما وراء الكثبان الذهبية",
      trip_type: "day",
      duration_days: 1,
      price_per_person: 1650,
      currency: "EGP",
      deposit_percent: 10,
      min_travelers: 10,
      max_capacity: 22,
      booking_deadline: "2026-12-04T20:00:00Z",
      preferred_dates: ["2026-12-06", "2026-12-13", "2026-12-20"],
      hero_image: "photo-1470770841072-f978cf4d019e",
      images: ["photo-1470770841072-f978cf4d019e", "photo-1455390582262-044cdead277a"],
      itinerary_en: [
        { day: 1, title: "Wadi El Rayan & Magic Lake", desc: "Waterfalls, 4x4 dune ride, sandboarding, BBQ lunch by the Magic Lake, sunset pottery in Tunis Village." }
      ],
      itinerary_ar: [
        { day: 1, title: "شلالات وادي الريان والبحيرة السحرية", desc: "زيارة الشلالات، سفاري الكثبان، التزلج على الرمال، غداء مشويات على ضفاف البحيرة السحرية، وجولة قرية تونس." }
      ],
      status: "gathering"
    },
    {
      slug: "white-desert-safari",
      destination_id: destMap.get("white-desert"),
      name_en: "White Desert & Black Desert Expedition",
      name_ar: "استكشاف الصحراء البيضاء والسوداء",
      trip_type: "weekend",
      duration_days: 2,
      price_per_person: 3900,
      currency: "EGP",
      deposit_percent: 10,
      min_travelers: 12,
      max_capacity: 20,
      booking_deadline: "2026-12-15T20:00:00Z",
      preferred_dates: ["2026-12-19", "2027-01-02", "2027-01-16"],
      hero_image: "photo-1500530855697-b586d89ba3ee",
      images: ["photo-1500530855697-b586d89ba3ee", "photo-1509316785289-025f5b846b35"],
      itinerary_en: [
        { day: 1, title: "Black Desert to White Desert", desc: "4x4 through Bahariya oasis, volcanic black peaks, Crystal Mountain, camp among the giant white chalk rocks." },
        { day: 2, title: "Sunrise in the Sculptures", desc: "Morning exploration of the Mushroom and Chicken chalk formations, return via hot springs." }
      ],
      itinerary_ar: [
        { day: 1, title: "من الصحراء السوداء إلى البيضاء", desc: "سفاري الواحات البحرية، التلال البركانية، جبل الكريستال، والتخييم والمبيت بين صخور الطباشير البيضاء." },
        { day: 2, title: "شروق شمس وسط التكوينات الأسطورية", desc: "استكشاف تكوينات الفطر والدجاجة الشهيرة، الاستحمام في العيون الكبريتية، والعودة." }
      ],
      status: "gathering"
    }
  ];

  for (const t of trips) {
    await supabase.from("trips").upsert(t, { onConflict: "slug" });
  }
  console.log("Trips seeded.");

  // 6. Business Settings
  const settings = [
    { key: "instapay_handle", value: "egyptiandiscovery@instapay" },
    { key: "bank_name", value: "Commercial International Bank (CIB)" },
    { key: "bank_account_name", value: "Egyptian Discovery for Travel & Adventure" },
    { key: "bank_iban", value: "EG380010004500000012345678901" },
    { key: "reservation_hold_hours", value: "12" },
    { key: "remaining_balance_hours", value: "72" },
    { key: "priority_period_hours", value: "24" },
    { key: "referral_points", value: "100" },
    { key: "loyalty_points_per_egp", value: "0.05" },
    { key: "whatsapp_contact_number", value: "201140915876" }
  ];

  for (const s of settings) {
    await supabase.from("business_settings").upsert(s, { onConflict: "key" });
  }
  console.log("Business settings updated.");

  console.log("Seeding completed successfully!");
}

seed().catch((err) => {
  console.error("Seed error:", err);
  process.exit(1);
});
