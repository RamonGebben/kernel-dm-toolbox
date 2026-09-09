import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { env } from '~/env';
import { getDb } from '~/server/db';
import { maps } from '~/server/db/schema';
import {
  generateMapStoragePath,
  resolveWithinStorageRoot,
  validateMapUpload,
} from '~/utils/mapStorage';

/**
 * Multipart upload for a map image or video.
 *
 * This lives outside tRPC — tRPC has no multipart support — so the insert
 * below IS the confirmation: there is no separate "commit upload" mutation.
 * The client invalidates `trpc.maps.list` by hand once this resolves.
 */
export const runtime = 'nodejs';

export const POST = async (request: Request) => {
  const formData = await request.formData();
  const file = formData.get('file');
  const folderId = formData.get('folderId');
  const name = formData.get('name');

  if (!(file instanceof File)) {
    return Response.json({ error: 'Missing file.' }, { status: 400 });
  }

  const validation = validateMapUpload({
    filename: file.name,
    byteSize: file.size,
    maxBytes: env.MAPS_MAX_UPLOAD_BYTES,
  });

  if (!validation.ok) {
    return Response.json({ error: validation.reason }, { status: 400 });
  }

  const storageRoot = resolve(env.MAPS_STORAGE_DIR);
  const storagePath = generateMapStoragePath(file.name);
  const absolutePath = resolveWithinStorageRoot(storageRoot, storagePath);

  if (!absolutePath) {
    return Response.json(
      { error: 'Could not resolve a storage path.' },
      { status: 500 },
    );
  }

  try {
    await mkdir(storageRoot, { recursive: true });
    await writeFile(absolutePath, Buffer.from(await file.arrayBuffer()));

    const [map] = await getDb()
      .insert(maps)
      .values({
        folderId:
          typeof folderId === 'string' && folderId.length > 0 ? folderId : null,
        name: typeof name === 'string' && name.length > 0 ? name : file.name,
        kind: validation.kind,
        storagePath,
        originalFilename: file.name,
        mimeType: validation.mimeType,
        byteSize: file.size,
      })
      .returning();

    return Response.json(map, { status: 201 });
  } catch {
    return Response.json(
      { error: 'Could not save the uploaded map.' },
      { status: 400 },
    );
  }
};
