import { Field, Input, InputGroup } from "@chakra-ui/react";
import { useField } from "formik";
import { LuCircleCheck, LuCircleX } from "react-icons/lu";

const FormField = ({
  placeholder,
  startElement,
  endElement,
  label,
  displayError = true,
  displayOnlyErrorIcon = false,
  ...props
}: {
  label: string;
  startElement?: React.ReactNode | string;
  endElement?: React.ReactNode | string;
  placeholder?: string;
  displayError?: boolean;
  displayOnlyErrorIcon?: boolean;
  [key: string]: unknown;
}) => {
  const [field, meta] = useField(props);
  return (
    <Field.Root
      invalid={!displayOnlyErrorIcon && !!(meta.touched && meta.error)}
    >
      <Field.Label truncate>{label}</Field.Label>
      <InputGroup
        startElement={startElement}
        startElementProps={{ color: "fg.muted" }}
        endElementProps={{ padding: displayOnlyErrorIcon ? "1ch" : "0" }}
        endElement={
          displayOnlyErrorIcon ? (
            meta.touched && meta.error ? (
              <LuCircleX color="red" />
            ) : (
              <LuCircleCheck color="green" />
            )
          ) : (
            endElement
          )
        }
      >
        <Input
          paddingLeft={startElement ? "7ch" : "1ch"}
          placeholder={placeholder}
          {...field}
          {...props}
        />
      </InputGroup>
      {displayError && <Field.ErrorText>{meta.error}</Field.ErrorText>}
    </Field.Root>
  );
};

export { FormField };
