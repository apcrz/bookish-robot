"use client";

import { Suspense, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BookOpen } from "lucide-react";

function LoginForm() {
   const router = useRouter();
   const searchParams = useSearchParams();
   const [email, setEmail] = useState("");
   const [password, setPassword] = useState("");
   const [error, setError] = useState<string | null>(null);
   const [loading, setLoading] = useState(false);

   const handleSubmit = async (e: FormEvent) => {
      e.preventDefault();
      setError(null);
      setLoading(true);

      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
         setLoading(false);
         setError("E-mail ou senha inválidos.");
         return;
      }

      router.push(searchParams.get("next") ?? "/sermons");
      router.refresh();
   };

   return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
         <div className="w-full max-w-sm">
            <div className="flex flex-col items-center mb-8">
               <BookOpen className="h-8 w-8 text-primary mb-2" />
               <h1 className="text-xl font-semibold">Entrar</h1>
               <p className="text-sm text-muted-foreground mt-1">Acesse sua área de sermões</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
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

               <div className="space-y-1.5">
                  <Label htmlFor="password">Senha</Label>
                  <Input
                     id="password"
                     type="password"
                     autoComplete="current-password"
                     required
                     value={password}
                     onChange={(e) => setPassword(e.target.value)}
                  />
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
