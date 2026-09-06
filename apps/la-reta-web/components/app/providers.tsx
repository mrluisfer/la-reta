"use client";

import * as React from "react";
import { Provider as JotaiProvider } from "jotai";
import { ThemeProvider } from "next-themes";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { MotionProvider } from "@/components/motion/motion-provider";

export const Providers = ({
  children,
}: {
  readonly children: React.ReactNode;
}) => {
  // One QueryClient per browser session. Data is server-rendered, so default to
  // not refetching it the instant a component mounts.
  const [queryClient] = React.useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 30_000, refetchOnWindowFocus: false },
        },
      })
  );

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
      disableTransitionOnChange
    >
      <QueryClientProvider client={queryClient}>
        <JotaiProvider>
          <TooltipProvider>
            <MotionProvider>{children}</MotionProvider>
          </TooltipProvider>
        </JotaiProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
};
