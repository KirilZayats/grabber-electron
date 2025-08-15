import { Formik, Form } from "formik";
import { useMemo } from "react";
import { object, string, number } from "yup";
import { Button, IconButton } from "@chakra-ui/react";
import { FormField } from "./form-field";
import { LuFolder } from "react-icons/lu";
import styles from "./ftp-form.module.scss";
import clsx from "clsx";
import { toaster } from "@/providers";
import { FtpDirSelection } from "@/components";

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
  const ftpConfig = useMemo<FtpConfig>(
    () => ({
      host: "",
      port: 21,
      username: "",
      password: "",
      localDirectory: "",
      remoteDirectory: "",
    }),
    []
  );

  const startWatching = (ftpConfig: FtpConfig) => {
    window.electron.startWatching(ftpConfig);
  };

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
        window.electron.testFtpConnection(values);
        const unsub = window.electron.testFtpConnectionResult((result) => {
          if (result) {
            setSubmitting(true);
            startWatching(values);
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
      {({ isSubmitting, setSubmitting, setValues, values }) => (
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
              <FtpDirSelection
                collection={{
                  id: "Root",
                  name: "",
                  children: [
                    {
                      id: "/",
                      name: "/",
                      children: [],
                    },
                  ],
                }}
                selectedNodeId={values.remoteDirectory}
                setSelectedNodeId={(nodeId) => {
                  setValues((values) => ({
                    ...values,
                    remoteDirectory: nodeId,
                  }));
                }}
                loadChildren={(details) => {
                  const value = details.node.id;
                  return new Promise((resolve) => {
                    window.electron.getFtpTree({ ...values, path: value });
                    const unsub = window.electron.getFtpTreeResult((result) => {
                      resolve(result);
                      unsub();
                    });
                  });
                }}
                trigger={
                  <IconButton
                    aria-label="Browse remote"
                    variant="ghost"
                    size="sm"
                  >
                    <LuFolder />
                  </IconButton>
                }
              />
            }
          />
          <div className={clsx(styles._rowFields, styles._rowButtons)}>
            <Button
              type="button"
              onClick={() => {
                window.electron.stopWatching();
                setSubmitting(false);
              }}
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
