import { Formik, Form, Field, ErrorMessage } from "formik";

const FtpForm = () => {
  return (
    <Formik
      initialValues={{
        host: "",
        port: "",
        username: "",
        password: "",
      }}
      validate={(values) => {
        const errors = {};
        if (!values.host) {
          errors.host = "Required";
        } else if (!values.port) {
          errors.port = "Required";
        } else if (!values.username) {
          errors.username = "Required";
        } else if (!values.password) {
          errors.password = "Required";
        }
        return errors;
      }}
      onSubmit={(values, { setSubmitting }) => {
        setTimeout(() => {
          alert(JSON.stringify(values, null, 2));
          setSubmitting(false);
        }, 400);
      }}
    >
      {({ isSubmitting }) => (
        <Form>
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
