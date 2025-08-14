import { Field, Input, InputGroup } from "@chakra-ui/react";
import { useField } from "formik";

const FormField = ({
  placeholder,
  startElement,
  endElement,
  label,
  ...props
}: {
  label: string;
  startElement?: React.ReactNode | string;
  endElement?: React.ReactNode | string;
  placeholder?: string;
  [key: string]: unknown;
}) => {
  const [field, meta] = useField(props);
  return (
    <Field.Root invalid={!!(meta.touched && meta.error)}>
      <Field.Label>{label}</Field.Label>
      <InputGroup
        startElement={startElement}
        startElementProps={{ color: "fg.muted" }}
        endElementProps={{ padding: "0" }}
        endElement={endElement}
      >
        <Input
          paddingLeft={startElement ? "7ch" : "1ch"}
          placeholder={placeholder}
          {...field}
          {...props}
        />
      </InputGroup>
      <Field.ErrorText>{meta.error}</Field.ErrorText>
    </Field.Root>
  );
};

export { FormField };
