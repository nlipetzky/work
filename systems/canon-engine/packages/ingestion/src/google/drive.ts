/**
 * Canon Engine — Google Drive API client.
 *
 * Replaces gwsExportDriveFile() from gws-shared.ts which shelled out to
 * the gws CLI to export Google Docs as plain text.
 */

import { google, type Auth } from 'googleapis';

type AuthClient = Auth.JWT | Auth.GoogleAuth;

// ---------------------------------------------------------------------------
// MIME type helpers
// ---------------------------------------------------------------------------

/** Google Workspace MIME types that support text/plain export. */
export const EXPORTABLE_MIME_TYPES = new Set([
  'application/vnd.google-apps.document',
  'application/vnd.google-apps.presentation',
  'application/vnd.google-apps.spreadsheet',
]);

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  createdTime?: string;
  modifiedTime?: string;
  size?: string;
}

// ---------------------------------------------------------------------------
// Folder listing
// ---------------------------------------------------------------------------

/**
 * List all files in a Drive folder (non-recursive).
 * Returns only files with exportable or downloadable MIME types.
 */
export async function listFolderFiles(
  auth: AuthClient,
  folderId: string,
): Promise<DriveFile[]> {
  const drive = google.drive({ version: 'v3', auth: auth as any });
  const files: DriveFile[] = [];
  let pageToken: string | undefined;

  do {
    const res = await drive.files.list({
      q: `'${folderId}' in parents and trashed = false`,
      fields: 'nextPageToken, files(id, name, mimeType, createdTime, modifiedTime, size)',
      pageSize: 100,
      // Required for Shared Drives (formerly Team Drives)
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
      ...(pageToken ? { pageToken } : {}),
    });
    files.push(...(res.data.files ?? []) as DriveFile[]);
    pageToken = res.data.nextPageToken ?? undefined;
  } while (pageToken);

  return files;
}

/**
 * Download a binary file from Drive and return its content as a Buffer.
 * Used for PDFs and other non-Google-Workspace files.
 */
export async function downloadFile(
  auth: AuthClient,
  fileId: string,
): Promise<Buffer> {
  const drive = google.drive({ version: 'v3', auth: auth as any });
  const res = await drive.files.get(
    { fileId, alt: 'media', supportsAllDrives: true },
    { responseType: 'arraybuffer' },
  );
  return Buffer.from(res.data as ArrayBuffer);
}

// ---------------------------------------------------------------------------
// Export (Google Docs → plain text)
// ---------------------------------------------------------------------------

/**
 * Export a Google Doc as the specified MIME type and return the text content.
 *
 * This replaces the gws CLI approach which:
 * 1. Ran `gws drive files export --params {...} -o tmpFile`
 * 2. Read the temp file back
 * 3. Deleted the temp file
 *
 * The direct API call returns the content in memory — no temp files needed.
 */
export async function exportFile(
  auth: AuthClient,
  fileId: string,
  mimeType: string = 'text/plain',
): Promise<string> {
  const drive = google.drive({ version: 'v3', auth: auth as any });
  const res = await drive.files.export({
    fileId,
    mimeType,
    // supportsAllDrives not needed for export, but safe to note:
    // files.export works on Shared Drive files without this flag
  }, {
    // Return as a string, not a stream
    responseType: 'text',
  });
  return res.data as unknown as string;
}
