import { Formik, Form, Field, ErrorMessage } from "formik";
import { useState } from "react";
import { object, string, number } from "yup";

const ftpConfigSchema = object({
  host: string().required(),
  port: number().required(),
  username: string().required(),
  password: string().required(),
});

const FtpForm = () => {
  const [ftpConfig, setFtpConfig] = useState<FtpConfig>({
    host: "",
    port: 80,
    username: "",
    password: "",
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
        <Form className="flex flex-col gap-2">
          <Field type="text" name="host" />
          <ErrorMessage name="host" component="div" />
          <Field type="number" name="port" />
          <ErrorMessage name="port" component="div" />
          <Field type="text" name="username" />
          <ErrorMessage name="username" component="div" />
          <Field type="password" name="password" />
          <ErrorMessage name="password" component="div" />
          <button type="submit" disabled={isSubmitting}>
            Submit
          </button>
        </Form>
      )}
    </Formik>
  );
};

export { FtpForm };
