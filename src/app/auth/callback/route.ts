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

// O template de e-mail é o padrão do Supabase (customizar exige SMTP próprio),
// então o link passa pelo /auth/v1/verify e volta aqui com `?code=` do PKCE.
export async function GET(request: NextRequest) {
   const { searchParams, origin } = request.nextUrl;
   const code = searchParams.get("code");

   if (code) {
      const supabase = await createClient();
      const { error } = await supabase.auth.exchangeCodeForSession(code);

      if (!error) {
         const next = safeNext(searchParams.get("next"), origin);
         return NextResponse.redirect(new URL(next, origin));
      }
   }

   const login = new URL("/login", origin);
   login.searchParams.set("erro", "link");
   return NextResponse.redirect(login);
}
