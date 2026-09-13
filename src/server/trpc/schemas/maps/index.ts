import { z } from 'zod';
import { idInputSchema } from '~/server/trpc/schemas/common';

export const mapIdInputSchema = idInputSchema;
export const folderIdInputSchema = idInputSchema;

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

/** Shared by every "TV-readability" scale mutation (label size, aim-cursor
 * size, …) — they all take the same 0.5–3 multiplier. */
export const scaleInputSchema = z.object({
  scale: z.number().min(0.5).max(3),
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

export const measurementShapeTypeSchema = z.enum([
  'ruler',
  'circle',
  'cone',
  'line',
  'cube',
]);

export const listMeasurementShapesInputSchema = z.object({ mapId: z.uuid() });

export const createMeasurementShapeInputSchema = z.object({
  mapId: z.uuid(),
  shapeType: measurementShapeTypeSchema,
  originX: z.number(),
  originY: z.number(),
  extentFeet: z.number().positive().max(2000),
  orientation: z.number().nullable(),
  label: z.string().trim().max(80).nullable().optional(),
  color: z.string().trim().min(1).max(20).optional(),
  sourceSpellSlug: z.string().min(1).max(200).nullable().optional(),
});

export const measurementShapeIdInputSchema = idInputSchema;

const measurementPreviewSchema = z.object({
  mapId: z.uuid(),
  shapeType: measurementShapeTypeSchema,
  originX: z.number(),
  originY: z.number(),
  extentFeet: z.number().positive().max(2000),
  orientation: z.number().nullable(),
  color: z.string().trim().min(1).max(20),
  label: z.string().trim().max(80).nullable(),
});

/** `preview: null` clears it — the DM confirmed, cancelled, or nothing is in
 * progress. */
export const setLivePreviewShapeInputSchema = z.object({
  preview: measurementPreviewSchema.nullable(),
});

/** Repositioning an already-placed shape — a drag-to-move, not a resize.
 * Shape/size/orientation/label/color are set once at creation and edited
 * only by removing and re-placing. */
export const updateMeasurementShapeInputSchema = z.object({
  id: z.uuid(),
  originX: z.number(),
  originY: z.number(),
});

const measurementCursorSchema = z.object({
  mapId: z.uuid(),
  x: z.number(),
  y: z.number(),
  color: z.string().trim().min(1).max(20),
});

/** `cursor: null` clears it — the tool was disarmed or the pointer left the
 * canvas. */
export const setMeasurementCursorInputSchema = z.object({
  cursor: measurementCursorSchema.nullable(),
});
