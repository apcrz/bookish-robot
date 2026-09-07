"use client";

import { Suspense, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { AuthError } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BookOpen, Eye, EyeOff } from "lucide-react";

const DEFAULT_NEXT = "/sermons";

// `next` vem da query string, então trate como não confiável: só caminho do
// próprio app (bloqueia //evil.com e URLs absolutas).
function safeNext(raw: string | null) {
   if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return DEFAULT_NEXT;
   return raw;
}

function describeError(error: AuthError) {
   if (error.code === "invalid_credentials") {
      return "E-mail ou senha incorretos.";
   }
   if (error.code === "email_not_confirmed") {
      return "Esse e-mail ainda não foi confirmado no Supabase.";
   }
   if (error.code === "user_banned") {
      return "Esse acesso está bloqueado.";
   }
   if (error.status === 429) {
      return "Muitas tentativas seguidas. Espere um pouco.";
   }
   return "Não consegui entrar. Tente de novo.";
}

function LoginForm() {
   const router = useRouter();
   const searchParams = useSearchParams();
   const next = safeNext(searchParams.get("next"));

   const [email, setEmail] = useState("");
   const [password, setPassword] = useState("");
   const [showPassword, setShowPassword] = useState(false);
   const [loading, setLoading] = useState(false);
   const [error, setError] = useState<string | null>(null);

   const handleSubmit = async (e: FormEvent) => {
      e.preventDefault();
      setError(null);
      setLoading(true);

      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
         setLoading(false);
         setError(describeError(error));
         return;
      }

      // Navegação dura de propósito: o cookie de sessão acabou de ser gravado no
      // browser e o proxy.ts lê ele no servidor. Recarregando a página inteira
      // não tem chance de o /sermons ser pedido antes do cookie estar valendo.
      // Sem setLoading(false): o botão fica travado até a navegação acontecer.
      window.location.assign(next);
   };

   return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
         <div className="w-full max-w-sm">
            <div className="flex flex-col items-center mb-8">
               <BookOpen className="h-8 w-8 text-primary mb-2" />
               <h1 className="text-xl font-semibold">Entrar</h1>
               <p className="text-sm text-muted-foreground mt-1 text-center">
                  Acesse sua área de sermões
               </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
               <div className="space-y-1.5">
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                     id="email"
                     name="email"
                     type="email"
                     autoComplete="email"
                     autoFocus
                     required
                     value={email}
                     onChange={(e) => setEmail(e.target.value)}
                  />
               </div>

               <div className="space-y-1.5">
                  <Label htmlFor="password">Senha</Label>
                  <div className="relative">
                     <Input
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        autoComplete="current-password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pr-10"
                     />
                     <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full w-10 text-muted-foreground hover:text-foreground"
                        onClick={() => setShowPassword((v) => !v)}
                        aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                     >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                     </Button>
                  </div>
               </div>

               {error && <p className="text-sm text-destructive">{error}</p>}

               <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Entrando..." : "Entrar"}
               </Button>
            </form>
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
