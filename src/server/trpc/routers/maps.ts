import { and, asc, eq, isNull } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';
import { createTRPCRouter, publicProcedure } from '~/server/trpc/init';
import {
  CURRENT_MAP_SESSION_ID,
  mapFolders,
  mapMeasurementShapes,
  mapSessions,
  maps,
} from '~/server/db/schema';
import {
  applyFogStrokesInputSchema,
  createFolderInputSchema,
  createMeasurementShapeInputSchema,
  folderIdInputSchema,
  gridDisplayInputSchema,
  listMeasurementShapesInputSchema,
  mapIdInputSchema,
  measurementShapeIdInputSchema,
  moveMapInputSchema,
  playerScreenModeInputSchema,
  playerScreenOrientationInputSchema,
  playerScreenSizeInputSchema,
  renameFolderInputSchema,
  renameMapInputSchema,
  reportDimensionsInputSchema,
  setActiveMapInputSchema,
  setFogOpacityInputSchema,
  setGridCalibrationInputSchema,
  setLivePreviewShapeInputSchema,
  setMeasurementCursorInputSchema,
  toggleFogInputSchema,
  toggleViewportLockInputSchema,
  trackerOverlayInputSchema,
  updateMeasurementShapeInputSchema,
  viewportInputSchema,
} from '~/server/trpc/schemas/maps';
import { buildMapGallery } from '~/server/trpc/helpers/buildMapGallery';
import { applyFogStrokeBatch } from '~/server/trpc/helpers/applyFogStrokeBatch';
import { toMapDetail } from '~/server/trpc/helpers/toMapDetail';
import {
  tombstoneSyncMeta,
  touchSyncMeta,
} from '~/server/trpc/helpers/touchSyncMeta';
import { publishMapsChanged } from '~/server/maps/events';
import { ensureMapSession } from '~/server/maps/session';
import type { Database } from '~/server/db';

const isLiveMap = isNull(maps.deletedAt);
const isLiveFolder = isNull(mapFolders.deletedAt);

const loadMap = async (db: Database, id: string) => {
  const map = await db.query.maps.findFirst({
    where: and(eq(maps.id, id), isLiveMap),
  });

  if (!map) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: 'That map no longer exists.',
    });
  }

  return map;
};

const loadFolder = async (db: Database, id: string) => {
  const folder = await db.query.mapFolders.findFirst({
    where: and(eq(mapFolders.id, id), isLiveFolder),
  });

  if (!folder) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: 'That folder no longer exists.',
    });
  }

  return folder;
};

