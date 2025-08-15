import { Formik, Form } from "formik";
import { useState } from "react";
import { object, string, number } from "yup";
import { Button, IconButton } from "@chakra-ui/react";
import { FormField } from "./form-field";
import { LuFolder } from "react-icons/lu";
import styles from "./ftp-form.module.scss";
import clsx from "clsx";
import { toaster } from "@/providers";

const ftpConfigSchema = object({
  host: string().required(),
  port: number().required().min(21).max(65535),
  username: string().required(),
  password: string().required(),
  localDirectory: string()
    .required()
    .test("is-valid", "Invalid local directory", (value) => {
      window.electron.validateLocalDirectory(value);
      return new Promise((resolve) => {
        const unsub = window.electron.validateLocalDirectoryResult((result) => {
          unsub();
          resolve(result.exists);
        });
      });
    }),
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

  const handleLocalDirSelect = (
    setValues: (
      values: React.SetStateAction<FtpConfig>,
      shouldValidate?: boolean
    ) => void
  ) => {
    window.electron.selectLocalDirectory();
    const unsub = window.electron.selectLocalDirectoryResult((dir) => {
      setValues((values) => ({ ...values, localDirectory: dir }));
      unsub();
    });
  };

  return (
    <Formik
      initialValues={ftpConfig}
      validationSchema={ftpConfigSchema}
      onSubmit={(values, { setSubmitting }) => {
        console.log(values);
        window.electron.testFtpConnection(values);
        const unsub = window.electron.testFtpConnectionResult((result) => {
          if (result) {
            setFtpConfig(values);
            setSubmitting(true);
            toaster.create({
              title: "FTP connection successful",
              description: "FTP connection successful",
              type: "success",
            });
          } else {
            setSubmitting(false);
            toaster.create({
              title: "FTP connection failed",
              description: "FTP connection failed",
              type: "error",
            });
          }
          unsub();
        });
      }}
    >
      {({ isSubmitting, setSubmitting, setValues }) => (
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
              <IconButton
                aria-label="Browse local"
                variant="ghost"
                size="sm"
                onClick={() => handleLocalDirSelect(setValues)}
              >
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
            <Button
              type="button"
              onClick={() => setSubmitting(false)}
              disabled={!isSubmitting}
            >
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
