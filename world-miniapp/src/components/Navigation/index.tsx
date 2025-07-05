"use client";

import { TabItem, Tabs } from "@worldcoin/mini-apps-ui-kit-react";
import { Home } from "iconoir-react";
import { useState } from "react";

export const Navigation = () => {
  const [value, setValue] = useState("home");

  return (
    <Tabs value={value} onValueChange={setValue}>
      <TabItem value="home" icon={<Home />} label="Home" />
    </Tabs>
  );
};
