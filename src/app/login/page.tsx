"use client";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { authApi } from "@/lib/api";

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState<"user" | "trainer">("user");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl");

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      if (!isLogin) {
        // Handle registration first
        await authApi.register({ email, password, fullName, role });
      }

      // Perform NextAuth signIn
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid credentials. Please try again.");
        setIsLoading(false);
      } else {
        router.refresh();
        if (callbackUrl) {
          router.push(callbackUrl);
        } else if (!isLogin && role === "trainer") {
          router.push("/trainer/dashboard");
        } else {
          router.push("/dashboard");
        }
      }
    } catch (err: any) {
      setError(err.message || "Authentication failed");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-cream">
      <div className="w-full md:w-1/2 flex items-center justify-center p-8 md:p-16">
        <div className="max-w-md w-full space-y-8">
          <div className="space-y-2 text-center md:text-left">
            <h1 className="text-4xl font-bold tracking-tight text-warm-dark">
              {isLogin ? "Welcome back" : "Create your account"}
            </h1>
            <p className="text-warm-gray">
              {isLogin
                ? "Enter your credentials to access your dashboard"
                : "Join the Askal community and start your journey"}
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-xl text-sm font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleAuth} className="space-y-5">
            {!isLogin && (
              <Input
                label="Full Name"
                placeholder="John Doe"
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            )}
            <Input
              label="Email Address"
              placeholder="name@example.com"
              type="text"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Input
              label="Password"
              placeholder="--------"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            {!isLogin && (
              <div className="space-y-3">
                <label className="text-sm font-medium text-warm-gray ml-1">
                  I am a...
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <Card
                    onClick={() => setRole("user")}
                    selected={role === "user"}
                    className="p-4 flex flex-col items-center justify-center gap-2"
                  >
                    <span className="text-sm font-semibold">Fitness User</span>
                  </Card>
                  <Card
                    onClick={() => setRole("trainer")}
                    selected={role === "trainer"}
                    className="p-4 flex flex-col items-center justify-center gap-2"
                  >
                    <span className="text-sm font-semibold">Professional Trainer</span>
                  </Card>
                </div>
              </div>
            )}

            <Button fullWidth type="submit" disabled={isLoading}>
              {isLoading ? "Processing..." : (isLogin ? "Sign In" : "Create Account")}
            </Button>
          </form>

          <div className="text-center">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-primary hover:text-primary-hover font-medium transition-colors disabled:opacity-50"
              disabled={isLoading}
            >
              {isLogin
                ? "Don't have an account? Register"
                : "Already have an account? Login"}
            </button>
          </div>
        </div>
      </div>

      <div className="hidden md:flex md:w-1/2 bg-cream-dark relative overflow-hidden items-center justify-center p-16">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-accent/10 z-0" />
        <div className="relative z-10 space-y-6 text-center">
          <div className="w-24 h-24 bg-primary rounded-2xl mx-auto flex items-center justify-center shadow-lg">
            <span className="text-4xl font-bold text-white">A</span>
          </div>
          <div className="space-y-2">
            <h2 className="text-5xl font-bold tracking-tight text-warm-dark">ASKAL <span className="text-primary">FIT</span></h2>
            <p className="text-lg text-warm-gray max-w-sm mx-auto">
              Premium personal training and performance tracking.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
