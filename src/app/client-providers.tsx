"use client";

import React from "react";
import { ThemeProvider } from "@/components/providers";
import { SessionProvider } from "next-auth/react";

const ClientProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <SessionProvider>{children}</SessionProvider>
    </ThemeProvider>
  );
};

export default ClientProviders;