export const mapsRouter = createTRPCRouter({
  list: publicProcedure.query(async ({ ctx }) => {
    const [folderRows, mapRows] = await Promise.all([
      ctx.db.query.mapFolders.findMany({ where: isLiveFolder }),
      ctx.db.query.maps.findMany({ where: isLiveMap }),
    ]);

    return buildMapGallery({ folders: folderRows, maps: mapRows });
  }),

  /** The full row — grid calibration, fog state — for the canvas to render. */
  get: publicProcedure.input(mapIdInputSchema).query(async ({ ctx, input }) => {
    const map = await ctx.db.query.maps.findFirst({
      where: and(eq(maps.id, input.id), isLiveMap),
    });

    return map ? toMapDetail(map) : null;
  }),

  createFolder: publicProcedure
    .input(createFolderInputSchema)
    .mutation(async ({ ctx, input }) => {
      const [created] = await ctx.db
        .insert(mapFolders)
        .values({ name: input.name })
        .returning();

      publishMapsChanged();

      return created;
    }),

  renameFolder: publicProcedure
    .input(renameFolderInputSchema)
    .mutation(async ({ ctx, input }) => {
      const existing = await loadFolder(ctx.db, input.id);

      const [updated] = await ctx.db
        .update(mapFolders)
        .set({
          name: input.name,
          ...touchSyncMeta({ version: existing.version, now: new Date() }),
        })
        .where(eq(mapFolders.id, input.id))
        .returning();

      publishMapsChanged();

      return updated;
    }),

  /** Contained maps move to the root — deleting a folder is not deleting its maps. */
  deleteFolder: publicProcedure
    .input(folderIdInputSchema)
    .mutation(async ({ ctx, input }) => {
      const existing = await loadFolder(ctx.db, input.id);
      const now = new Date();

      await ctx.db
        .update(maps)
        .set({ folderId: null })
        .where(and(eq(maps.folderId, input.id), isLiveMap));

      await ctx.db
        .update(mapFolders)
        .set(tombstoneSyncMeta({ version: existing.version, now }))
        .where(eq(mapFolders.id, input.id));

      publishMapsChanged();

      return { id: input.id };
    }),

  rename: publicProcedure
    .input(renameMapInputSchema)
    .mutation(async ({ ctx, input }) => {
      const existing = await loadMap(ctx.db, input.id);

      const [updated] = await ctx.db
        .update(maps)
        .set({
          name: input.name,
          ...touchSyncMeta({ version: existing.version, now: new Date() }),
        })
        .where(eq(maps.id, input.id))
        .returning();

      publishMapsChanged();

      return updated;
    }),

  move: publicProcedure
    .input(moveMapInputSchema)
    .mutation(async ({ ctx, input }) => {
      const existing = await loadMap(ctx.db, input.id);

      if (input.folderId) await loadFolder(ctx.db, input.folderId);

      const [updated] = await ctx.db
        .update(maps)
        .set({
          folderId: input.folderId,
          ...touchSyncMeta({ version: existing.version, now: new Date() }),
        })
        .where(eq(maps.id, input.id))
        .returning();

      publishMapsChanged();

      return updated;
    }),

  remove: publicProcedure
    .input(mapIdInputSchema)
    .mutation(async ({ ctx, input }) => {
      const existing = await loadMap(ctx.db, input.id);

      await ctx.db
        .update(maps)
        .set(tombstoneSyncMeta({ version: existing.version, now: new Date() }))
        .where(eq(maps.id, input.id));

      await clearActiveMapIfRemoved(ctx.db, input.id);
      publishMapsChanged();

      return { id: input.id };
    }),

  setGridCalibration: publicProcedure
    .input(setGridCalibrationInputSchema)
    .mutation(async ({ ctx, input }) => {
      const existing = await loadMap(ctx.db, input.id);

      const [updated] = await ctx.db
        .update(maps)
        .set({
          gridCellSize: input.gridCellSize,
          gridOriginX: input.gridOriginX,
          gridOriginY: input.gridOriginY,
          ...touchSyncMeta({ version: existing.version, now: new Date() }),
        })
        .where(eq(maps.id, input.id))
        .returning();

      publishMapsChanged();

      return updated;
    }),

  /** One-shot and idempotent: once known, a map's native dimensions never change. */
  reportDimensions: publicProcedure
    .input(reportDimensionsInputSchema)
    .mutation(async ({ ctx, input }) => {
      const existing = await loadMap(ctx.db, input.id);

      if (existing.nativeWidth && existing.nativeHeight) return existing;

      const [updated] = await ctx.db
        .update(maps)
        .set({
          nativeWidth: input.nativeWidth,
          nativeHeight: input.nativeHeight,
          ...touchSyncMeta({ version: existing.version, now: new Date() }),
        })
        .where(eq(maps.id, input.id))
        .returning();

      return updated;
    }),

  toggleFog: publicProcedure
    .input(toggleFogInputSchema)
    .mutation(async ({ ctx, input }) => {
      const existing = await loadMap(ctx.db, input.id);

      const [updated] = await ctx.db
        .update(maps)
        .set({
          fog: { ...existing.fog, enabled: input.enabled },
          ...touchSyncMeta({ version: existing.version, now: new Date() }),
        })
        .where(eq(maps.id, input.id))
        .returning();

      publishMapsChanged();

      return updated;
    }),

  resetFog: publicProcedure
    .input(mapIdInputSchema)
    .mutation(async ({ ctx, input }) => {
      const existing = await loadMap(ctx.db, input.id);

      const [updated] = await ctx.db
        .update(maps)
        .set({
          fog: { ...existing.fog, baseState: 'covered', strokes: [] },
          ...touchSyncMeta({ version: existing.version, now: new Date() }),
        })
        .where(eq(maps.id, input.id))
        .returning();

      publishMapsChanged();

      return updated;
    }),

  revealFog: publicProcedure
    .input(mapIdInputSchema)
    .mutation(async ({ ctx, input }) => {
      const existing = await loadMap(ctx.db, input.id);

      const [updated] = await ctx.db
        .update(maps)
        .set({
          fog: { ...existing.fog, baseState: 'revealed', strokes: [] },
          ...touchSyncMeta({ version: existing.version, now: new Date() }),
        })
        .where(eq(maps.id, input.id))
        .returning();

      publishMapsChanged();

      return updated;
    }),

  setFogOpacity: publicProcedure
    .input(setFogOpacityInputSchema)
    .mutation(async ({ ctx, input }) => {
      const existing = await loadMap(ctx.db, input.id);
      const key = input.view === 'dm' ? 'opacityDm' : 'opacityTable';

      const [updated] = await ctx.db
        .update(maps)
        .set({
          fog: { ...existing.fog, [key]: input.opacity },
          ...touchSyncMeta({ version: existing.version, now: new Date() }),
        })
        .where(eq(maps.id, input.id))
        .returning();

      publishMapsChanged();

      return updated;
    }),

  /** The batched write for one brush gesture — one call per pointerup. */
  applyFogStrokes: publicProcedure
    .input(applyFogStrokesInputSchema)
    .mutation(async ({ ctx, input }) => {
      const existing = await loadMap(ctx.db, input.id);

      const [updated] = await ctx.db
        .update(maps)
        .set({
          fog: applyFogStrokeBatch(existing.fog, input.strokes),
          ...touchSyncMeta({ version: existing.version, now: new Date() }),
        })
        .where(eq(maps.id, input.id))
        .returning();

      publishMapsChanged();

      return updated;
    }),

  getSession: publicProcedure.query(async ({ ctx }) =>
    ensureMapSession(ctx.db),
  ),

  /** Replaces the client-only "preview" concept: picking a map in the
   * gallery now sets the table's live map, there is no separate DM preview. */
  setActiveMap: publicProcedure
    .input(setActiveMapInputSchema)
    .mutation(async ({ ctx, input }) => {
      const existing = await ensureMapSession(ctx.db);

      const [updated] = await ctx.db
        .update(mapSessions)
        .set({
          activeMapId: input.mapId,
          ...touchSyncMeta({ version: existing.version, now: new Date() }),
        })
        .where(eq(mapSessions.id, CURRENT_MAP_SESSION_ID))
        .returning();

      publishMapsChanged();

      return updated;
    }),

  /** Debounced on the client (not per frame) — persisted so the DM's view
   * survives a restart, but never broadcast to the player. */
  setDmViewport: publicProcedure
    .input(viewportInputSchema)
    .mutation(async ({ ctx, input }) => {
      const existing = await ensureMapSession(ctx.db);

      const [updated] = await ctx.db
        .update(mapSessions)
        .set({
          dmViewportX: input.x,
          dmViewportY: input.y,
          dmViewportZoom: input.zoom,
          ...touchSyncMeta({ version: existing.version, now: new Date() }),
        })
        .where(eq(mapSessions.id, CURRENT_MAP_SESSION_ID))
        .returning();

      return updated;
    }),

  /** The lens — called live while it's being dragged or wheel-zoomed
   * (throttled to at most once per animation frame on the client, see
   * `MapCanvasView`), not just once the gesture ends, so the player screen
   * tracks it in near-real-time. */
  setPlayerViewport: publicProcedure
    .input(viewportInputSchema)
    .mutation(async ({ ctx, input }) => {
      const existing = await ensureMapSession(ctx.db);

      const [updated] = await ctx.db
        .update(mapSessions)
        .set({
          playerViewportX: input.x,
          playerViewportY: input.y,
          playerViewportZoom: input.zoom,
          ...touchSyncMeta({ version: existing.version, now: new Date() }),
        })
        .where(eq(mapSessions.id, CURRENT_MAP_SESSION_ID))
        .returning();

      publishMapsChanged();

      return updated;
    }),

  /** Reported by the player screen itself, so the DM's lens sizes correctly
   * against its actual aspect ratio. A no-op when unchanged. */
  setPlayerScreenSize: publicProcedure
    .input(playerScreenSizeInputSchema)
    .mutation(async ({ ctx, input }) => {
      const existing = await ensureMapSession(ctx.db);

      if (
        existing.playerScreenWidth === input.width &&
        existing.playerScreenHeight === input.height
      ) {
        return existing;
      }

      const [updated] = await ctx.db
        .update(mapSessions)
        .set({
          playerScreenWidth: input.width,
          playerScreenHeight: input.height,
          ...touchSyncMeta({ version: existing.version, now: new Date() }),
        })
        .where(eq(mapSessions.id, CURRENT_MAP_SESSION_ID))
        .returning();

      publishMapsChanged();

      return updated;
    }),

  setPlayerScreenMode: publicProcedure
    .input(playerScreenModeInputSchema)
    .mutation(async ({ ctx, input }) => {
      const existing = await ensureMapSession(ctx.db);

      const [updated] = await ctx.db
        .update(mapSessions)
        .set({
          playerScreenMode: input.mode,
          ...touchSyncMeta({ version: existing.version, now: new Date() }),
        })
        .where(eq(mapSessions.id, CURRENT_MAP_SESSION_ID))
        .returning();

      publishMapsChanged();

      return updated;
    }),

  /** Page-level: rotates the whole player screen 90° to match a physically
   * landscape/portrait TV. `auto` leaves it to whatever the screen itself
   * reports (see `PlayerScreenStage`). */
  setPlayerScreenOrientation: publicProcedure
    .input(playerScreenOrientationInputSchema)
    .mutation(async ({ ctx, input }) => {
      const existing = await ensureMapSession(ctx.db);

      const [updated] = await ctx.db
        .update(mapSessions)
        .set({
          playerScreenOrientation: input.orientation,
          ...touchSyncMeta({ version: existing.version, now: new Date() }),
        })
        .where(eq(mapSessions.id, CURRENT_MAP_SESSION_ID))
        .returning();

      publishMapsChanged();

      return updated;
    }),

  /** The tracker overlay in 'both' mode. Position (`anchorX`/`anchorY`) is
   * written live, once per animation frame, while the DM drags it on their
   * own canvas — the same cadence as `setPlayerViewport`. Scale/opacity/
   * show* fields are written once per settings-tab change, like
   * `setGridDisplay`. Both cadences share this one partial-patch mutation. */
  setTrackerOverlay: publicProcedure
    .input(trackerOverlayInputSchema)
    .mutation(async ({ ctx, input }) => {
      const existing = await ensureMapSession(ctx.db);

      const [updated] = await ctx.db
        .update(mapSessions)
        .set({
          ...(input.anchorX !== undefined && {
            trackerOverlayAnchorX: input.anchorX,
          }),
          ...(input.anchorY !== undefined && {
            trackerOverlayAnchorY: input.anchorY,
          }),
          ...(input.scale !== undefined && {
            trackerOverlayScale: input.scale,
          }),
          ...(input.opacity !== undefined && {
            trackerOverlayOpacity: input.opacity,
          }),
          ...(input.showInitiative !== undefined && {
            trackerOverlayShowInitiative: input.showInitiative,
          }),
          ...(input.showName !== undefined && {
            trackerOverlayShowName: input.showName,
          }),
          ...(input.showHealth !== undefined && {
            trackerOverlayShowHealth: input.showHealth,
          }),
          ...(input.showConditions !== undefined && {
            trackerOverlayShowConditions: input.showConditions,
          }),
          ...touchSyncMeta({ version: existing.version, now: new Date() }),
        })
        .where(eq(mapSessions.id, CURRENT_MAP_SESSION_ID))
        .returning();

      publishMapsChanged();

      return updated;
    }),

  setGridDisplay: publicProcedure
    .input(gridDisplayInputSchema)
    .mutation(async ({ ctx, input }) => {
      const existing = await ensureMapSession(ctx.db);

      const [updated] = await ctx.db
        .update(mapSessions)
        .set({
          ...(input.visible !== undefined && { gridVisible: input.visible }),
          ...(input.color !== undefined && { gridColor: input.color }),
          ...(input.opacity !== undefined && { gridOpacity: input.opacity }),
          ...(input.backgroundColor !== undefined && {
            gridBackgroundColor: input.backgroundColor,
          }),
          ...touchSyncMeta({ version: existing.version, now: new Date() }),
        })
        .where(eq(mapSessions.id, CURRENT_MAP_SESSION_ID))
        .returning();

      publishMapsChanged();

      return updated;
    }),

  setViewportLocked: publicProcedure
    .input(toggleViewportLockInputSchema)
    .mutation(async ({ ctx, input }) => {
      const existing = await ensureMapSession(ctx.db);

      const [updated] = await ctx.db
        .update(mapSessions)
        .set({
          isViewportLocked: input.locked,
          ...touchSyncMeta({ version: existing.version, now: new Date() }),
        })
        .where(eq(mapSessions.id, CURRENT_MAP_SESSION_ID))
        .returning();

      publishMapsChanged();

      return updated;
    }),

  /** Every ruler/template placed on this map, oldest first — several can
   * coexist, each cleared individually (DECISIONS: issue #1). */
  listMeasurementShapes: publicProcedure
    .input(listMeasurementShapesInputSchema)
    .query(({ ctx, input }) =>
      ctx.db.query.mapMeasurementShapes.findMany({
        where: and(
          eq(mapMeasurementShapes.mapId, input.mapId),
          isNull(mapMeasurementShapes.deletedAt),
        ),
        orderBy: asc(mapMeasurementShapes.createdAt),
      }),
    ),

  /** The DB write for a placed shape — the second, confirming click. The
   * live-drag frames leading up to it are not individually persisted, only
   * broadcast via `setLivePreviewShape`. */
  createMeasurementShape: publicProcedure
    .input(createMeasurementShapeInputSchema)
    .mutation(async ({ ctx, input }) => {
      await loadMap(ctx.db, input.mapId);

      const [created] = await ctx.db
        .insert(mapMeasurementShapes)
        .values({
          mapId: input.mapId,
          shapeType: input.shapeType,
          originX: input.originX,
          originY: input.originY,
          extentFeet: input.extentFeet,
          orientation: input.orientation,
          label: input.label || null,
          color: input.color || undefined,
          sourceSpellSlug: input.sourceSpellSlug || null,
        })
        .returning();

      publishMapsChanged();

      return created;
    }),

  /** A drag-to-move of an already-placed shape — position only. Size,
   * orientation, label and color are set once at creation. */
  updateMeasurementShape: publicProcedure
    .input(updateMeasurementShapeInputSchema)
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.query.mapMeasurementShapes.findFirst({
        where: and(
          eq(mapMeasurementShapes.id, input.id),
          isNull(mapMeasurementShapes.deletedAt),
        ),
      });

      if (!existing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'That shape is already gone.',
        });
      }

      const [updated] = await ctx.db
        .update(mapMeasurementShapes)
        .set({
          originX: input.originX,
          originY: input.originY,
          ...touchSyncMeta({ version: existing.version, now: new Date() }),
        })
        .where(eq(mapMeasurementShapes.id, input.id))
        .returning();

      publishMapsChanged();

      return updated;
    }),

  removeMeasurementShape: publicProcedure
    .input(measurementShapeIdInputSchema)
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.query.mapMeasurementShapes.findFirst({
        where: and(
          eq(mapMeasurementShapes.id, input.id),
          isNull(mapMeasurementShapes.deletedAt),
        ),
      });

      if (!existing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'That shape is already gone.',
        });
      }

      await ctx.db
        .update(mapMeasurementShapes)
        .set(tombstoneSyncMeta({ version: existing.version, now: new Date() }))
        .where(eq(mapMeasurementShapes.id, input.id));

      publishMapsChanged();

      return { id: input.id };
    }),

  /** The shape the DM is currently dragging into place, written live at
   * most once per animation frame (see `MapCanvasView`'s scheduler) — the
   * same cadence `setPlayerViewport` uses for the lens, so the player
   * screen tracks it while it's still being aimed. */
  setLivePreviewShape: publicProcedure
    .input(setLivePreviewShapeInputSchema)
    .mutation(async ({ ctx, input }) => {
      const existing = await ensureMapSession(ctx.db);

      const [updated] = await ctx.db
        .update(mapSessions)
        .set({
          livePreviewShape: input.preview,
          ...touchSyncMeta({ version: existing.version, now: new Date() }),
        })
        .where(eq(mapSessions.id, CURRENT_MAP_SESSION_ID))
        .returning();

      publishMapsChanged();

      return updated;
    }),

  /** Where the DM's cursor sits while the measurement tool is armed but no
   * origin has been clicked yet — the "aim" reticle the player screen shows
   * before there's a shape to preview. Same live, at-most-once-per-frame
   * cadence as `setLivePreviewShape`. */
  setMeasurementCursor: publicProcedure
    .input(setMeasurementCursorInputSchema)
    .mutation(async ({ ctx, input }) => {
      const existing = await ensureMapSession(ctx.db);

      const [updated] = await ctx.db
        .update(mapSessions)
        .set({
          measurementCursor: input.cursor,
          ...touchSyncMeta({ version: existing.version, now: new Date() }),
        })
        .where(eq(mapSessions.id, CURRENT_MAP_SESSION_ID))
        .returning();

      publishMapsChanged();

      return updated;
    }),
});

/** A removed map must not stay the active one in the live session. */
const clearActiveMapIfRemoved = async (db: Database, removedId: string) => {
  await db
    .update(mapSessions)
    .set({ activeMapId: null })
    .where(
      and(
        eq(mapSessions.id, CURRENT_MAP_SESSION_ID),
        eq(mapSessions.activeMapId, removedId),
      ),
    );
};
