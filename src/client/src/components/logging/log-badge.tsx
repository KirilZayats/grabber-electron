import { Badge } from "@chakra-ui/react";

const LogBadge = ({ type }: { type: LogType }) => {
  return (
    <Badge
      colorPalette={
        type === "info" ? "blue" : type === "error" ? "red" : "orange"
      }
    >
      {type}
    </Badge>
  );
};

export { LogBadge };
