import { describe, expect, it } from 'vitest';
import {
  generateMapStoragePath,
  resolveWithinStorageRoot,
  validateMapUpload,
} from '~/utils/mapStorage';

const ONE_MB = 1024 * 1024;

describe('validateMapUpload', () => {
  it.each(['map.png', 'map.jpg', 'map.jpeg', 'map.webp'])(
    'accepts %s as an image',
    filename => {
      const result = validateMapUpload({
        filename,
        byteSize: ONE_MB,
        maxBytes: 50 * ONE_MB,
      });

      expect(result).toMatchObject({ ok: true, kind: 'image' });
    },
  );

  it('accepts .webm as a video', () => {
    const result = validateMapUpload({
      filename: 'battlemap.webm',
      byteSize: ONE_MB,
      maxBytes: 50 * ONE_MB,
    });

    expect(result).toMatchObject({
      ok: true,
      kind: 'video',
      mimeType: 'video/webm',
    });
  });

  it('is case-insensitive on the extension', () => {
    const result = validateMapUpload({
      filename: 'MAP.PNG',
      byteSize: ONE_MB,
      maxBytes: 50 * ONE_MB,
    });

    expect(result).toMatchObject({ ok: true, kind: 'image' });
  });

  it('rejects a disallowed extension', () => {
    const result = validateMapUpload({
      filename: 'notes.pdf',
      byteSize: ONE_MB,
      maxBytes: 50 * ONE_MB,
    });

    expect(result.ok).toBe(false);
  });

  it('rejects a file over the size cap', () => {
    const result = validateMapUpload({
      filename: 'map.png',
      byteSize: 51 * ONE_MB,
      maxBytes: 50 * ONE_MB,
    });

    expect(result.ok).toBe(false);
  });

  it('rejects an empty file', () => {
    const result = validateMapUpload({
      filename: 'map.png',
      byteSize: 0,
      maxBytes: 50 * ONE_MB,
    });

    expect(result.ok).toBe(false);
  });
});

describe('generateMapStoragePath', () => {
  it('keeps the lowercased extension but not the original name', () => {
    const path = generateMapStoragePath('My Dungeon.PNG');

    expect(path).toMatch(/\.png$/);
    expect(path).not.toContain('My Dungeon');
  });

  it('produces a different path on every call', () => {
    const first = generateMapStoragePath('map.png');
    const second = generateMapStoragePath('map.png');

    expect(first).not.toBe(second);
  });
});

describe('resolveWithinStorageRoot', () => {
  const root = '/data/maps';

  it('resolves a plain storage path inside the root', () => {
    expect(resolveWithinStorageRoot(root, 'abc-123.png')).toBe(
      '/data/maps/abc-123.png',
    );
  });

  it('refuses a path that escapes the root', () => {
    expect(resolveWithinStorageRoot(root, '../../etc/passwd')).toBeNull();
  });

  it('refuses an absolute path outside the root', () => {
    expect(resolveWithinStorageRoot(root, '/etc/passwd')).toBeNull();
  });
});
