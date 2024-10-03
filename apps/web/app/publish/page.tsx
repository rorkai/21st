"use client";

import React, { useEffect } from "react";
import { useUser, SignedIn, SignedOut, RedirectToSignIn } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import ComponentForm from "@/components/ComponentForm";
import { LoadingSpinner } from '@/components/Loading';
import { Header } from "@/components/Header";

export default function PublishPage() {
  const { isLoaded, isSignedIn } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push("/sign-in?redirect_url=/publish");
    }
  }, [isLoaded, isSignedIn, router]);

  if (!isLoaded) {
    return <LoadingSpinner />;
  }

  return (
    <>
      <Header />
      <SignedIn>
        <div className="container mx-auto p-4 flex flex-col items-center justify-center h-screen">
          <h1 className="text-2xl font-bold mb-4">
            Publish new component
          </h1>
          <ComponentForm />
        </div>
      </SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </>
  );
}
