import { extname, resolve, sep } from 'node:path';

/**
 * Pure validation and path helpers for uploaded map files.
 *
 * Files are always stored flat under a server-generated name
 * (`generateMapStoragePath`) rather than a path derived from the original
 * filename or folder, so there is no user-controlled filesystem path
 * anywhere in this app — renaming or moving a map in the gallery is a
 * metadata-only update, never a file rename.
 */

export type MapKind = 'image' | 'video';

const MAP_FILE_TYPE_BY_EXTENSION: Record<
  string,
  { mimeType: string; kind: MapKind }
> = {
  '.png': { mimeType: 'image/png', kind: 'image' },
  '.jpg': { mimeType: 'image/jpeg', kind: 'image' },
  '.jpeg': { mimeType: 'image/jpeg', kind: 'image' },
  '.webp': { mimeType: 'image/webp', kind: 'image' },
  '.webm': { mimeType: 'video/webm', kind: 'video' },
};

export type MapUploadValidation =
  | { ok: true; kind: MapKind; mimeType: string; extension: string }
  | { ok: false; reason: string };

export const validateMapUpload = ({
  filename,
  byteSize,
  maxBytes,
}: {
  filename: string;
  byteSize: number;
  maxBytes: number;
}): MapUploadValidation => {
  const extension = extname(filename).toLowerCase();
  const fileType = MAP_FILE_TYPE_BY_EXTENSION[extension];

  if (!fileType) {
    return {
      ok: false,
      reason: `"${extension || filename}" is not a supported map file type. Use PNG, JPG, WEBP or WEBM.`,
    };
  }

  if (byteSize <= 0) {
    return { ok: false, reason: 'File is empty.' };
  }

  if (byteSize > maxBytes) {
    const limitMb = Math.floor(maxBytes / (1024 * 1024));
    return {
      ok: false,
      reason: `File is larger than the ${limitMb}MB upload limit.`,
    };
  }

  return {
    ok: true,
    kind: fileType.kind,
    mimeType: fileType.mimeType,
    extension,
  };
};

/**
 * A server-generated storage path — never derived from the client-supplied
 * filename, so there is no user-controlled path anywhere on disk.
 */
export const generateMapStoragePath = (filename: string): string =>
  `${crypto.randomUUID()}${extname(filename).toLowerCase()}`;

/**
 * Resolves a storage path against the storage root and refuses to leave it.
 * Defense-in-depth: `storagePath` is always server-generated, but this keeps
 * a lookup safe even if something unexpected ever reaches it.
 */
export const resolveWithinStorageRoot = (
  root: string,
  storagePath: string,
): string | null => {
  const normalizedRoot = resolve(root) + sep;
  const resolved = resolve(root, storagePath);

  return resolved.startsWith(normalizedRoot) ? resolved : null;
};
