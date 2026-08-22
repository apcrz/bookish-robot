import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

const DEFAULT_NEXT = "/sermons";

// `next` chega pela URL do e-mail, então trate como não confiável: só aceita
// destino no mesmo origin (bloqueia //evil.com e afins).
function safeNext(raw: string | null, origin: string) {
  if (!raw) return DEFAULT_NEXT;
  try {
    const url = new URL(raw, origin);
    if (url.origin !== origin) return DEFAULT_NEXT;
    return url.pathname + url.search;
  } catch {
    return DEFAULT_NEXT;
  }
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;

  if (tokenHash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });

    if (!error) {
      const next = safeNext(searchParams.get("next"), origin);
      return NextResponse.redirect(new URL(next, origin));
    }
  }

  const login = new URL("/login", origin);
  login.searchParams.set("erro", "link");
  return NextResponse.redirect(login);
}
