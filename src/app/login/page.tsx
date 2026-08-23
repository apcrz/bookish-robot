"use client";

import {
   Suspense,
   useEffect,
   useRef,
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
const CODE_LENGTH = 6;
const DEFAULT_NEXT = "/sermons";

// O passo do login vive na URL, não em useState. No PWA o usuário sai pro app de
// e-mail pra buscar o código e o iOS descarta a aba; voltando, a URL traz o
// e-mail e o passo de volta em vez de cair num formulário vazio.
function codeStepUrl(email: string, next: string) {
   const params = new URLSearchParams({
      step: "code",
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

function describeSendError(error: AuthError) {
   if (error.status === 429 || error.code === "over_email_send_rate_limit") {
      return "Muitos envios seguidos. Espere alguns minutos e peça de novo.";
   }
   if (error.code === "otp_disabled") {
      return "Esse e-mail não tem acesso ao app.";
   }
   return "Não consegui enviar o e-mail. Tente de novo.";
}

function describeVerifyError(error: AuthError) {
   if (error.code === "otp_expired") {
      return "Esse código expirou. Peça um novo abaixo.";
   }
   if (error.status === 429) {
      return "Muitas tentativas seguidas. Espere um pouco.";
   }
   return "Código inválido.";
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
}: {
   initialEmail: string;
   next: string;
}) {
   const router = useRouter();
   const [email, setEmail] = useState(initialEmail);
   const [error, setError] = useState<string | null>(null);
   const [loading, setLoading] = useState(false);

   const handleSubmit = async (e: FormEvent) => {
      e.preventDefault();
      setError(null);
      setLoading(true);

      const supabase = createClient();
      // shouldCreateUser: false — sem signup self-service, usuários saem do Supabase Studio.
      const { error } = await supabase.auth.signInWithOtp({
         email,
         options: { shouldCreateUser: false },
      });

      if (error) {
         setLoading(false);
         setError(describeSendError(error));
         return;
      }

      // Sem setLoading(false): o botão fica travado até a navegação acontecer.
      router.replace(codeStepUrl(email, next));
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
               {loading ? "Enviando..." : "Enviar código"}
            </Button>

            <p className="text-xs text-muted-foreground text-center">
               Mandamos um código de 6 dígitos por e-mail. Sem senha.
            </p>
         </form>
      </Shell>
   );
}

function CodeStep({
   email,
   sentAt,
   next,
}: {
   email: string;
   sentAt: number;
   next: string;
}) {
   const router = useRouter();
   const [code, setCode] = useState("");
   const [error, setError] = useState<string | null>(null);
   const [loading, setLoading] = useState(false);
   const [cooldown, setCooldown] = useState(() =>
      Math.max(0, RESEND_SECONDS - Math.floor((Date.now() - sentAt) / 1000))
   );
   // O auto-submit dispara no 6º dígito; a trava evita uma segunda chamada se o
   // usuário colar por cima do código enquanto a primeira ainda está no ar.
   const verifying = useRef(false);

   useEffect(() => {
      if (cooldown <= 0) return;
      const id = setTimeout(() => setCooldown((c) => c - 1), 1000);
      return () => clearTimeout(id);
   }, [cooldown]);

   const verify = async (token: string) => {
      if (verifying.current) return;
      verifying.current = true;
      setError(null);
      setLoading(true);

      const supabase = createClient();
      const { error } = await supabase.auth.verifyOtp({
         email,
         token,
         type: "email",
      });

      if (error) {
         verifying.current = false;
         setLoading(false);
         setCode("");
         setError(describeVerifyError(error));
         return;
      }

      router.push(next);
      router.refresh();
   };

   const handleChange = (raw: string) => {
      const digits = raw.replace(/\D/g, "").slice(0, CODE_LENGTH);
      setCode(digits);
      if (digits.length === CODE_LENGTH) void verify(digits);
   };

   const resend = async () => {
      setError(null);
      setLoading(true);

      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOtp({
         email,
         options: { shouldCreateUser: false },
      });

      setLoading(false);

      if (error) {
         setError(describeSendError(error));
         return;
      }

      setCode("");
      setCooldown(RESEND_SECONDS);
      // Renova o `t` da URL pra o cooldown continuar certo se a aba for descartada.
      router.replace(codeStepUrl(email, next));
   };

   return (
      <Shell
         icon={<MailCheck className="h-8 w-8 text-primary mb-2" />}
         title="Confira seu e-mail"
         subtitle={
            <>
               Mandamos um código para{" "}
               <span className="text-foreground">{email}</span>
            </>
         }
      >
         <form
            onSubmit={(e) => {
               e.preventDefault();
               void verify(code);
            }}
            className="space-y-4"
         >
            <div className="space-y-1.5">
               <Label htmlFor="code">Código de 6 dígitos</Label>
               <Input
                  id="code"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  autoFocus
                  maxLength={CODE_LENGTH}
                  placeholder="000000"
                  required
                  disabled={loading}
                  value={code}
                  onChange={(e) => handleChange(e.target.value)}
                  className="text-center text-lg tracking-[0.5em]"
               />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button
               type="submit"
               className="w-full"
               disabled={loading || code.length < CODE_LENGTH}
            >
               {loading ? "Entrando..." : "Entrar"}
            </Button>

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
                  {cooldown > 0 ? `Reenviar em ${cooldown}s` : "Reenviar código"}
               </button>
            </div>
         </form>
      </Shell>
   );
}

function LoginForm() {
   const searchParams = useSearchParams();

   const next = searchParams.get("next") ?? DEFAULT_NEXT;
   const email = searchParams.get("email") ?? "";
   // `step=code` sem e-mail não tem como funcionar (verifyOtp precisa dos dois),
   // então cai de volta no formulário de e-mail em vez de travar numa tela morta.
   const onCodeStep = searchParams.get("step") === "code" && email !== "";

   if (onCodeStep) {
      return (
         <CodeStep
            key={searchParams.get("t") ?? email}
            email={email}
            sentAt={Number(searchParams.get("t")) || Date.now()}
            next={next}
         />
      );
   }

   return <EmailStep initialEmail={email} next={next} />;
}

export default function LoginPage() {
   return (
      <Suspense>
         <LoginForm />
      </Suspense>
   );
}
