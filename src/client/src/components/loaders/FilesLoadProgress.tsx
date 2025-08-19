import { Progress, For, HStack, Box, Text } from "@chakra-ui/react";
import { Tooltip } from "../tooltip";

const FilesLoadProgress = (props: { progress: FilesLoadProgress[] }) => {
  return (
    <Box
      borderTop="1px solid"
      borderColor="border"
      maxW="100%"
      maxH="80px"
      h="80px"
      overflow="auto"
      p=".1rem 1rem"
    >
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
              <Progress.Label w="5%">
                <Tooltip
                  content={item.fileName}
                  showArrow
                  positioning={{ placement: "right-end" }}
                >
                  <Text truncate>{item.fileName} </Text>
                </Tooltip>
              </Progress.Label>
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
