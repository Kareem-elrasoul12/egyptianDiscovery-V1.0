import { createClient } from "@supabase/supabase-js";
import fs from "fs";

const env = fs.readFileSync(".env.local", "utf8");
const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)?.[1]?.trim();
const secret = env.match(/SUPABASE_SECRET_KEY=(.*)/)?.[1]?.trim();
const adminPhone = env.match(/ADMIN_PHONE=(.*)/)?.[1]?.trim() || "01140915876";

if (!url || !secret) {
  console.error("Missing Supabase URL or Secret Key in .env.local");
  process.exit(1);
}

const supabase = createClient(url, secret);

async function bootstrap() {
  const email = process.argv[2] || "admin@egyptiandiscovery.com";
  const password = process.argv[3] || "AdminDiscovery2026!";

  console.log(`Bootstrapping admin account with email: ${email}, phone: ${adminPhone}...`);

  // Check if user already exists
  const { data: { users }, error: listErr } = await supabase.auth.admin.listUsers();
  if (listErr) throw listErr;

  let user = users.find(u => u.email === email);

  if (!user) {
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { display_name: "Kareem (Admin)" }
    });
    if (error) throw error;
    user = data.user;
    console.log(`Created new auth user: ${user.id}`);
  } else {
    // update password
    const { error } = await supabase.auth.admin.updateUserById(user.id, {
      password,
      email_confirm: true
    });
    if (error) throw error;
    console.log(`Existing user updated: ${user.id}`);
  }

  // Promote in public.profiles
  const { error: profErr } = await supabase.from("profiles").upsert({
    id: user.id,
    role: "main_admin",
    phone: adminPhone,
    email: email,
    display_name: "Kareem (Admin)"
  }, { onConflict: "id" });

  if (profErr) throw profErr;

  console.log("Admin account successfully bootstrapped as main_admin!");
  console.log("-----------------------------------------");
  console.log("Login details for Admin Workspace:");
  console.log(`Email:    ${email}`);
  console.log(`Password: ${password}`);
  console.log(`Role:     main_admin`);
  console.log("-----------------------------------------");
}

bootstrap().catch((err) => {
  console.error("Admin bootstrap error:", err);
  process.exit(1);
});
