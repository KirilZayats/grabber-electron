import { createTreeCollection, TreeView } from "@chakra-ui/react";
import { useState } from "react";
import { LuFolder } from "react-icons/lu";

const DirectoryTree = ({
  collection,
  selectedNodeId,
  setSelectedNodeId,
  loadChildren,
}: {
  collection: DirectoryNode;
  selectedNodeId: string | null;
  setSelectedNodeId: (nodeId: string) => void;
  loadChildren: TreeView.RootProps["loadChildren"];
}) => {
  const [initCollection, setCollection] = useState(
    createTreeCollection<DirectoryNode>({
      nodeToValue: (node) => node.id,
      nodeToString: (node) => node.name,
      rootNode: collection,
    })
  );
  return (
    <TreeView.Root
      collection={initCollection}
      colorPalette="teal"
      variant="subtle"
      defaultCheckedValue={selectedNodeId ? [selectedNodeId] : undefined}
      loadChildren={loadChildren}
      onLoadChildrenComplete={(e) => setCollection(e.collection)}
    >
      <TreeView.Tree>
        <TreeView.Node
          indentGuide={<TreeView.BranchIndentGuide />}
          render={({ node }) => (
            <TreeView.BranchControl onClick={() => setSelectedNodeId(node.id)}>
              <LuFolder />
              <TreeView.BranchText>{node.name}</TreeView.BranchText>
            </TreeView.BranchControl>
          )}
        />
      </TreeView.Tree>
    </TreeView.Root>
  );
};

export { DirectoryTree };
