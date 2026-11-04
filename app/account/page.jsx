import Link from "next/link";
import { createClient } from "../../src/lib/supabase/server";
import { isDemoMode, isSupabaseConfigured } from "../../src/lib/supabase/config";
import DemoAccount from "../../src/components/demo-account";
import SignOutButton from "../../src/components/sign-out-button";

export default async function AccountPage() {
  if (!isSupabaseConfigured()) {
    return isDemoMode() ? (
      <DemoAccount />
    ) : (
      <main className="listing-page">
        <div className="setup-notice">
          <strong>Account service is not connected</strong>
          <p>Configure Supabase to access live reservations and orders.</p>
        </div>
      </main>
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <main className="listing-page">
        <div className="page-intro">
          <p className="eyebrow">YOUR ACCOUNT <i /></p>
          <h1>Welcome, explorer.</h1>
          <p>Sign in to view your reservations, travel dates, payments, and loyalty rewards.</p>
          <div style={{ marginTop: "18px" }}>
            <Link className="button button-dark" href="/login">
              Sign in or create account ↗
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const [{ data: profile }, { data: reservations }, { data: orders }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("display_name,phone,email,role,loyalty_points,referral_code")
        .eq("id", user.id)
        .maybeSingle(),
      supabase
        .from("reservations")
        .select(
          "id,reference,status,seats,amount_due,amount_paid,created_at,trips(name_en,name_ar,departure_date)"
        )
        .eq("customer_id", user.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("orders")
        .select("id,reference,status,total,created_at")
        .eq("customer_id", user.id)
        .order("created_at", { ascending: false }),
    ]);

  const isAdmin = ["admin", "main_admin"].includes(profile?.role);

  return (
    <main className="listing-page">
      {/* If Administrator, show prominent operations banner */}
      {isAdmin && (
        <section
          style={{
            background: "linear-gradient(135deg, var(--olive) 0%, #17241c 100%)",
            color: "#fff8ed",
            padding: "24px 28px",
            borderRadius: "16px",
            marginBottom: "28px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "18px",
            boxShadow: "0 10px 25px rgba(0,0,0,0.12)",
          }}
        >
          <div>
            <span
              style={{
                display: "inline-block",
                padding: "4px 10px",
                borderRadius: "50px",
                background: "var(--orange)",
                color: "#1f140e",
                fontSize: "10px",
                fontWeight: 800,
                letterSpacing: "1px",
                marginBottom: "8px",
              }}
            >
              ADMINISTRATOR ACCESS
            </span>
            <h2 style={{ margin: "4px 0 6px", fontSize: "22px", fontFamily: "var(--display)" }}>
              Operations & Bookings Workspace
            </h2>
            <p style={{ margin: 0, color: "#d8dec8", fontSize: "12px", maxWidth: "600px" }}>
              You are signed in as an agency administrator. Manage customer reservations, approve bank/InstaPay payments, and edit trips.
            </p>
          </div>
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <Link
              href="/admin"
              className="button button-light"
              style={{ fontWeight: 800 }}
            >
              Open Admin Dashboard ⚡
            </Link>
          </div>
        </section>
      )}

      {/* Account Header */}
      <div
        className="page-intro"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: "16px",
          marginBottom: "24px",
        }}
      >
        <div>
          <p className="eyebrow">
            TRAVELER PROFILE <i />
          </p>
          <h1>Good to have you back{profile?.display_name ? `, ${profile.display_name}` : ""}.</h1>
          <p style={{ marginTop: "6px" }}>
            {profile?.email || profile?.phone || user.email}
            {profile?.role && profile.role !== "customer" && ` · ${profile.role.replace("_", " ").toUpperCase()}`}
          </p>
        </div>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          {isAdmin && (
            <Link href="/admin" className="button button-dark">
              Admin Workspace ⚡
            </Link>
          )}
          <SignOutButton className="button button-light" />
        </div>
      </div>

      {/* Profile KPI Cards */}
      <div className="account-kpis" style={{ marginBottom: "28px" }}>
        <article>
          <small>Loyalty Points</small>
          <strong>{profile?.loyalty_points || 0}</strong>
          <span>Earn points with each journey</span>
        </article>
        <article>
          <small>Active Bookings</small>
          <strong>{reservations?.length || 0}</strong>
          <span>Seat holds & confirmed trips</span>
        </article>
        <article>
          <small>Shop Orders</small>
          <strong>{orders?.length || 0}</strong>
          <span>Travel gear & essentials</span>
        </article>
        <article>
          <small>Referral Code</small>
          <strong>{profile?.referral_code || "N/A"}</strong>
          <span>Share with friends to earn discounts</span>
        </article>
      </div>

      {/* Reservations & Orders */}
      <div className="account-grid">
        <section className="account-panel">
          <h2>Your Reservations</h2>
          {reservations?.length ? (
            reservations.map((x) => (
              <article className="account-row" key={x.id}>
                <div>
                  <strong>{x.trips?.name_en || "Trip reservation"}</strong>
                  <span>{x.reference} · {x.status.replaceAll("_", " ")}</span>
                </div>
                <small>
                  {x.seats} seat(s) · EGP {Number(x.amount_paid).toLocaleString()} paid of EGP{" "}
                  {Number(x.amount_due).toLocaleString()}
                </small>
                <div style={{ marginTop: "4px" }}>
                  <Link href={`/account/reservations/${x.id}`} style={{ color: "var(--orange)", fontWeight: 700 }}>
                    View details & payments ↗
                  </Link>
                </div>
              </article>
            ))
          ) : (
            <p>
              No reservations yet. <Link href="/trips" style={{ color: "var(--orange)", fontWeight: 700 }}>Explore trips ↗</Link>
            </p>
          )}
        </section>

        <section className="account-panel">
          <h2>Field Shop Orders</h2>
          {orders?.length ? (
            orders.map((x) => (
              <article className="account-row" key={x.id}>
                <div>
                  <strong>{x.reference}</strong>
                  <span>{x.status.replaceAll("_", " ")}</span>
                </div>
                <small>Total: EGP {Number(x.total).toLocaleString()}</small>
                <div style={{ marginTop: "4px" }}>
                  <Link href={`/account/orders/${x.id}`} style={{ color: "var(--orange)", fontWeight: 700 }}>
                    Order details ↗
                  </Link>
                </div>
              </article>
            ))
          ) : (
            <p>
              No orders yet. <Link href="/shop" style={{ color: "var(--orange)", fontWeight: 700 }}>Visit the shop ↗</Link>
            </p>
          )}
        </section>
      </div>

      <section className="account-panel" style={{ marginTop: "16px" }}>
        <h2>Identity & Privacy</h2>
        <p>
          National ID and traveler documents are collected only after a trip is confirmed. All traveler identity data is encrypted and kept private in accordance with Egyptian data protection standards.
        </p>
      </section>
    </main>
  );
}
