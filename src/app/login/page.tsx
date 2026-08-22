"use client";

import { Suspense, useEffect, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { AuthError } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BookOpen, Eye, EyeOff, MailCheck } from "lucide-react";

const RESEND_SECONDS = 60;

function describeSendError(error: AuthError) {
   if (error.status === 429 || error.code === "over_email_send_rate_limit") {
      return "Muitos envios seguidos. Espere alguns minutos e peça de novo.";
   }
   if (error.code === "otp_disabled") {
      return "Esse e-mail não tem acesso ao app.";
   }
   return "Não consegui enviar o e-mail. Tente de novo.";
}

function LoginForm() {
   const router = useRouter();
   const searchParams = useSearchParams();
   const next = searchParams.get("next") ?? "/sermons";

   const [step, setStep] = useState<"email" | "code">("email");
   const [usePassword, setUsePassword] = useState(false);
   const [email, setEmail] = useState("");
   const [code, setCode] = useState("");
   const [password, setPassword] = useState("");
   const [showPassword, setShowPassword] = useState(false);
   const [error, setError] = useState<string | null>(
      searchParams.get("erro") === "link"
         ? "Esse link expirou ou já foi usado. Peça um acesso novo."
         : null
   );
   const [loading, setLoading] = useState(false);
   const [cooldown, setCooldown] = useState(0);

   useEffect(() => {
      if (cooldown <= 0) return;
      const id = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(id);
   }, [cooldown]);

   const goToApp = () => {
      router.push(next);
      router.refresh();
   };

   const sendAccess = async () => {
      setError(null);
      setLoading(true);

      const supabase = createClient();
      // shouldCreateUser: false — sem signup self-service, usuários saem do Supabase Studio.
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
      setStep("code");
      setCooldown(RESEND_SECONDS);
   };

   const handleEmailSubmit = async (e: FormEvent) => {
      e.preventDefault();

      if (!usePassword) {
         await sendAccess();
         return;
      }

      setError(null);
      setLoading(true);

      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
         setLoading(false);
         setError("E-mail ou senha inválidos.");
         return;
      }

      goToApp();
   };

   const handleCodeSubmit = async (e: FormEvent) => {
      e.preventDefault();
      setError(null);
      setLoading(true);

      const supabase = createClient();
      const { error } = await supabase.auth.verifyOtp({
         email,
         token: code.trim(),
         type: "email",
      });

      if (error) {
         setLoading(false);
         setError("Código inválido ou expirado.");
         return;
      }

      goToApp();
   };

   return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
         <div className="w-full max-w-sm">
            <div className="flex flex-col items-center mb-8">
               {step === "code" ? (
                  <MailCheck className="h-8 w-8 text-primary mb-2" />
               ) : (
                  <BookOpen className="h-8 w-8 text-primary mb-2" />
               )}
               <h1 className="text-xl font-semibold">
                  {step === "code" ? "Confira seu e-mail" : "Entrar"}
               </h1>
               <p className="text-sm text-muted-foreground mt-1 text-center">
                  {step === "code" ? (
                     <>
                        Mandamos um link e um código para{" "}
                        <span className="text-foreground">{email}</span>
                     </>
                  ) : (
                     "Acesse sua área de sermões"
                  )}
               </p>
            </div>

            {step === "email" ? (
               <form onSubmit={handleEmailSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                     <Label htmlFor="email">E-mail</Label>
                     <Input
                        id="email"
                        type="email"
                        autoComplete="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                     />
                  </div>

                  {usePassword && (
                     <div className="space-y-1.5">
                        <Label htmlFor="password">Senha</Label>
                        <div className="relative">
                           <Input
                              id="password"
                              type={showPassword ? "text" : "password"}
                              autoComplete="current-password"
                              required
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              className="pr-10"
                           />
                           <button
                              type="button"
                              onClick={() => setShowPassword((v) => !v)}
                              aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                              className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground"
                           >
                              {showPassword ? (
                                 <EyeOff className="h-4 w-4" />
                              ) : (
                                 <Eye className="h-4 w-4" />
                              )}
                           </button>
                        </div>
                     </div>
                  )}

                  {error && <p className="text-sm text-destructive">{error}</p>}

                  <Button type="submit" className="w-full" disabled={loading}>
                     {loading
                        ? usePassword
                           ? "Entrando..."
                           : "Enviando..."
                        : usePassword
                          ? "Entrar"
                          : "Enviar acesso"}
                  </Button>

                  <button
                     type="button"
                     onClick={() => {
                        setUsePassword((v) => !v);
                        setPassword("");
                        setError(null);
                     }}
                     className="w-full text-xs text-muted-foreground hover:text-foreground"
                  >
                     {usePassword ? "Entrar com link por e-mail" : "Entrar com senha"}
                  </button>
               </form>
            ) : (
               <form onSubmit={handleCodeSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                     <Label htmlFor="code">
                        Clique no link do e-mail — ou digite o código
                     </Label>
                     <Input
                        id="code"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        autoFocus
                        maxLength={6}
                        placeholder="000000"
                        required
                        value={code}
                        onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                        className="text-center text-lg tracking-[0.5em]"
                     />
                  </div>

                  {error && <p className="text-sm text-destructive">{error}</p>}

                  <Button
                     type="submit"
                     className="w-full"
                     disabled={loading || code.length < 6}
                  >
                     {loading ? "Entrando..." : "Entrar"}
                  </Button>

                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                     <button
                        type="button"
                        onClick={() => {
                           setStep("email");
                           setError(null);
                        }}
                        className="hover:text-foreground"
                     >
                        Trocar e-mail
                     </button>
                     <button
                        type="button"
                        onClick={sendAccess}
                        disabled={loading || cooldown > 0}
                        className="hover:text-foreground disabled:hover:text-muted-foreground"
                     >
                        {cooldown > 0 ? `Reenviar em ${cooldown}s` : "Reenviar"}
                     </button>
                  </div>
               </form>
            )}
         </div>
      </div>
   );
}

export default function LoginPage() {
   return (
      <Suspense>
         <LoginForm />
      </Suspense>
   );
}
