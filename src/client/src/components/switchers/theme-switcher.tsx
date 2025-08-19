import type { ColorMode } from "@/providers/Chakra/color-mode-utils";
import { Icon, Switch } from "@chakra-ui/react";
import { useState } from "react";
import { FaMoon, FaSun } from "react-icons/fa";

const ThemeSwitcher = ({
  onSwitch,
}: {
  onSwitch: (colorMode: ColorMode) => void;
}) => {
  const [checked, setChecked] = useState(false);

  return (
    <Switch.Root
      colorPalette="teal"
      size="lg"
      checked={checked}
      onCheckedChange={() => {
        setChecked((prev) => {
          onSwitch(!prev ? "light" : "dark");
          return !prev;
        });
      }}
    >
      <Switch.HiddenInput />
      <Switch.Control>
        <Switch.Thumb />
        <Switch.Indicator fallback={<Icon as={FaMoon} color="teal" />}>
          <Icon as={FaSun} color="yellow.400" />
        </Switch.Indicator>
      </Switch.Control>
    </Switch.Root>
  );
};
export { ThemeSwitcher };
