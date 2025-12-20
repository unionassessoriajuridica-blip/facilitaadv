import { google } from 'googleapis';

let connectionSettings: any;

async function getAccessToken() {
  if (
    connectionSettings &&
    connectionSettings.settings.expires_at &&
    new Date(connectionSettings.settings.expires_at).getTime() > Date.now()
  ) {
    return connectionSettings.settings.access_token;
  }

  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY
    ? 'repl ' + process.env.REPL_IDENTITY
    : process.env.WEB_REPL_RENEWAL
    ? 'depl ' + process.env.WEB_REPL_RENEWAL
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  connectionSettings = await fetch(
    'https://' +
      hostname +
      '/api/v2/connection?include_secrets=true&connector_names=google-drive',
    {
      headers: {
        Accept: 'application/json',
        X_REPLIT_TOKEN: xReplitToken,
      },
    }
  )
    .then((res) => res.json())
    .then((data) => data.items?.[0]);

  const accessToken =
    connectionSettings?.settings?.access_token ||
    connectionSettings.settings?.oauth?.credentials?.access_token;

  if (!connectionSettings || !accessToken) {
    throw new Error('Google Drive not connected');
  }
  return accessToken;
}

// WARNING: Never cache this client.
// Access tokens expire, so a new client must be created each time.
export async function getGoogleDriveClient() {
  const accessToken = await getAccessToken();

  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({
    access_token: accessToken,
  });

  return google.drive({ version: 'v3', auth: oauth2Client });
}

// List files
export async function listFiles(query?: string, pageSize = 10) {
  try {
    const drive = await getGoogleDriveClient();
    const res = await drive.files.list({
      pageSize,
      fields: 'files(id, name, mimeType, createdTime, modifiedTime)',
      q: query || "trashed = false and mimeType != 'application/vnd.google-apps.folder'",
    });
    return res.data.files || [];
  } catch (error) {
    console.error('Error listing files:', error);
    throw error;
  }
}

// Upload file
export async function uploadFile(fileData: {
  name: string;
  mimeType: string;
  content: Buffer | string;
  parentFolderId?: string;
}) {
  try {
    const drive = await getGoogleDriveClient();
    const res = await drive.files.create({
      requestBody: {
        name: fileData.name,
        mimeType: fileData.mimeType,
        parents: fileData.parentFolderId ? [fileData.parentFolderId] : undefined,
      },
      media: {
        mimeType: fileData.mimeType,
        body: fileData.content,
      },
    });
    return res.data;
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
}

// Download file
export async function downloadFile(fileId: string) {
  try {
    const drive = await getGoogleDriveClient();
    const res = await drive.files.get(
      {
        fileId,
        alt: 'media',
      },
      { responseType: 'stream' }
    );
    return res.data;
  } catch (error) {
    console.error('Error downloading file:', error);
    throw error;
  }
}

// Delete file
export async function deleteFile(fileId: string) {
  try {
    const drive = await getGoogleDriveClient();
    await drive.files.delete({
      fileId,
    });
  } catch (error) {
    console.error('Error deleting file:', error);
    throw error;
  }
}

// Get file details
export async function getFileDetails(fileId: string) {
  try {
    const drive = await getGoogleDriveClient();
    const res = await drive.files.get({
      fileId,
      fields:
        'id, name, mimeType, createdTime, modifiedTime, webViewLink, size',
    });
    return res.data;
  } catch (error) {
    console.error('Error getting file details:', error);
    throw error;
  }
}
