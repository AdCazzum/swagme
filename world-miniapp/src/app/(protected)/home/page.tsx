import { auth } from "@/auth";
import { Page } from "@/components/PageLayout";
import { Scan } from "@/components/Scan";
import { UserInfo } from "@/components/UserInfo";
import { Verify } from "@/components/Verify";
import { VerificationProvider } from "@/contexts/VerificationContext";
import { Marble, TopBar } from "@worldcoin/mini-apps-ui-kit-react";

export default async function Home() {
  const session = await auth();

  console.log("Session:", session);

  return (
    <>
      <Page.Header className="p-0">
        <TopBar
          title="Home"
          endAdornment={
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold">{session?.user.username}</p>
              <Marble src={session?.user.profilePictureUrl} className="w-12" />
            </div>
          }
        />
      </Page.Header>
      <Page.Main className="flex flex-col items-center justify-start gap-4 mb-16">
        <UserInfo />
        <VerificationProvider>
          <Verify />
          <Scan />
        </VerificationProvider>
      </Page.Main>
    </>
  );
}
