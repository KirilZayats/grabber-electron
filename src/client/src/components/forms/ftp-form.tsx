import { Formik, Form } from "formik";
import { useEffect, useMemo } from "react";
import { object, string, number } from "yup";
import { Button, Heading, IconButton } from "@chakra-ui/react";
import { FormField } from "./form-field";
import { LuFolder } from "react-icons/lu";
import styles from "./ftp-form.module.scss";
import clsx from "clsx";
import { toaster } from "@/providers";
import { FtpDirSelection } from "@/components";
import { FormattedMessage, useIntl } from "react-intl";

const FTP_CONFIG_STORAGE_KEY = "ftpConfig";

function defaultFtpConfig(): FtpConfig {
  return {
    host: "",
    port: 21,
    username: "",
    password: "",
    localDirectory: "",
    remoteDirectory: "",
  };
}

/** Ensures all fields are defined (localStorage / Formik can be partial). */
function normalizeFtpConfig(raw: unknown): FtpConfig {
  const d = defaultFtpConfig();
  if (!raw || typeof raw !== "object") {
    return d;
  }
  const p = raw as Record<string, unknown>;
  const portNum = Number(p.port);
  return {
    host: typeof p.host === "string" ? p.host : d.host,
    port:
      Number.isFinite(portNum) && portNum >= 21 && portNum <= 65535
        ? portNum
        : d.port,
    username: typeof p.username === "string" ? p.username : d.username,
    password: typeof p.password === "string" ? p.password : d.password,
    localDirectory:
      typeof p.localDirectory === "string" ? p.localDirectory : d.localDirectory,
    remoteDirectory:
      typeof p.remoteDirectory === "string"
        ? p.remoteDirectory
        : d.remoteDirectory,
  };
}

function loadFtpConfigFromStorage(): FtpConfig {
  try {
    const raw = localStorage.getItem(FTP_CONFIG_STORAGE_KEY);
    if (!raw) {
      return defaultFtpConfig();
    }
    return normalizeFtpConfig(JSON.parse(raw));
  } catch {
    return defaultFtpConfig();
  }
}

function saveFtpConfigToStorage(config: FtpConfig): void {
  try {
    localStorage.setItem(
      FTP_CONFIG_STORAGE_KEY,
      JSON.stringify(normalizeFtpConfig(config))
    );
  } catch {
    // private mode / quota
  }
}

const ftpConfigSchema = object({
  host: string().required(),
  port: number()
    .required()
    .min(21)
    .max(65535)
    .test("is-valid", "Invalid port", (value, context) => {
      const cfg = normalizeFtpConfig(context.parent);
      window.electron.validateHost({ host: cfg.host, port: value });
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
        { ...normalizeFtpConfig(context.parent), password: value },
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
      window.electron.validateRemoteDirectory(
        normalizeFtpConfig({ ...context.parent, remoteDirectory: value })
      );
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
  const initialValues = useMemo(() => loadFtpConfigFromStorage(), []);

  const startWatching = (cfg: FtpConfig) => {
    const normalized = normalizeFtpConfig(cfg);
    saveFtpConfigToStorage(normalized);
    window.electron.startWatching(normalized);
  };

  const handleLocalDirSelect = (
    setValues: (
      values: React.SetStateAction<FtpConfig>,
      shouldValidate?: boolean
    ) => void
  ) => {
    window.electron.selectLocalDirectory();
    const unsub = window.electron.selectLocalDirectoryResult((dir) => {
      if (typeof dir === "string" && dir.length > 0) {
        setValues((values) => ({
          ...values,
          localDirectory: dir,
        }));
      }
      unsub();
    });
  };

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={ftpConfigSchema}
      onSubmit={(values, { setSubmitting }) => {
        const cfg = normalizeFtpConfig(values);
        saveFtpConfigToStorage(cfg);
        window.electron.testFtpConnection(cfg);
        const unsub = window.electron.testFtpConnectionResult((result) => {
          if (result) {
            setSubmitting(true);
            startWatching(cfg);
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
        <FtpFormBody
          intl={intl}
          isSubmitting={isSubmitting}
          setSubmitting={setSubmitting}
          setValues={setValues}
          values={values}
          handleLocalDirSelect={handleLocalDirSelect}
        />
      )}
    </Formik>
  );
};

function FtpFormBody({
  intl,
  isSubmitting,
  setSubmitting,
  setValues,
  values,
  handleLocalDirSelect,
}: {
  intl: ReturnType<typeof useIntl>;
  isSubmitting: boolean;
  setSubmitting: (v: boolean) => void;
  setValues: (
    values: React.SetStateAction<FtpConfig>,
    shouldValidate?: boolean
  ) => void;
  values: FtpConfig;
  handleLocalDirSelect: (
    setValues: (
      values: React.SetStateAction<FtpConfig>,
      shouldValidate?: boolean
    ) => void
  ) => void;
}) {
  useEffect(() => {
    saveFtpConfigToStorage(normalizeFtpConfig(values));
  }, [values]);

  return (
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
                    const cfg = normalizeFtpConfig(values);
                    window.electron.getFtpTree({ ...cfg, path: value });
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
  );
}

export { FtpForm };
