import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LogIn, AlertCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

import { ThemeToggle } from "@/components/ui/theme-toggle";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const success = await login(email, password);
      if (!success) {
        setError("Email ou senha inválidos");
      }
    } catch (err) {
      setError("Erro ao fazer login. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/30 to-background p-4 relative">
      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle collapsed={true} />
      </div>

      <Card className="w-full max-w-md border border-border/80 shadow-xl shadow-black/5 dark:shadow-black/30 backdrop-blur-sm">
        <CardHeader className="text-center space-y-2 pb-6">
          <div className="mx-auto h-12 w-12 rounded-2xl bg-primary/15 border border-primary/30 flex items-center justify-center text-2xl shadow-inner mb-1">
            🥗
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-foreground">
            Merenda Flow
          </CardTitle>
          <CardDescription className="text-muted-foreground text-sm">
            Sistema de Gestão de Contratos de Merenda Escolar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm font-semibold">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                className="h-11 bg-background/80"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-sm font-semibold">
                Senha
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="h-11 bg-background/80"
                required
              />
            </div>

            {error && (
              <Alert variant="destructive" className="py-2.5">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs font-medium">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              className="w-full h-11 text-base font-semibold shadow-md shadow-primary/20 mt-2"
              disabled={loading}
            >
              <LogIn className="mr-2 h-4 w-4" />
              {loading ? "Entrando..." : "Entrar no Sistema"}
            </Button>
          </form>

          <div className="mt-8 pt-4 border-t border-border/60 text-sm text-muted-foreground text-center space-y-1">
            <p className="font-medium text-foreground/80">
              SEDUC • Prefeitura Municipal de Campina Grande
            </p>
            <p className="text-xs">
              Precisa de acesso? Contate a equipe de TI ou coordenação.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
