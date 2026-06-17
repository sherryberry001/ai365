/**
 * Create (or reset) an admin login for the platform.
 *   node --env-file=.env.local scripts/create-admin.mjs [email] [password]
 *
 * Uses the service-role key to create a confirmed auth user and promote its
 * profile to `admin`. Idempotent: re-running resets the password.
 */
import { randomBytes } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
);

const email =
  process.argv[2] || process.env.NEXT_PUBLIC_OWNER_EMAIL || "admin@ai365.local";
const password =
  process.argv[3] || `AI365-${randomBytes(5).toString("hex")}`;
const fullName = process.env.NEXT_PUBLIC_OWNER_NAME || "Shehryar Hassan";

async function findUserByEmail(addr) {
  // listUsers is paginated; scan a few pages.
  for (let page = 1; page <= 5; page++) {
    const { data } = await sb.auth.admin.listUsers({ page, perPage: 200 });
    const u = data.users.find(
      (x) => (x.email ?? "").toLowerCase() === addr.toLowerCase(),
    );
    if (u) return u;
    if (data.users.length < 200) break;
  }
  return null;
}

async function run() {
  let userId;
  const { data: created, error } = await sb.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });

  if (error) {
    const existing = await findUserByEmail(email);
    if (!existing) throw error;
    userId = existing.id;
    await sb.auth.admin.updateUserById(userId, {
      password,
      email_confirm: true,
    });
    console.log("• user existed — password reset");
  } else {
    userId = created.user.id;
    console.log("• user created");
  }

  // Ensure a profile row exists and is admin (trigger usually creates it).
  const { data: prof } = await sb
    .from("profiles")
    .select("id")
    .eq("id", userId)
    .maybeSingle();
  if (prof) {
    await sb
      .from("profiles")
      .update({ role: "admin", full_name: fullName })
      .eq("id", userId);
  } else {
    await sb
      .from("profiles")
      .insert({ id: userId, email, full_name: fullName, role: "admin" });
  }

  console.log("\n=========================================");
  console.log(" ADMIN LOGIN — sign in at /login");
  console.log("=========================================");
  console.log(" Email:    ", email);
  console.log(" Password: ", password);
  console.log("=========================================");
  console.log(" Role: admin  ·  change the password after first login.");
}

run().catch((e) => {
  console.error("FAILED:", e.message);
  process.exit(1);
});
