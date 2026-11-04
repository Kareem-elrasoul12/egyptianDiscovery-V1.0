export function jsonError(message, status = 400) {
  return Response.json({ error: message }, { status });
}

export async function requireUser(supabase) {
  if (!supabase) return { error: "Platform services are not configured.", status: 503 };
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return { error: "Sign in to continue.", status: 401 };
  return { user: data.user };
}

export async function requireMainAdmin(supabase) {
  const auth = await requireUser(supabase);
  if (auth.error) return auth;
  const { data, error } = await supabase
    .from("profiles")
    .select("role,phone")
    .eq("id", auth.user.id)
    .maybeSingle();
  if (error || data?.role !== "main_admin") {
    return { error: "Main administrator access is required.", status: 403 };
  }
  return { user: auth.user, profile: data };
}

export function internalError(error, fallback = "The request could not be completed.") {
  console.error("Platform request failed:", error?.message || error);
  return jsonError(fallback, 500);
}
