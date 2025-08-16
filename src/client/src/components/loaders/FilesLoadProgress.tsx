import { Progress, For, HStack, Box } from "@chakra-ui/react";

const FilesLoadProgress = (props: { progress: FilesLoadProgress[] }) => {
  return (
    <Box borderTop="1px solid" borderColor="border" maxW="100%" p="2rem 1rem">
      <For each={props.progress}>
        {(item) => (
          <Progress.Root
            key={item.fileName}
            maxW="100%"
            striped={item.progress < 100}
            animated
            value={item.progress}
            colorPalette="teal"
          >
            <HStack gap="5">
              <Progress.Label>{item.fileName}</Progress.Label>
              <Progress.Track flex="1">
                <Progress.Range />
              </Progress.Track>
              <Progress.ValueText>{item.progress}%</Progress.ValueText>
            </HStack>
          </Progress.Root>
        )}
      </For>
    </Box>
  );
};

export { FilesLoadProgress };
