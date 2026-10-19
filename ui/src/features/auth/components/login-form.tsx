"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { login } from "@/features/auth/api";
import { useAuthStore } from "@/features/auth/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ArrowRight,
  Boxes,
  ChartNoAxesCombined,
  Eye,
  EyeOff,
  PackageCheck,
} from "lucide-react";
import { toast } from "sonner";

const demoAccounts = [
  { role: "Admin", email: "admin@gmail.com", password: "123456" },
  { role: "Staff", email: "staff1@stocksense.com", password: "123456" },
] as const;

export function LoginForm() {
  const router = useRouter();
  const setSession = useAuthStore((s) => s.setSession);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const mutation = useMutation({
    mutationFn: (credentials?: { email: string; password: string }) =>
      login(credentials?.email ?? email, credentials?.password ?? password),
    onSuccess: (data) => {
      setSession({ user: data.user, token: data.token });
      toast.success("Signed in successfully");
      router.replace("/dashboard");
    },
    onError: (error) => {
      toast.error(error.message || "Login failed");
    },
  });

  return (
    <Card className="w-full max-w-[440px] rounded-2xl border-border/70 bg-card shadow-xl shadow-slate-900/[0.06]">
      <CardHeader className="space-y-2 px-7 pt-8 sm:px-9 sm:pt-9">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
          Your workspace
        </p>
        <CardTitle className="text-[26px] font-semibold tracking-tight">
          Welcome back
        </CardTitle>
        <CardDescription>Sign in to your inventory workspace.</CardDescription>
      </CardHeader>
      <CardContent className="px-7 pb-8 sm:px-9 sm:pb-9">
        <form
          className="grid gap-5"
          onSubmit={(e) => {
            e.preventDefault();
            mutation.mutate(undefined);
          }}
        >
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute inset-y-0 right-0 flex w-10 items-center justify-center rounded-r-xl text-muted-foreground transition-colors hover:text-foreground"
              >
                {showPassword ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
              </button>
            </div>
          </div>
          <Button
            type="submit"
            size="xl"
            disabled={mutation.isPending}
            className="w-full"
          >
            {mutation.isPending ? "Signing in…" : "Sign in"}
          </Button>
          <div className="space-y-3 border-t pt-5">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold">Try a demo account</p>
                <span className="rounded-full bg-muted px-2 py-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                  Local demo
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {demoAccounts.map((account) => (
                  <div
                    key={account.role}
                    className="min-w-0 rounded-xl border bg-background p-3"
                  >
                    <p className="text-xs font-semibold">{account.role}</p>
                    <p className="mt-2 truncate text-[11px] text-muted-foreground">
                      {account.email}
                    </p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      Password: {account.password}
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={mutation.isPending}
                      onClick={() => mutation.mutate(account)}
                      className="mt-3 w-full justify-between px-2.5 text-xs"
                    >
                      {mutation.isPending
                        ? "Signing in…"
                        : `Continue as ${account.role}`}
                      {!mutation.isPending && (
                        <ArrowRight className="size-3.5" />
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            </div>
        </form>
      </CardContent>
    </Card>
  );
}

export function LoginBrandPanel({
  title = "Know what you have. Plan what you need.",
  description = "Inventory management for your team.",
}: {
  title?: string;
  description?: string;
}) {
  return (
    <div className="relative hidden min-h-[560px] w-full max-w-[480px] flex-col justify-between overflow-hidden rounded-[28px] bg-[#102c28] p-10 text-white shadow-2xl shadow-emerald-950/15 lg:flex">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-20 -top-20 size-64 rounded-full bg-emerald-400/25 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-24 -left-16 size-64 rounded-full bg-teal-400/20 blur-3xl"
      />
      <div className="relative flex items-center gap-3">
        <div className="flex size-11 items-center justify-center rounded-2xl bg-emerald-300 text-emerald-950 shadow-lg shadow-black/10">
          <PackageCheck className="size-6" />
        </div>
        <div>
          <span className="text-lg font-bold tracking-tight">Stock Sense</span>
          <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-emerald-100/65">
            Inventory workspace
          </p>
        </div>
      </div>
      <div className="relative space-y-7">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-xs text-emerald-100/80">
          <span className="size-1.5 rounded-full bg-emerald-300" /> Inventory,
          in sync
        </div>
        <h2 className="max-w-sm text-[34px] font-semibold leading-[1.15] tracking-tight">
          {title}
        </h2>
        <ul className="space-y-4">
          <li className="flex items-start gap-3 text-sm text-emerald-50/80">
            <Boxes className="mt-0.5 size-[18px] shrink-0 text-emerald-300" />
            <span>Track products, stock, sales and suppliers.</span>
          </li>
          <li className="flex items-start gap-3 text-sm text-emerald-50/80">
            <ChartNoAxesCombined className="mt-0.5 size-[18px] shrink-0 text-emerald-300" />
            <span>Use demand forecasts to plan replenishment.</span>
          </li>
        </ul>
      </div>
      <p className="relative text-xs text-emerald-100/50">{description}</p>
    </div>
  );
}
