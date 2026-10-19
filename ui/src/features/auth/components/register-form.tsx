"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { register } from "@/features/auth/api";
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
import { toast } from "sonner";

export function RegisterForm() {
  const router = useRouter();
  const setSession = useAuthStore((state) => state.setSession);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const mutation = useMutation({
    mutationFn: () =>
      register({
        name: name.trim(),
        email: email.trim(),
        password,
      }),
    onSuccess: (data) => {
      setSession({ token: data.token, user: data.user });
      toast.success("Account created successfully");
      router.replace("/dashboard");
    },
    onError: (error) => {
      toast.error(error.message || "Registration failed");
    },
  });

  return (
    <Card className="w-full max-w-[440px] rounded-2xl border-border/70 bg-card shadow-xl shadow-slate-900/[0.06]">
      <CardHeader className="space-y-2 px-7 pt-8 sm:px-9 sm:pt-9">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
          Get started
        </p>
        <CardTitle className="text-[26px] font-semibold tracking-tight">
          Create your account
        </CardTitle>
        <CardDescription>
          Create a staff account. An administrator can assign roles later.
        </CardDescription>
      </CardHeader>
      <CardContent className="px-7 pb-8 sm:px-9 sm:pb-9">
        <form
          className="grid gap-5"
          onSubmit={(e) => {
            e.preventDefault();
            mutation.mutate();
          }}
        >
          <div className="grid gap-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              placeholder="Jane Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
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
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
            />
          </div>
          <Button
            type="submit"
            size="xl"
            disabled={mutation.isPending}
            className="w-full"
          >
            {mutation.isPending ? "Creating…" : "Create account"}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              Sign in
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
