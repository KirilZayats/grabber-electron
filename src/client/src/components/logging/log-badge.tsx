import { Badge, type BadgeProps } from "@chakra-ui/react";

const LogBadge = <T extends string>({
  color,
  label,
}: {
  color: BadgeProps["colorPalette"];
  label: T;
}) => {
  return <Badge colorPalette={color}>{label}</Badge>;
};

export { LogBadge };
