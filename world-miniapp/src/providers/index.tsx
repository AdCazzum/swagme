"use client";
import { MiniKitProvider } from "@worldcoin/minikit-js/minikit-provider";
import { Session } from "next-auth";
import { SessionProvider } from "next-auth/react";
import dynamic from "next/dynamic";
import type { ReactNode } from "react";

const ErudaProvider = dynamic(
  () => import("@/providers/Eruda").then((c) => c.ErudaProvider),
  { ssr: false }
);

interface ClientProvidersProps {
  children: ReactNode;
  session: Session | null;
}

export default function ClientProviders({
  children,
  session,
}: ClientProvidersProps) {
  return (
    <ErudaProvider>
      <MiniKitProvider>
        <SessionProvider session={session}>{children}</SessionProvider>
      </MiniKitProvider>
    </ErudaProvider>
  );
}
