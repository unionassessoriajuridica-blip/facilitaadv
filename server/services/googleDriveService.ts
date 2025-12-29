import { google, drive_v3 } from 'googleapis';
import { Readable } from 'stream';
import { googleSystemAuthService } from './googleSystemAuthService';

const ROOT_FOLDER_NAME = 'FACILITA';

async function getGoogleDriveClient(): Promise<drive_v3.Drive> {
  const oauth2Client = await googleSystemAuthService.getOAuth2ClientWithToken();
  return google.drive({ version: 'v3', auth: oauth2Client });
}

export async function isConnected(): Promise<boolean> {
  return googleSystemAuthService.isConnected();
}

export async function findFolder(name: string, parentId?: string): Promise<string | null> {
  const drive = await getGoogleDriveClient();

  let query = `mimeType='application/vnd.google-apps.folder' and name='${name}' and trashed=false`;
  if (parentId) {
    query += ` and '${parentId}' in parents`;
  }

  const res = await drive.files.list({
    q: query,
    fields: 'files(id, name)',
    pageSize: 1,
  });

  return res.data.files?.[0]?.id || null;
}

export async function createFolder(name: string, parentId?: string): Promise<string> {
  const drive = await getGoogleDriveClient();

  const fileMetadata: drive_v3.Schema$File = {
    name,
    mimeType: 'application/vnd.google-apps.folder',
  };

  if (parentId) {
    fileMetadata.parents = [parentId];
  }

  const res = await drive.files.create({
    requestBody: fileMetadata,
    fields: 'id',
  });

  return res.data.id!;
}

export async function getOrCreateRootFolder(): Promise<string> {
  let rootFolderId = await findFolder(ROOT_FOLDER_NAME);

  if (!rootFolderId) {
    rootFolderId = await createFolder(ROOT_FOLDER_NAME);
    console.log(`Created root folder: ${ROOT_FOLDER_NAME} (${rootFolderId})`);
  }

  return rootFolderId;
}

export async function getOrCreateProcessFolder(numeroProcesso: string): Promise<string> {
  const rootFolderId = await getOrCreateRootFolder();

  const cleanProcessNumber = numeroProcesso.replace(/[^\d.-]/g, '');

  let processFolderId = await findFolder(cleanProcessNumber, rootFolderId);

  if (!processFolderId) {
    processFolderId = await createFolder(cleanProcessNumber, rootFolderId);
    console.log(`Created process folder: ${cleanProcessNumber} (${processFolderId})`);
  }

  return processFolderId;
}

function bufferToStream(buffer: Buffer): Readable {
  const readable = new Readable();
  readable.push(buffer);
  readable.push(null);
  return readable;
}

export async function uploadFile(
  fileName: string,
  mimeType: string,
  fileBuffer: Buffer,
  numeroProcesso: string
): Promise<{ fileId: string; webViewLink: string; folderId: string }> {
  const drive = await getGoogleDriveClient();

  const folderId = await getOrCreateProcessFolder(numeroProcesso);

  const res = await drive.files.create({
    requestBody: {
      name: fileName,
      mimeType: mimeType,
      parents: [folderId],
    },
    media: {
      mimeType: mimeType,
      body: bufferToStream(fileBuffer),
    },
    fields: 'id, webViewLink',
  });

  await drive.permissions.create({
    fileId: res.data.id!,
    requestBody: {
      role: 'reader',
      type: 'anyone',
    },
  });

  return {
    fileId: res.data.id!,
    webViewLink: res.data.webViewLink || `https://drive.google.com/file/d/${res.data.id}/view`,
    folderId,
  };
}

export async function uploadFromUrl(
  fileUrl: string,
  fileName: string,
  numeroProcesso: string
): Promise<{ fileId: string; webViewLink: string; folderId: string }> {
  const response = await fetch(fileUrl);

  if (!response.ok) {
    throw new Error(`Failed to fetch file from URL: ${response.statusText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const mimeType = response.headers.get('content-type') || 'application/octet-stream';

  return uploadFile(fileName, mimeType, buffer, numeroProcesso);
}

export async function listFolderContents(folderId: string): Promise<drive_v3.Schema$File[]> {
  const drive = await getGoogleDriveClient();

  const res = await drive.files.list({
    q: `'${folderId}' in parents and trashed=false`,
    fields: 'files(id, name, mimeType, createdTime, modifiedTime, webViewLink, size)',
    pageSize: 100,
  });

  return res.data.files || [];
}

export async function deleteFile(fileId: string): Promise<void> {
  const drive = await getGoogleDriveClient();

  await drive.files.delete({
    fileId,
  });
}

export async function getFileDetails(fileId: string): Promise<drive_v3.Schema$File> {
  const drive = await getGoogleDriveClient();

  const res = await drive.files.get({
    fileId,
    fields: 'id, name, mimeType, createdTime, modifiedTime, webViewLink, size',
  });

  return res.data;
}

export async function listProcessFolders(): Promise<drive_v3.Schema$File[]> {
  try {
    const rootFolderId = await getOrCreateRootFolder();
    return listFolderContents(rootFolderId);
  } catch (error) {
    console.error('Error listing process folders:', error);
    throw error;
  }
}

export const googleDriveService = {
  isConnected,
  findFolder,
  createFolder,
  getOrCreateRootFolder,
  getOrCreateProcessFolder,
  uploadFile,
  uploadFromUrl,
  listFolderContents,
  deleteFile,
  getFileDetails,
  listProcessFolders,
};
