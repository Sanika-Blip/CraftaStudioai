"use client";

import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import { ArrowRight, Code2, Cpu, Zap } from "lucide-react";

export default function LandingPage() {
  const { isLoaded, isSignedIn } = useAuth();

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col relative overflow-hidden font-sans">
      {/* Dynamic Background */}
      <div className="absolute inset-0 bg-dot-grid opacity-30 pointer-events-none" />
      
      {/* Decorative Gradients */}
      <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-[var(--primary-accent)]/10 rounded-full blur-[150px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-[var(--primary-accent)]/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Header */}
      <header className="relative z-10 p-6 sm:p-8 flex justify-between items-center max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-[var(--primary-accent)] rounded-lg flex items-center justify-center shadow-[0_0_20px_rgba(253,87,45,0.3)]">
            <span className="text-white font-bold text-xl">C</span>
          </div>
          <span className="text-xl font-bold tracking-tight">
            Crafta<span className="text-[var(--primary-accent)]">Studio</span>
          </span>
        </div>
        <nav className="flex items-center gap-4">
          {isLoaded && isSignedIn ? (
            <Link 
              href="/dashboard"
              className="px-5 py-2 text-sm font-semibold text-white bg-[var(--primary-accent)] hover:bg-[var(--primary-accent-hover)] rounded-md shadow-[0_0_15px_rgba(253,87,45,0.4)] transition-all"
            >
              Go to Dashboard
            </Link>
          ) : (
            <>
              <Link 
                href="/sign-in"
                className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Sign In
              </Link>
              <Link 
                href="/sign-up"
                className="px-5 py-2 text-sm font-semibold text-white bg-[var(--primary-accent)] hover:bg-[var(--primary-accent-hover)] rounded-md shadow-[0_0_15px_rgba(253,87,45,0.4)] transition-all"
              >
                Get Started
              </Link>
            </>
          )}
        </nav>
      </header>

      {/* Main Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 relative z-10 text-center max-w-4xl mx-auto mt-16 sm:mt-0">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 mb-8 backdrop-blur-md">
          <span className="flex h-2 w-2 rounded-full bg-[var(--primary-accent)] animate-pulse" />
          <span className="text-xs font-medium text-white/80 tracking-wide uppercase">CraftaStudio v1.0 is live</span>
        </div>
        
        <h1 className="text-5xl sm:text-7xl font-extrabold tracking-tight mb-6 bg-gradient-to-br from-white to-white/50 text-transparent bg-clip-text">
          Design Architecture.<br />Generate Code.
        </h1>
        
        <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mb-10 leading-relaxed">
          The premium workspace for software architects. Use AI-driven node graphs to effortlessly build, visualize, and generate production-ready backend code in minutes.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4">
          {isLoaded && isSignedIn ? (
            <Link 
              href="/dashboard"
              className="flex items-center gap-2 px-8 py-4 text-base font-bold text-white bg-[var(--primary-accent)] hover:bg-[var(--primary-accent-hover)] rounded-xl shadow-[0_0_25px_rgba(253,87,45,0.5)] transition-all hover:scale-105 active:scale-95"
            >
              Enter Workspace
              <ArrowRight size={20} />
            </Link>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <Link 
                  href="/sign-up"
                  className="flex items-center gap-2 px-8 py-4 text-base font-bold text-white bg-[var(--primary-accent)] hover:bg-[var(--primary-accent-hover)] rounded-xl shadow-[0_0_25px_rgba(253,87,45,0.5)] transition-all hover:scale-105 active:scale-95"
                >
                  Start Building for Free
                  <ArrowRight size={20} />
                </Link>
                <Link 
                  href="/sign-in?email_address=demo@craftastudio.com"
                  className="flex items-center gap-2 px-8 py-4 text-base font-bold text-foreground bg-[var(--surface)] border border-[var(--border)] hover:bg-white/5 rounded-xl transition-all hover:scale-105 active:scale-95 shadow-lg"
                >
                  Try Interactive Demo
                </Link>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Want to see it in action? Log in as <span className="text-[var(--primary-accent)] font-mono">demo@craftastudio.com</span>
              </p>
            </div>
          )}
        </div>

        {/* Feature Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-24 text-left w-full max-w-5xl">
          <div className="surface-card p-6 bg-surface/50 backdrop-blur-sm">
            <div className="w-12 h-12 rounded-lg bg-[var(--primary-accent)]/10 border border-[var(--primary-accent)]/20 flex items-center justify-center mb-4">
              <Cpu size={24} className="text-[var(--primary-accent)]" />
            </div>
            <h3 className="text-lg font-bold text-foreground mb-2">Visual Planning</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Drag and drop blocks to form your architecture. Let our AI planner suggest the optimal flow.
            </p>
          </div>
          <div className="surface-card p-6 bg-surface/50 backdrop-blur-sm">
            <div className="w-12 h-12 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4">
              <Code2 size={24} className="text-emerald-500" />
            </div>
            <h3 className="text-lg font-bold text-foreground mb-2">Instant Generation</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Convert your visual nodes directly into robust backend code across multiple frameworks.
            </p>
          </div>
          <div className="surface-card p-6 bg-surface/50 backdrop-blur-sm">
            <div className="w-12 h-12 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-4">
              <Zap size={24} className="text-indigo-500" />
            </div>
            <h3 className="text-lg font-bold text-foreground mb-2">Multi-Agent System</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Parallel AI agents work on distinct components of your app simultaneously to accelerate delivery.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border mt-16 py-8 text-center">
        <p className="text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} CraftaStudio. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
