import { Formik, Form } from "formik";
import { useState } from "react";
import { object, string, number } from "yup";
import { Button, IconButton } from "@chakra-ui/react";
import { FormField } from "./form-field";
import { LuFolder } from "react-icons/lu";
import styles from "./ftp-form.module.scss";
import clsx from "clsx";

const ftpConfigSchema = object({
  host: string().required(),
  port: number().required().min(21).max(65535),
  username: string().required(),
  password: string().required(),
  localDirectory: string().required(),
  remoteDirectory: string().required(),
});

const FtpForm = () => {
  const [ftpConfig, setFtpConfig] = useState<FtpConfig>({
    host: "",
    port: 21,
    username: "",
    password: "",
    localDirectory: "",
    remoteDirectory: "",
  });

  return (
    <Formik
      initialValues={ftpConfig}
      validationSchema={ftpConfigSchema}
      onSubmit={(values, { setSubmitting }) => {
        setFtpConfig(values);
        setSubmitting(false);
      }}
    >
      {({ isSubmitting }) => (
        <Form className={styles._}>
          <div className={styles._rowFields}>
            <FormField
              label="Host"
              type="text"
              name="host"
              placeholder="Enter host"
              startElement="ftp://"
            />

            <FormField
              label="Port"
              type="number"
              name="port"
              placeholder="Enter port"
            />
          </div>
          <div className={styles._rowFields}>
            <FormField
              label="Username"
              type="text"
              name="username"
              placeholder="Enter username"
            />

            <FormField
              label="Password"
              type="password"
              name="password"
              placeholder="Enter password"
            />
          </div>
          <FormField
            label="Local directory"
            type="text"
            name="localDirectory"
            placeholder="Enter local directory"
            endElement={
              <IconButton aria-label="Browse local" variant="ghost" size="sm">
                <LuFolder />
              </IconButton>
            }
          />
          <FormField
            label="Remote directory"
            type="text"
            name="remoteDirectory"
            placeholder="Enter remote directory"
            endElement={
              <IconButton aria-label="Browse remote" variant="ghost" size="sm">
                <LuFolder />
              </IconButton>
            }
          />
          <div className={clsx(styles._rowFields, styles._rowButtons)}>
            <Button type="submit" disabled={!isSubmitting}>
              Stop watching
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              Watch
            </Button>
          </div>
        </Form>
      )}
    </Formik>
  );
};

export { FtpForm };
