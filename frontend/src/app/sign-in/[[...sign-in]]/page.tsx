"use client";

import { SignIn } from "@clerk/nextjs";
import AuthLayout from "@/components/auth-layout";

export default function Page() {
  return (
    <AuthLayout>
      <SignIn path="/sign-in" routing="path" signUpUrl="/sign-up" fallbackRedirectUrl="/dashboard" />
    </AuthLayout>
  );
}