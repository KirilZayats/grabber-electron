import { Table } from "@chakra-ui/react";
import { LogBadge } from "./log-badge";
import styles from "./log-panel.module.scss";
import { useLogs, useWindowInnerSize } from "@/hooks";

const logTypeToColor = {
  info: "blue",
  error: "red",
  warning: "orange",
} as const;

const eventScopeToColor = {
  success: "green",
  error: "red",
  created: "blue",
  changed: "yellow",
  removed: "red",
  stopped: "red",
  started: "blue",
} as const;

const LogPanel = () => {
  const logs = useLogs();
  const [windowSize] = useWindowInnerSize();

  return (
    <Table.ScrollArea className={styles._} maxHeight={windowSize - 100}>
      <Table.Root
        size="sm"
        stickyHeader
        css={{
          "& [data-sticky]": {
            position: "sticky",
            zIndex: 1,
            bg: "bg",

            _after: {
              content: '""',
              position: "absolute",
              pointerEvents: "none",
              top: "0",
              bottom: "-1px",
              width: "32px",
            },
          },

          "& [data-sticky=end]": {
            _after: {
              insetInlineEnd: "0",
              translate: "100% 0",
              shadow: "inset 8px 0px 8px -8px rgba(0, 0, 0, 0.16)",
            },
          },

          "& [data-sticky=start]": {
            _after: {
              insetInlineStart: "0",
              translate: "-100% 0",
              shadow: "inset -8px 0px 8px -8px rgba(0, 0, 0, 0.16)",
            },
          },
        }}
      >
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeader width="180px" data-sticky="end" left="0">
              Timestamp
            </Table.ColumnHeader>
            <Table.ColumnHeader
              width="100px"
              data-sticky="end"
              textAlign="start"
              left="180px"
            >
              Type
            </Table.ColumnHeader>
            <Table.ColumnHeader width="150px" textAlign="start">
              Scope
            </Table.ColumnHeader>
            <Table.ColumnHeader textAlign="start" width="fit-content">
              Message
            </Table.ColumnHeader>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {logs.map((item) => (
            <Table.Row key={item.id}>
              <Table.Cell data-sticky="end" left="0">
                {item.timestamp}
              </Table.Cell>
              <Table.Cell data-sticky="end" textAlign="start" left="180px">
                <LogBadge color={logTypeToColor[item.type]} label={item.type} />
              </Table.Cell>
              <Table.Cell textAlign="start">
                <LogBadge
                  color={eventScopeToColor[item.scope.event]}
                  label={`${item.scope.type}: ${item.scope.event}`}
                />
              </Table.Cell>
              <Table.Cell textAlign="start">{item.message}</Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Root>
    </Table.ScrollArea>
  );
};

export { LogPanel };
