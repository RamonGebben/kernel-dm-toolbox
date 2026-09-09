import { z } from 'zod';

export const mapIdInputSchema = z.object({ id: z.uuid() });
export const folderIdInputSchema = z.object({ id: z.uuid() });

export const createFolderInputSchema = z.object({
  name: z.string().trim().min(1).max(80),
});

export const renameFolderInputSchema = z.object({
  id: z.uuid(),
  name: z.string().trim().min(1).max(80),
});

export const renameMapInputSchema = z.object({
  id: z.uuid(),
  name: z.string().trim().min(1).max(120),
});

export const moveMapInputSchema = z.object({
  id: z.uuid(),
  folderId: z.uuid().nullable(),
});

export const setGridCalibrationInputSchema = z.object({
  id: z.uuid(),
  gridCellSize: z.number().positive().max(2000),
  gridOriginX: z.number(),
  gridOriginY: z.number(),
});

/** One-shot: the client reports a map's native resolution after first decode. */
export const reportDimensionsInputSchema = z.object({
  id: z.uuid(),
  nativeWidth: z.number().int().positive().max(20_000),
  nativeHeight: z.number().int().positive().max(20_000),
});

export const fogStrokeSchema = z.object({
  id: z.string().min(1).max(100),
  x: z.number(),
  y: z.number(),
  radius: z.number().positive().max(20_000),
  softness: z.number().min(0).max(1),
  shape: z.enum(['circle', 'square']),
  mode: z.enum(['reveal', 'cover']),
});

/** The batched write for one brush gesture — one call per pointerup, not per point. */
export const applyFogStrokesInputSchema = z.object({
  id: z.uuid(),
  strokes: z.array(fogStrokeSchema).min(1).max(500),
});

export const toggleFogInputSchema = z.object({
  id: z.uuid(),
  enabled: z.boolean(),
});

export const setFogOpacityInputSchema = z.object({
  id: z.uuid(),
  view: z.enum(['dm', 'table']),
  opacity: z.number().min(0).max(1),
});

export const viewportInputSchema = z.object({
  x: z.number(),
  y: z.number(),
  zoom: z.number().positive().max(20),
  rotation: z.number().nullish(),
});

export const playerScreenSizeInputSchema = z.object({
  width: z.number().int().positive().max(10_000),
  height: z.number().int().positive().max(10_000),
});

export const gridDisplayInputSchema = z.object({
  visible: z.boolean().optional(),
  color: z.string().trim().min(1).max(20).optional(),
  opacity: z.number().min(0).max(1).optional(),
  backgroundColor: z.string().trim().min(1).max(20).optional(),
});

export const setActiveMapInputSchema = z.object({
  mapId: z.uuid().nullable(),
});

export const playerScreenModeInputSchema = z.object({
  mode: z.enum(['map', 'tracker', 'both']),
});

export const playerScreenOrientationInputSchema = z.object({
  orientation: z.enum(['auto', 'landscape', 'portrait']),
});

export const trackerOverlayInputSchema = z.object({
  anchorX: z.number().min(0).max(1).optional(),
  anchorY: z.number().min(0).max(1).optional(),
  scale: z.number().min(0.5).max(2).optional(),
  opacity: z.number().min(0).max(1).optional(),
  showInitiative: z.boolean().optional(),
  showName: z.boolean().optional(),
  showHealth: z.boolean().optional(),
  showConditions: z.boolean().optional(),
});

export const toggleViewportLockInputSchema = z.object({
  locked: z.boolean(),
});
