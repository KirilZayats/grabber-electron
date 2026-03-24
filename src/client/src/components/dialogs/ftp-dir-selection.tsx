import {
  Button,
  CloseButton,
  Dialog,
  Portal,
  TreeView,
} from "@chakra-ui/react";
import { DirectoryTree } from "../trees/directory-tree";

const FtpDirSelection = ({
  collection,
  selectedNodeId,
  setSelectedNodeId,
  trigger,
  loadChildren,
}: {
  collection: DirectoryNode | null;
  selectedNodeId: string | null;
  setSelectedNodeId: (nodeId: string) => void;
  trigger: React.ReactNode;
  loadChildren: TreeView.RootProps["loadChildren"];
}) => {
  return collection ? (
    <Dialog.Root placement="center" scrollBehavior="inside" size="sm">
      <Dialog.Trigger asChild>{trigger}</Dialog.Trigger>
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content maxW="md">
            <Dialog.Header>
              <Dialog.Title>Select directory</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body maxH="md">
              <DirectoryTree
                collection={collection}
                selectedNodeId={selectedNodeId}
                setSelectedNodeId={setSelectedNodeId}
                loadChildren={loadChildren}
              />
            </Dialog.Body>
            <Dialog.Footer>
              <Dialog.ActionTrigger asChild>
                <Button variant="outline">Cancel</Button>
              </Dialog.ActionTrigger>
              <Dialog.ActionTrigger asChild>
                <Button>Select</Button>
              </Dialog.ActionTrigger>
            </Dialog.Footer>
            <Dialog.CloseTrigger asChild>
              <CloseButton size="sm" />
            </Dialog.CloseTrigger>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  ) : (
    trigger
  );
};

export { FtpDirSelection };
