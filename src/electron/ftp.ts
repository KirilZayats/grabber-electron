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

export async function getFtpTree(config: FtpConfig & { path?: string }) {
  const connectClient = async (client: Client): Promise<void> => {
    await client.access({
      host: config.host,
      port: config.port,
      user: config.username,
      password: config.password,
      secure: false,
    });
  };

  const client = new Client();
  client.ftp.verbose = false;

  try {
    await connectClient(client);

    const startPath = config.path || "/";

    const items = await client.list(startPath);

    return items
      .map((item) =>
        item.isDirectory && !item.name.startsWith(".")
          ? {
              id: `${startPath}/${item.name}`,
              name: item.name,
              children: [],
            }
          : null
      )
      .filter(Boolean) as DirectoryNode[];
  } catch (error) {
    console.error("Error crawling FTP directory:", error);
    return [] as DirectoryNode[];
  } finally {
    client.close();
  }
}
