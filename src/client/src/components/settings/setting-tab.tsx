import { Heading, HStack, SegmentGroup, Text } from "@chakra-ui/react";
import styles from "./settings.module.scss";
import { LuClock, LuLanguages, LuSunMoon } from "react-icons/lu";
import { useColorMode } from "@/providers/Chakra/color-mode-utils";
import { ThemeSwitcher } from "../switchers/theme-switcher";
import { FormattedMessage, useIntl } from "react-intl";
import { Tooltip } from "../tooltip";
import { useGlobalStore } from "@/hooks";
import { locales } from "@/i18n";

const SettingTab = () => {
  const { setColorMode } = useColorMode();
  const intl = useIntl();
  const { locale, setLocale } = useGlobalStore();

  return (
    <div className={styles._}>
      <Heading size="md">
        <FormattedMessage id="settings" />
      </Heading>
      <div className={styles._rowFields}>
        <LuSunMoon />
        <Text>
          <FormattedMessage id="theme" />
        </Text>
        <ThemeSwitcher onSwitch={setColorMode} />
      </div>
      <div className={styles._rowFields}>
        <LuLanguages />
        <Text>
          <FormattedMessage id="language" />
        </Text>
        <SegmentGroup.Root
          value={locale}
          size="sm"
          colorPalette="teal"
          onValueChange={(value) =>
            setLocale(value.value as keyof typeof locales)
          }
        >
          <SegmentGroup.Indicator />
          <SegmentGroup.Items items={Object.keys(locales)} />
        </SegmentGroup.Root>
      </div>

      <div className={styles._rowFields}>
        <Tooltip
          content={intl.formatMessage({ id: "timezone" })}
          positioning={{ placement: "bottom-start" }}
        >
          <HStack>
            <LuClock />
            <Text>
              <FormattedMessage id="timezone" />
            </Text>
          </HStack>
        </Tooltip>
        <SegmentGroup.Root defaultValue="local" size="sm" colorPalette="teal">
          <SegmentGroup.Indicator />
          <SegmentGroup.Items items={["local", "utc"]} />
        </SegmentGroup.Root>
      </div>
    </div>
  );
};

export { SettingTab };
