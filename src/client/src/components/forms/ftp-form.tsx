import { Formik, Form } from "formik";
import { useMemo } from "react";
import { object, string, number } from "yup";
import { Button, Heading, IconButton } from "@chakra-ui/react";
import { FormField } from "./form-field";
import { LuFolder } from "react-icons/lu";
import styles from "./ftp-form.module.scss";
import clsx from "clsx";
import { toaster } from "@/providers";
import { FtpDirSelection } from "@/components";
import { FormattedMessage, useIntl } from "react-intl";

const ftpConfigSchema = object({
  host: string().required(),
  port: number()
    .required()
    .min(21)
    .max(65535)
    .test("is-valid", "Invalid port", (value, context) => {
      window.electron.validateHost({ host: context.parent.host, port: value });
      return new Promise((resolve) => {
        const unsub = window.electron.validateHostResult((result) => {
          unsub();
          resolve(result);
        });
      });
    }),
  username: string().required(),
  password: string()
    .required()
    .test("is-valid", "Invalid user", (value, context) => {
      window.electron.testFtpConnection(
        {
          ...context.parent,
          password: value,
        },
        true
      );
      return new Promise((resolve) => {
        const unsub = window.electron.testFtpConnectionResult((result) => {
          unsub();
          resolve(result);
        });
      });
    }),
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
  remoteDirectory: string()
    .required()
    .test("is-valid", "Invalid remote directory", (value, context) => {
      window.electron.validateRemoteDirectory({
        ...context.parent,
        remoteDirectory: value,
      });
      return new Promise((resolve) => {
        const unsub = window.electron.validateRemoteDirectoryResult(
          (result) => {
            unsub();
            resolve(result.exists);
          }
        );
      });
    }),
});

const FtpForm = () => {
  const intl = useIntl();
  const ftpConfig = useMemo<FtpConfig>(() => {
    const ftpConfig = localStorage.getItem("ftpConfig");
    if (ftpConfig) {
      return JSON.parse(ftpConfig);
    }
    return {
      host: "",
      port: 21,
      username: "",
      password: "",
      localDirectory: "",
      remoteDirectory: "",
    };
  }, []);

  const startWatching = (ftpConfig: FtpConfig) => {
    localStorage.setItem("ftpConfig", JSON.stringify(ftpConfig));
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
          <Heading size="md">
            <FormattedMessage id="connectToFtp" />
          </Heading>
          <div className={styles._rowFields}>
            <FormField
              label={intl.formatMessage({ id: "host" })}
              type="text"
              name="host"
              placeholder="Enter host"
              startElement="ftp://"
              displayError={false}
              disabled={isSubmitting}
            />

            <FormField
              label={intl.formatMessage({ id: "port" })}
              type="number"
              name="port"
              placeholder="Enter port"
              displayError={false}
              displayOnlyErrorIcon={true}
              disabled={isSubmitting}
            />
          </div>
          <div className={styles._rowFields}>
            <FormField
              disabled={isSubmitting}
              label={intl.formatMessage({ id: "username" })}
              type="text"
              name="username"
              placeholder="Enter username"
              displayError={true}
            />

            <FormField
              disabled={isSubmitting}
              label={intl.formatMessage({ id: "password" })}
              type="password"
              name="password"
              placeholder="Enter password"
              displayError={false}
              displayOnlyErrorIcon={true}
            />
          </div>
          <FormField
            label={intl.formatMessage({ id: "localDir" })}
            type="text"
            name="localDirectory"
            placeholder="Enter local directory"
            disabled={isSubmitting}
            endElement={
              <IconButton
                aria-label="Browse local"
                variant="ghost"
                size="sm"
                onClick={() => handleLocalDirSelect(setValues)}
                disabled={isSubmitting}
              >
                <LuFolder />
              </IconButton>
            }
          />
          <FormField
            label={intl.formatMessage({ id: "remoteDir" })}
            type="text"
            name="remoteDirectory"
            placeholder="Enter remote directory"
            disabled={isSubmitting}
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
                    disabled={isSubmitting}
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
              <FormattedMessage id="stopWatch" />
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              <FormattedMessage id="watch" />
            </Button>
          </div>
        </Form>
      )}
    </Formik>
  );
};

export { FtpForm };
