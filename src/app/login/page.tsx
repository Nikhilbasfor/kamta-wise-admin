"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAdminAuth } from "@/context/AdminAuthContext";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const { user, signIn, loading } = useAdminAuth();
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [signingIn, setSigningIn] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.replace("/dashboard");
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSigningIn(true);

    const targetPin = process.env.NEXT_PUBLIC_ADMIN_PIN;
    if (pin !== targetPin) {
      setError("Incorrect PIN");
      setSigningIn(false);
      return;
    }

    try {
      const email = process.env.NEXT_PUBLIC_ADMIN_FIREBASE_EMAIL || "";
      const password = process.env.NEXT_PUBLIC_ADMIN_FIREBASE_PASSWORD || "";
      await signIn(email, password);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err?.message || "Firebase login failed");
      setSigningIn(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4">
      <Card className="w-full max-w-md bg-slate-900 border-slate-800 text-slate-100 shadow-xl">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-light tracking-wide text-center uppercase">
            Kamta Wise Admin
          </CardTitle>
          <CardDescription className="text-slate-400 text-center text-xs">
            Enter your security PIN to access the admin portal
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 bg-red-950/50 border border-red-800 text-red-200 text-xs rounded-md text-center">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="pin" className="text-slate-300 text-xs uppercase tracking-wider">
                Security PIN
              </Label>
              <Input
                id="pin"
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                placeholder="••••••"
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                required
                className="bg-slate-950 border-slate-800 text-slate-100 placeholder:text-slate-700 focus-visible:ring-slate-700 text-center tracking-[0.5em] text-lg"
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button
              type="submit"
              disabled={signingIn || loading}
              className="w-full bg-slate-100 hover:bg-slate-200 text-slate-950 font-medium uppercase tracking-widest text-xs py-5"
            >
              {signingIn ? "Verifying..." : "Access Dashboard"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
