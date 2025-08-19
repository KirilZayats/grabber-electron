import { Tabs } from "@chakra-ui/react";
import { FtpForm } from "../forms/ftp-form";
import { LuLayoutGrid, LuSettings } from "react-icons/lu";
import { SettingTab } from "../settings/setting-tab";

const MainAppTabs = () => {
  return (
    <Tabs.Root
      defaultValue="ftp"
      variant="plain"
      orientation="vertical"
      w="33%"
      position="relative"
      border="none"
      zIndex={100}
    >
      <Tabs.List
        justifyContent="center"
        p="0 .5rem"
        borderRight="1px solid #e2e8f0"
      >
        <Tabs.Trigger value="ftp">
          <LuLayoutGrid />
        </Tabs.Trigger>
        <Tabs.Trigger value="settings">
          <LuSettings />
        </Tabs.Trigger>
        <Tabs.Indicator borderRadius="md" color="white" />
      </Tabs.List>
      <Tabs.Content value="ftp" display="flex" w="100%">
        <FtpForm />
      </Tabs.Content>
      <Tabs.Content value="settings" display="flex" w="100%">
        <SettingTab />
      </Tabs.Content>
    </Tabs.Root>
  );
};

export { MainAppTabs };
