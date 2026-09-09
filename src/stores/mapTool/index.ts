'use client';

import { create } from 'zustand';

/**
 * Ephemeral client UI state for the Maps DM screen. Server data never lives
 * here — that is TanStack Query's job, via `trpc.maps.*`. The live map, the
 * viewport and the player-view lens are all session-backed
 * (`trpc.maps.getSession`) rather than local state, so they survive a reload
 * and are visible to every tab the DM has open. The lens itself has no
 * "edit mode" to track here — it's always draggable directly on the canvas,
 * gated only by the session's own `isViewportLocked`.
 */

export type FogBrushShape = 'circle' | 'square';
export type FogBrushMode = 'reveal' | 'cover';
export type MapControlPanelId =
  'gallery' | 'grid' | 'fog' | 'session' | 'measure';

type CalibrationPoint = { x: number; y: number };

type FogBrushSettings = {
  enabled: boolean;
  mode: FogBrushMode;
  shape: FogBrushShape;
  /** Radius in map pixels. */
  size: number;
  /** 0 = hard edge, 1 = fully feathered. */
  softness: number;
};

export type MeasurementShapeType =
  'ruler' | 'circle' | 'cone' | 'line' | 'cube';

type MeasurementToolSettings = {
  /** Armed like the fog brush, not one-shot like calibration — several
   * shapes are placed in sequence without re-arming between each. */
  enabled: boolean;
  shapeType: MeasurementShapeType;
  color: string;
  label: string;
  sourceSpellSlug: string | null;
  /** A chosen 5e size preset: one click places a shape of exactly this
   * size, facing a default orientation, instead of the two-click free-drag
   * gesture. Null ("Custom") is the free-drag default; a `ruler` ignores
   * this — it always needs two points, having no size of its own. */
  presetExtentFeet: number | null;
};

type MapToolState = {
  /** `null` means every floating control panel is collapsed — the map fills
   * the screen unobstructed. That's the default: nothing opens on load. */
  activePanel: MapControlPanelId | null;
  setActivePanel: (panel: MapControlPanelId | null) => void;

  calibrationActive: boolean;
  /**
   * Only the fixed first click. The live point while the mouse moves is
   * deliberately not here — it changes on every `pointermove`, and nothing
   * outside the canvas needs it, so it stays a local ref inside
   * `useViewportInteraction` instead of round-tripping through this store.
   */
  calibrationStart: CalibrationPoint | null;
  startCalibration: () => void;
  setCalibrationStart: (point: CalibrationPoint) => void;
  cancelCalibration: () => void;

  fogBrush: FogBrushSettings;
  setFogBrush: (patch: Partial<FogBrushSettings>) => void;

  measurementTool: MeasurementToolSettings;
  setMeasurementTool: (patch: Partial<MeasurementToolSettings>) => void;
};

export const useMapToolStore = create<MapToolState>(set => ({
  activePanel: null,
  setActivePanel: panel => set({ activePanel: panel }),

  calibrationActive: false,
  calibrationStart: null,
  startCalibration: () =>
    set({ calibrationActive: true, calibrationStart: null }),
  setCalibrationStart: point => set({ calibrationStart: point }),
  cancelCalibration: () =>
    set({ calibrationActive: false, calibrationStart: null }),

  fogBrush: {
    enabled: false,
    mode: 'reveal',
    shape: 'circle',
    size: 60,
    softness: 0.4,
  },
  setFogBrush: patch =>
    set(state => ({ fogBrush: { ...state.fogBrush, ...patch } })),

  measurementTool: {
    enabled: false,
    shapeType: 'circle',
    color: '#6fa7ff',
    label: '',
    sourceSpellSlug: null,
    presetExtentFeet: null,
  },
  setMeasurementTool: patch =>
    set(state => ({
      measurementTool: { ...state.measurementTool, ...patch },
    })),
}));
