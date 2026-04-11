"use client";

import { SignUp } from "@clerk/nextjs";
import AuthLayout from "@/components/auth-layout";

export default function Page() {
  return (
    <AuthLayout>
      <SignUp path="/sign-up" routing="path" signInUrl="/sign-in" />
    </AuthLayout>
  );
}
