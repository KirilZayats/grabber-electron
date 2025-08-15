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
} as const;

const LogPanel = () => {
  const logs = useLogs();
  const [windowSize] = useWindowInnerSize();

  return (
    <Table.ScrollArea className={styles._} maxHeight={windowSize - 100}>
      <Table.Root size="sm" stickyHeader>
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeader width="200px">Timestamp</Table.ColumnHeader>
            <Table.ColumnHeader width="40px" textAlign="start">
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
              <Table.Cell>{item.timestamp}</Table.Cell>
              <Table.Cell textAlign="start" width="fit-content">
                <LogBadge
                  color={logTypeToColor[item.type]}
                  label={item.type}
                />
              </Table.Cell>
              <Table.Cell textAlign="start" width="fit-content">
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
