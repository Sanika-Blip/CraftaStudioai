"use client";

import AuthLayout from "@/components/auth-layout";
import Link from "next/link";
import { ArrowRight, GitBranch, Globe } from "lucide-react";

export default function SignInPage() {
  return (
    <AuthLayout>
      <div className="space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold tracking-tight">Welcome Back</h1>
          <p className="text-muted-foreground">
            Continue your architectural journey with CraftaStudio.
          </p>
        </div>

        {/* 
          SOCIAL LOGIN BUTTONS
          These are styled for a premium feel. 
          When adding Clerk, you can replace these with <SignIn path="/sign-in" />
        */}
        <div className="grid grid-cols-2 gap-4">
          <button className="flex items-center justify-center gap-2 h-11 border border-border rounded-lg bg-surface hover:bg-muted transition-colors font-medium text-sm">
            <GitBranch className="w-4 h-4" />
            GitHub
          </button>
          <button className="flex items-center justify-center gap-2 h-11 border border-border rounded-lg bg-surface hover:bg-muted transition-colors font-medium text-sm">
            <Globe className="w-4 h-4" />
            Google
          </button>
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-surface px-2 text-muted-foreground whitespace-nowrap">
              Or continue with email
            </span>
          </div>
        </div>

        {/* MOCK FORM */}
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Email Address
            </label>
            <input
              type="email"
              placeholder="name@company.com"
              className="flex h-11 w-full rounded-lg border border-border bg-transparent px-4 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-accent focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all font-mono"
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium leading-none">Password</label>
              <Link
                href="/forgot-password"
                className="text-xs text-primary-accent hover:underline font-medium"
              >
                Forgot password?
              </Link>
            </div>
            <input
              type="password"
              placeholder="••••••••"
              className="flex h-11 w-full rounded-lg border border-border bg-transparent px-4 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-accent focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all"
            />
          </div>
          <button className="w-full h-11 rounded-lg bg-primary-accent text-white font-bold text-sm shadow-[0_10px_20px_-10px_rgba(253,87,45,0.4)] hover:shadow-[0_15px_25px_-10px_rgba(253,87,45,0.5)] active:scale-[0.98] transition-all flex items-center justify-center gap-2 group">
            Sign In
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        <div className="text-center text-sm">
          <span className="text-muted-foreground">Don&apos;t have an account? </span>
          <Link
            href="/sign-up"
            className="text-primary-accent font-bold hover:underline"
          >
            Create one
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
}
