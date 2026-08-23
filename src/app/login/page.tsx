"use client";

import {
   Suspense,
   useEffect,
   useState,
   type FormEvent,
   type ReactNode,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { AuthError } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BookOpen, MailCheck } from "lucide-react";

const RESEND_SECONDS = 60;
const DEFAULT_NEXT = "/sermons";

// O passo do login vive na URL, não em useState. No PWA o usuário sai pro app de
// e-mail e o iOS descarta a aba; voltando, a URL traz o e-mail e o passo de volta
// em vez de cair num formulário vazio.
function sentStepUrl(email: string, next: string) {
   const params = new URLSearchParams({
      enviado: "1",
      email,
      t: String(Date.now()),
   });
   if (next !== DEFAULT_NEXT) params.set("next", next);
   return `/login?${params}`;
}

function emailStepUrl(email: string, next: string) {
   const params = new URLSearchParams();
   if (email) params.set("email", email);
   if (next !== DEFAULT_NEXT) params.set("next", next);
   const query = params.toString();
   return query ? `/login?${query}` : "/login";
}

// emailRedirectTo sobrepõe o Site URL do projeto. Derivando do origin atual, o
// e-mail pedido em localhost volta pra localhost e o pedido em produção volta
// pra produção — sem depender de config de dashboard estar certa.
function callbackUrl(next: string) {
   const url = new URL("/auth/callback", window.location.origin);
   if (next !== DEFAULT_NEXT) url.searchParams.set("next", next);
   return url.toString();
}

async function sendLink(email: string, next: string) {
   const supabase = createClient();
   // shouldCreateUser: false — sem signup self-service, usuários saem do Supabase Studio.
   return supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: false, emailRedirectTo: callbackUrl(next) },
   });
}

function describeSendError(error: AuthError) {
   if (error.status === 429 || error.code === "over_email_send_rate_limit") {
      return "Muitos envios seguidos. Espere alguns minutos e peça de novo.";
   }
   if (error.code === "otp_disabled") {
      return "Esse e-mail não tem acesso ao app.";
   }
   return "Não consegui enviar o e-mail. Tente de novo.";
}

function Shell({
   icon,
   title,
   subtitle,
   children,
}: {
   icon: ReactNode;
   title: string;
   subtitle: ReactNode;
   children: ReactNode;
}) {
   return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
         <div className="w-full max-w-sm">
            <div className="flex flex-col items-center mb-8">
               {icon}
               <h1 className="text-xl font-semibold">{title}</h1>
               <p className="text-sm text-muted-foreground mt-1 text-center">
                  {subtitle}
               </p>
            </div>
            {children}
         </div>
      </div>
   );
}

function EmailStep({
   initialEmail,
   next,
   linkFailed,
}: {
   initialEmail: string;
   next: string;
   linkFailed: boolean;
}) {
   const router = useRouter();
   const [email, setEmail] = useState(initialEmail);
   const [loading, setLoading] = useState(false);
   const [error, setError] = useState<string | null>(
      linkFailed ? "Esse link expirou ou já foi usado. Peça um novo." : null
   );

   const handleSubmit = async (e: FormEvent) => {
      e.preventDefault();
      setError(null);
      setLoading(true);

      const { error } = await sendLink(email, next);

      if (error) {
         setLoading(false);
         setError(describeSendError(error));
         return;
      }

      // Sem setLoading(false): o botão fica travado até a navegação acontecer.
      router.replace(sentStepUrl(email, next));
   };

   return (
      <Shell
         icon={<BookOpen className="h-8 w-8 text-primary mb-2" />}
         title="Entrar"
         subtitle="Acesse sua área de sermões"
      >
         <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
               <Label htmlFor="email">E-mail</Label>
               <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  autoFocus
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
               />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button type="submit" className="w-full" disabled={loading}>
               {loading ? "Enviando..." : "Enviar link de acesso"}
            </Button>

            <p className="text-xs text-muted-foreground text-center">
               Mandamos um link por e-mail. Sem senha.
            </p>
         </form>
      </Shell>
   );
}

function SentStep({
   email,
   sentAt,
   next,
}: {
   email: string;
   sentAt: number;
   next: string;
}) {
   const router = useRouter();
   const [loading, setLoading] = useState(false);
   const [error, setError] = useState<string | null>(null);
   const [cooldown, setCooldown] = useState(() =>
      Math.max(0, RESEND_SECONDS - Math.floor((Date.now() - sentAt) / 1000))
   );

   useEffect(() => {
      if (cooldown <= 0) return;
      const id = setTimeout(() => setCooldown((c) => c - 1), 1000);
      return () => clearTimeout(id);
   }, [cooldown]);

   const resend = async () => {
      setError(null);
      setLoading(true);

      const { error } = await sendLink(email, next);

      setLoading(false);

      if (error) {
         setError(describeSendError(error));
         return;
      }

      setCooldown(RESEND_SECONDS);
      // Renova o `t` da URL pro cooldown continuar certo se a aba for descartada.
      router.replace(sentStepUrl(email, next));
   };

   return (
      <Shell
         icon={<MailCheck className="h-8 w-8 text-primary mb-2" />}
         title="Confira seu e-mail"
         subtitle={
            <>
               Mandamos um link de acesso para{" "}
               <span className="text-foreground">{email}</span>
            </>
         }
      >
         <div className="space-y-4">
            <p className="text-sm text-muted-foreground text-center">
               Abra o e-mail e clique em <span className="text-foreground">Sign in</span>.
               O link vale por 1 hora e só funciona uma vez.
            </p>

            {error && (
               <p className="text-sm text-destructive text-center">{error}</p>
            )}

            <div className="flex items-center justify-between text-xs text-muted-foreground">
               <button
                  type="button"
                  onClick={() => router.replace(emailStepUrl(email, next))}
                  className="hover:text-foreground"
               >
                  Trocar e-mail
               </button>
               <button
                  type="button"
                  onClick={resend}
                  disabled={loading || cooldown > 0}
                  className="hover:text-foreground disabled:hover:text-muted-foreground"
               >
                  {loading
                     ? "Enviando..."
                     : cooldown > 0
                       ? `Reenviar em ${cooldown}s`
                       : "Reenviar link"}
               </button>
            </div>
         </div>
      </Shell>
   );
}

function LoginForm() {
   const searchParams = useSearchParams();

   const next = searchParams.get("next") ?? DEFAULT_NEXT;
   const email = searchParams.get("email") ?? "";
   // `enviado=1` sem e-mail não tem como funcionar (o reenvio precisa dele),
   // então cai de volta no formulário em vez de travar numa tela morta.
   const sent = searchParams.get("enviado") === "1" && email !== "";

   if (sent) {
      return (
         <SentStep
            key={searchParams.get("t") ?? email}
            email={email}
            sentAt={Number(searchParams.get("t")) || Date.now()}
            next={next}
         />
      );
   }

   return (
      <EmailStep
         initialEmail={email}
         next={next}
         linkFailed={searchParams.get("erro") === "link"}
      />
   );
}

export default function LoginPage() {
   return (
      <Suspense>
         <LoginForm />
      </Suspense>
   );
}
