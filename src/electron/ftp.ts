import { Client } from "basic-ftp";

export async function testConnection(config: FtpConfig) {
  const client = new Client();
  client.ftp.verbose = false;
  try {
    await client.access({
      host: config.host,
      port: config.port,
      user: config.username,
      password: config.password,
      secure: false,
    });
    return true;
  } catch {
    return false;
  } finally {
    client.close();
  }
}
