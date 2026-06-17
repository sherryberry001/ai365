import "server-only";

import { createClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/database.types";

/**
 * Cookie-less anonymous client for PUBLIC reads (published content only, via
 * RLS). Safe to call from build-time contexts — `sitemap()`, the RSS route,
 * and `generateStaticParams()` — where the request-scoped `cookies()` client
 * is unavailable.
 */
let _client: ReturnType<typeof createClient<Database>> | null = null;

export function publicClient() {
  if (!_client) {
    _client = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { persistSession: false } },
    );
  }
  return _client;
}
