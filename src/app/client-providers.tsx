"use client";

import React, { useEffect, useState } from "react";
import { ThemeProvider } from "@/components/providers";
import { Header } from "@/components/Header";

const ClientProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <Header />
      {children}
    </ThemeProvider>
  );
};

export default ClientProviders;
