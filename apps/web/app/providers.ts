"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { ClerkProvider } from "@clerk/nextjs";
import React, { ReactNode } from "react";

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps): JSX.Element {
  const [queryClient] = useState(() => new QueryClient());

  return React.createElement(
    QueryClientProvider,
    { client: queryClient },
    React.createElement(ClerkProvider, null, children)
  );
}