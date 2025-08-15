import { Table } from "@chakra-ui/react";
import { LogBadge } from "./log-badge";
import styles from "./log-panel.module.scss";
import { useLogs, useWindowInnerSize } from "@/hooks";

const LogPanel = () => {
  const logs = useLogs();
  const [windowSize] = useWindowInnerSize();

  return (
    <Table.ScrollArea className={styles._} maxHeight={windowSize - 100}>
      <Table.Root size="sm" stickyHeader>
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeader width="fit-content">
              Timestamp
            </Table.ColumnHeader>
            <Table.ColumnHeader width="fit-content">Type</Table.ColumnHeader>
            <Table.ColumnHeader textAlign="center" width="fit-content">
              Message
            </Table.ColumnHeader>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {logs.map((item) => (
            <Table.Row key={item.id}>
              <Table.Cell width="fit-content">{item.timestamp}</Table.Cell>
              <Table.Cell width="fit-content">
                <LogBadge type={item.type as LogType} />
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
