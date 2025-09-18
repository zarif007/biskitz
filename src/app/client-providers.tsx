"use client";

import React, { useEffect, useState } from "react";
import { ThemeProvider } from "@/components/providers";
import { Header } from "@/components/Header";
import { SessionProvider } from "next-auth/react";

const ClientProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <SessionProvider>
        <Header />
        <div className="mt-14">{children}</div>
      </SessionProvider>
    </ThemeProvider>
  );
};

export default ClientProviders;
