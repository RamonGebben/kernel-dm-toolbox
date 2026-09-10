import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, fireEvent, fn, within } from 'storybook/test';
import { MapCanvasView } from '~/organisms/MapCanvas/components/MapCanvasView';

/**
 * `onViewportChange` now fires from inside a `requestAnimationFrame`
 * callback, at most once per frame — never synchronously from the DOM event
 * that triggered it. Tests asserting on it need to let one frame pass first.
 */
const waitForFrame = () =>
  new Promise<void>(resolve => requestAnimationFrame(() => resolve()));

const grid = {
  visible: true,
  color: '#e0e5f5',
  opacity: 0.18,
  cellSize: 50,
  originX: 0,
  originY: 0,
};

const meta = {
  title: 'Organisms/MapCanvas/MapCanvasView',
  component: MapCanvasView,
  args: {
    map: null,
    viewport: { x: 0, y: 0, zoom: 1 },
    interactive: true,
    grid,
    onViewportChange: fn(),
    onCalibrateClick: fn(),
    onFogStrokeBatch: fn(),
    onMediaDimensions: fn(),
    onLensChange: fn(),
    onTrackerRectChange: fn(),
    onMeasurementConfirm: fn(),
    onMeasurementPreviewChange: fn(),
    onMeasurementCursorChange: fn(),
    onSelectMeasurementShape: fn(),
    onMeasurementShapeMoved: fn(),
  },
  parameters: {
    // A fixed-size wrapper so pointer coordinates are stable across runs.
    layout: 'fullscreen',
  },
  decorators: [
    Story => (
      <div style={{ width: 600, height: 400 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof MapCanvasView>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Empty: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByLabelText('Map canvas')).toBeVisible();
  },
};

export const Panning: Story = {
  play: async ({ args, canvasElement }) => {
    const element = within(canvasElement).getByLabelText('Map canvas');

    fireEvent.pointerDown(element, {
      pointerId: 1,
      clientX: 100,
      clientY: 100,
    });
    fireEvent.pointerMove(element, {
      pointerId: 1,
      clientX: 140,
      clientY: 120,
    });
    fireEvent.pointerUp(element, { pointerId: 1, clientX: 140, clientY: 120 });
    await waitForFrame();

    // The drag moved (40, 20) screen px at 1x zoom, opposite direction —
    // exact pan math is covered by `~/utils/mapViewport`'s own tests.
    await expect(args.onViewportChange).toHaveBeenCalledWith({
      x: -40,
      y: -20,
      zoom: 1,
    });
  },
};

export const RapidPointerMoveCallsAtMostOncePerFrame: Story = {
  play: async ({ args, canvasElement }) => {
    const element = within(canvasElement).getByLabelText('Map canvas');

    fireEvent.pointerDown(element, {
      pointerId: 1,
      clientX: 100,
      clientY: 100,
    });
    for (let step = 1; step <= 20; step += 1) {
      fireEvent.pointerMove(element, {
        pointerId: 1,
        clientX: 100 + step * 2,
        clientY: 100 + step,
      });
    }
    fireEvent.pointerUp(element, { pointerId: 1, clientX: 140, clientY: 120 });
    await waitForFrame();

    // Twenty moves in one burst collapse into a single notification at the
    // final position — this is the fix for the pan/zoom jank: the outside
    // world hears about a viewport change at most once per animation frame,
    // never once per raw pointer event.
    await expect(args.onViewportChange).toHaveBeenCalledOnce();
    await expect(args.onViewportChange).toHaveBeenCalledWith({
      x: -40,
      y: -20,
      zoom: 1,
    });
  },
};

export const NotInteractive: Story = {
  args: { interactive: false },
  play: async ({ args, canvasElement }) => {
    const element = within(canvasElement).getByLabelText('Map canvas');

    fireEvent.pointerDown(element, {
      pointerId: 1,
      clientX: 100,
      clientY: 100,
    });
    fireEvent.pointerMove(element, {
      pointerId: 1,
      clientX: 140,
      clientY: 120,
    });
    fireEvent.pointerUp(element, { pointerId: 1, clientX: 140, clientY: 120 });
    await waitForFrame();

    await expect(args.onViewportChange).not.toHaveBeenCalled();
  },
};

export const ZoomingWithTheWheel: Story = {
  play: async ({ args, canvasElement }) => {
    const element = within(canvasElement).getByLabelText('Map canvas');

    fireEvent.wheel(element, { deltaY: -200, clientX: 300, clientY: 200 });
    await waitForFrame();

    // The exact zoom math is covered by `~/utils/mapViewport`'s own tests —
    // this only proves the wheel event reaches it.
    await expect(args.onViewportChange).toHaveBeenCalledOnce();
  },
};

export const CalibratingTheGrid: Story = {
  args: { calibrationActive: true },
  play: async ({ args, canvasElement }) => {
    const element = within(canvasElement).getByLabelText('Map canvas');

    fireEvent.pointerDown(element, {
      pointerId: 1,
      clientX: 120,
      clientY: 80,
    });
    await waitForFrame();

    await expect(args.onCalibrateClick).toHaveBeenCalledWith({
      x: 120,
      y: 80,
    });
    // Calibrating never pans the map underneath it.
    await expect(args.onViewportChange).not.toHaveBeenCalled();
  },
};

export const PaintingFog: Story = {
  args: {
    fog: { enabled: true, baseState: 'covered', strokes: [] },
    fogTool: {
      enabled: true,
      mode: 'reveal',
      shape: 'circle',
      size: 40,
      softness: 0.4,
    },
  },
  play: async ({ args, canvasElement }) => {
    const element = within(canvasElement).getByLabelText('Map canvas');

    fireEvent.pointerDown(element, {
      pointerId: 1,
      clientX: 200,
      clientY: 150,
    });
    fireEvent.pointerUp(element, { pointerId: 1, clientX: 200, clientY: 150 });
    await waitForFrame();

    await expect(args.onFogStrokeBatch).toHaveBeenCalledWith([
      expect.objectContaining({ shape: 'circle', mode: 'reveal' }),
    ]);
    // Painting fog never pans the map underneath it.
    await expect(args.onViewportChange).not.toHaveBeenCalled();
  },
};

export const FogDisabledIgnoresTheBrush: Story = {
  args: {
    fog: { enabled: false, baseState: 'covered', strokes: [] },
    fogTool: {
      enabled: true,
      mode: 'reveal',
      shape: 'circle',
      size: 40,
      softness: 0.4,
    },
  },
  play: async ({ args, canvasElement }) => {
    const element = within(canvasElement).getByLabelText('Map canvas');

    fireEvent.pointerDown(element, {
      pointerId: 1,
      clientX: 200,
      clientY: 150,
    });
    fireEvent.pointerUp(element, { pointerId: 1, clientX: 200, clientY: 150 });

    // With fog off, a "stroke" click is just the start of a pan instead.
    await expect(args.onFogStrokeBatch).not.toHaveBeenCalled();
  },
};

const lensRect = { x: 50, y: 50, width: 100, height: 60 };
const lensScreenSize = { width: 100, height: 60 };

export const LensVisible: Story = {
  args: { lensRect },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByLabelText('Map canvas')).toBeVisible();
  },
};

export const DraggingTheLensByItsBody: Story = {
  args: { lensRect, lensScreenSize },
  play: async ({ args, canvasElement }) => {
    const element = within(canvasElement).getByLabelText('Map canvas');

    // The lens is always draggable — no "edit mode" toggle needed first.
    // Inside the rect body, not near an edge.
    fireEvent.pointerDown(element, { pointerId: 1, clientX: 100, clientY: 80 });
    fireEvent.pointerMove(element, { pointerId: 1, clientX: 120, clientY: 95 });
    await waitForFrame();

    // Live while dragging — not just committed on release — matching the
    // original app's feel. Capped to at most once per animation frame, the
    // same discipline `onViewportChange` already uses for the DM's own pan.
    await expect(args.onLensChange).toHaveBeenCalledOnce();
    await expect(args.onLensChange).toHaveBeenLastCalledWith({
      x: 70,
      y: 65,
      width: 100,
      height: 60,
    });

    fireEvent.pointerMove(element, {
      pointerId: 1,
      clientX: 140,
      clientY: 110,
    });
    fireEvent.pointerUp(element, { pointerId: 1, clientX: 140, clientY: 110 });
    await waitForFrame();

    // A final commit on release, as a safety net for whatever the last frame
    // didn't get a chance to notify.
    await expect(args.onLensChange).toHaveBeenCalledTimes(2);
    await expect(args.onLensChange).toHaveBeenLastCalledWith({
      x: 90,
      y: 80,
      width: 100,
      height: 60,
    });
    // Dragging the lens is not panning the DM's own view.
    await expect(args.onViewportChange).not.toHaveBeenCalled();
  },
};

export const ZoomingTheLensWithTheWheel: Story = {
  args: { lensRect, lensScreenSize },
  play: async ({ args, canvasElement }) => {
    const element = within(canvasElement).getByLabelText('Map canvas');

    // Scrolling while the cursor is over the lens zooms it, not the DM's own
    // view — the original app's resize gesture, not a corner-handle drag.
    fireEvent.wheel(element, { deltaY: -200, clientX: 100, clientY: 80 });
    await waitForFrame();

    await expect(args.onLensChange).toHaveBeenCalledOnce();
    const zoomedIn = args.onLensChange!.mock.calls[0][0];
    // Exact math is covered by `~/utils/mapLens`'s own tests — this only
    // proves the wheel event reaches it and zooms in (shrinks the rect).
    expect(zoomedIn.width).toBeLessThan(lensRect.width);
    expect(zoomedIn.height).toBeLessThan(lensRect.height);
    // The DM's own view never pans/zooms when the wheel lands on the lens.
    await expect(args.onViewportChange).not.toHaveBeenCalled();
  },
};

export const LensLockedIgnoresDrags: Story = {
  args: { lensRect, lensLocked: true },
  play: async ({ args, canvasElement }) => {
    const element = within(canvasElement).getByLabelText('Map canvas');

    fireEvent.pointerDown(element, { pointerId: 1, clientX: 100, clientY: 80 });
    fireEvent.pointerMove(element, {
      pointerId: 1,
      clientX: 140,
      clientY: 110,
    });
    fireEvent.pointerUp(element, { pointerId: 1, clientX: 140, clientY: 110 });
    await waitForFrame();

    // Locked, a drag over the (still-visible) lens just pans instead.
    await expect(args.onLensChange).not.toHaveBeenCalled();
    await expect(args.onViewportChange).toHaveBeenCalledWith({
      x: -40,
      y: -30,
      zoom: 1,
    });
  },
};

export const FogBrushInsideTheLensPaintsInsteadOfDragging: Story = {
  args: {
    lensRect,
    fog: { enabled: true, baseState: 'covered', strokes: [] },
    fogTool: {
      enabled: true,
      mode: 'reveal',
      shape: 'circle',
      size: 40,
      softness: 0.4,
    },
  },
  play: async ({ args, canvasElement }) => {
    const element = within(canvasElement).getByLabelText('Map canvas');

    // Inside the (unlocked) lens body — the brush wins over grabbing it.
    fireEvent.pointerDown(element, { pointerId: 1, clientX: 100, clientY: 80 });
    fireEvent.pointerUp(element, { pointerId: 1, clientX: 100, clientY: 80 });
    await waitForFrame();

    await expect(args.onFogStrokeBatch).toHaveBeenCalledWith([
      expect.objectContaining({ shape: 'circle', mode: 'reveal' }),
    ]);
    await expect(args.onLensChange).not.toHaveBeenCalled();
  },
};

const trackerRect = { x: 60, y: 60, width: 40, height: 20 };

export const DraggingTheTrackerOverlayByItsBody: Story = {
  args: { lensRect, trackerRect },
  play: async ({ args, canvasElement }) => {
    const element = within(canvasElement).getByLabelText('Map canvas');

    // Inside the tracker rect, which is nested inside the lens — the more
    // specific target must win the hit test, not the (larger) lens.
    fireEvent.pointerDown(element, { pointerId: 1, clientX: 70, clientY: 65 });
    fireEvent.pointerMove(element, { pointerId: 1, clientX: 90, clientY: 85 });
    fireEvent.pointerUp(element, { pointerId: 1, clientX: 90, clientY: 85 });
    await waitForFrame();

    await expect(args.onTrackerRectChange).toHaveBeenCalledWith({
      x: 80,
      y: 80,
      width: 40,
      height: 20,
    });
    // Dragging the tracker is neither dragging the lens nor panning the DM's
    // own view.
    await expect(args.onLensChange).not.toHaveBeenCalled();
    await expect(args.onViewportChange).not.toHaveBeenCalled();
  },
};

export const TrackerOverlayDragClampsToTheLensBounds: Story = {
  args: { lensRect, trackerRect },
  play: async ({ args, canvasElement }) => {
    const element = within(canvasElement).getByLabelText('Map canvas');

    fireEvent.pointerDown(element, { pointerId: 1, clientX: 70, clientY: 65 });
    fireEvent.pointerMove(element, {
      pointerId: 1,
      clientX: 10_000,
      clientY: 65,
    });
    fireEvent.pointerUp(element, {
      pointerId: 1,
      clientX: 10_000,
      clientY: 65,
    });
    await waitForFrame();

    // Never leaves the lens it lives in, however far the drag goes.
    const finalRect = args.onTrackerRectChange!.mock.calls.at(-1)![0];
    expect(finalRect.x).toBe(lensRect.x + lensRect.width - trackerRect.width);
  },
};

export const TrackerOverlayIgnoresDragsWhenLensLocked: Story = {
  args: { lensRect, trackerRect, lensLocked: true },
  play: async ({ args, canvasElement }) => {
    const element = within(canvasElement).getByLabelText('Map canvas');

    // Locked, a drag over the (still-visible) tracker just pans instead —
    // the same rule the lens itself already follows.
    fireEvent.pointerDown(element, { pointerId: 1, clientX: 70, clientY: 65 });
    fireEvent.pointerMove(element, {
      pointerId: 1,
      clientX: 90,
      clientY: 85,
    });
    fireEvent.pointerUp(element, { pointerId: 1, clientX: 90, clientY: 85 });
    await waitForFrame();

    await expect(args.onTrackerRectChange).not.toHaveBeenCalled();
    await expect(args.onViewportChange).toHaveBeenCalledWith({
      x: -20,
      y: -20,
      zoom: 1,
    });
  },
};

export const FogBrushInsideTheLensIgnoresTheWheel: Story = {
  args: {
    lensRect,
    lensScreenSize,
    fog: { enabled: true, baseState: 'covered', strokes: [] },
    fogTool: {
      enabled: true,
      mode: 'reveal',
      shape: 'circle',
      size: 40,
      softness: 0.4,
    },
  },
  play: async ({ args, canvasElement }) => {
    const element = within(canvasElement).getByLabelText('Map canvas');

    fireEvent.wheel(element, { deltaY: -200, clientX: 100, clientY: 80 });
    await waitForFrame();

    // With the brush armed, the wheel zooms the DM's own view as normal —
    // the lens is not zoomed even though the cursor is over it.
    await expect(args.onLensChange).not.toHaveBeenCalled();
    await expect(args.onViewportChange).toHaveBeenCalledOnce();
  },
};

export const PlacingACircleByFreeDrag: Story = {
  args: {
    measurementTool: {
      enabled: true,
      shapeType: 'circle',
      color: '#6fa7ff',
      presetExtentFeet: null,
      label: null,
    },
  },
  play: async ({ args, canvasElement }) => {
    const element = within(canvasElement).getByLabelText('Map canvas');

    // First click sets the origin (snapped to the nearest grid intersection)
    // — VTT-ruler style, not a held drag, so this is not a confirm yet.
    fireEvent.pointerDown(element, { pointerId: 1, clientX: 100, clientY: 80 });
    fireEvent.pointerUp(element, { pointerId: 1, clientX: 100, clientY: 80 });
    await waitForFrame();
    await expect(args.onMeasurementConfirm).not.toHaveBeenCalled();
    // Live-broadcast at most once per frame, same discipline as the lens.
    await expect(args.onMeasurementPreviewChange).toHaveBeenCalledOnce();

    // The second click confirms — extent is grid-square-counted (5e's
    // diagonal-costs-the-same convention), a circle has no orientation.
    fireEvent.pointerDown(element, {
      pointerId: 1,
      clientX: 150,
      clientY: 100,
    });
    fireEvent.pointerUp(element, { pointerId: 1, clientX: 150, clientY: 100 });
    await waitForFrame();

    await expect(args.onMeasurementConfirm).toHaveBeenCalledWith({
      shapeType: 'circle',
      originX: 100,
      originY: 100,
      extentFeet: 5,
      orientation: null,
    });
    // Never pans underneath the placement gesture.
    await expect(args.onViewportChange).not.toHaveBeenCalled();
  },
};

export const PlacingACubeAtAFixedPreset: Story = {
  args: {
    measurementTool: {
      enabled: true,
      shapeType: 'cube',
      color: '#6fa7ff',
      presetExtentFeet: 20,
      label: null,
    },
  },
  play: async ({ args, canvasElement }) => {
    const element = within(canvasElement).getByLabelText('Map canvas');

    // A size preset commits in a single click, at a default orientation —
    // no second click needed.
    fireEvent.pointerDown(element, {
      pointerId: 1,
      clientX: 100,
      clientY: 100,
    });
    fireEvent.pointerUp(element, { pointerId: 1, clientX: 100, clientY: 100 });
    await waitForFrame();

    await expect(args.onMeasurementConfirm).toHaveBeenCalledWith({
      shapeType: 'cube',
      originX: 100,
      originY: 100,
      extentFeet: 20,
      orientation: 0,
    });
  },
};

export const RulerIgnoresAPresetAndAlwaysFreeDrags: Story = {
  args: {
    measurementTool: {
      enabled: true,
      shapeType: 'ruler',
      color: '#6fa7ff',
      presetExtentFeet: 20,
      label: null,
    },
  },
  play: async ({ args, canvasElement }) => {
    const element = within(canvasElement).getByLabelText('Map canvas');

    // A ruler has no size of its own, so a preset is a no-op for it — the
    // first click only sets the origin.
    fireEvent.pointerDown(element, {
      pointerId: 1,
      clientX: 100,
      clientY: 100,
    });
    fireEvent.pointerUp(element, { pointerId: 1, clientX: 100, clientY: 100 });
    await waitForFrame();
    await expect(args.onMeasurementConfirm).not.toHaveBeenCalled();

    fireEvent.pointerDown(element, {
      pointerId: 1,
      clientX: 200,
      clientY: 100,
    });
    fireEvent.pointerUp(element, { pointerId: 1, clientX: 200, clientY: 100 });
    await waitForFrame();

    await expect(args.onMeasurementConfirm).toHaveBeenCalledWith({
      shapeType: 'ruler',
      originX: 100,
      originY: 100,
      extentFeet: 10,
      orientation: 0,
    });
  },
};

export const RightClickCancelsAPendingPlacement: Story = {
  args: {
    measurementTool: {
      enabled: true,
      shapeType: 'circle',
      color: '#6fa7ff',
      presetExtentFeet: null,
      label: null,
    },
  },
  play: async ({ args, canvasElement }) => {
    const element = within(canvasElement).getByLabelText('Map canvas');

    fireEvent.pointerDown(element, {
      pointerId: 1,
      clientX: 100,
      clientY: 100,
    });
    fireEvent.pointerUp(element, { pointerId: 1, clientX: 100, clientY: 100 });
    await waitForFrame();

    fireEvent.contextMenu(element, { clientX: 150, clientY: 100 });
    await waitForFrame();

    // Abandoned, not confirmed — clears the live preview it had broadcast.
    await expect(args.onMeasurementPreviewChange).toHaveBeenLastCalledWith(
      null,
    );

    // A fresh click after cancelling starts a new placement, not a confirm.
    fireEvent.pointerDown(element, {
      pointerId: 1,
      clientX: 200,
      clientY: 100,
    });
    fireEvent.pointerUp(element, { pointerId: 1, clientX: 200, clientY: 100 });
    await waitForFrame();

    await expect(args.onMeasurementConfirm).not.toHaveBeenCalled();
  },
};

export const MeasurementToolTakesPriorityOverTheLens: Story = {
  args: {
    lensRect,
    measurementTool: {
      enabled: true,
      shapeType: 'circle',
      color: '#6fa7ff',
      presetExtentFeet: 10,
      label: null,
    },
  },
  play: async ({ args, canvasElement }) => {
    const element = within(canvasElement).getByLabelText('Map canvas');

    // Inside the (unlocked) lens body — placement still wins.
    fireEvent.pointerDown(element, { pointerId: 1, clientX: 100, clientY: 80 });
    fireEvent.pointerUp(element, { pointerId: 1, clientX: 100, clientY: 80 });
    await waitForFrame();

    await expect(args.onMeasurementConfirm).toHaveBeenCalledOnce();
    await expect(args.onLensChange).not.toHaveBeenCalled();
  },
};

const committedShape = {
  id: 'shape-1',
  shapeType: 'circle' as const,
  originX: 100,
  originY: 100,
  extentFeet: 20,
  orientation: null,
  color: '#ff8a5c',
};

export const CommittedShapesAreAlwaysDrawn: Story = {
  args: { measurementShapes: [committedShape], interactive: false },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Nothing to assert on canvas pixels — this proves the read-only
    // (player-screen) canvas accepts and renders committed shapes without
    // throwing, the same guarantee `NotInteractive` gives the rest of the
    // props.
    await expect(canvas.getByLabelText('Map canvas')).toBeVisible();
  },
};

const spellSourcedShape = {
  ...committedShape,
  id: 'shape-2',
  effectUrl: '/api/effects/does-not-exist/file',
  effectStartedAtMs: Date.now(),
};

export const SpellSourcedShapeFallsBackWhenItsEffectFailsToLoad: Story = {
  args: { measurementShapes: [spellSourcedShape], interactive: false },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // The effect's URL 404s in this environment — proves the canvas keeps
    // rendering the plain static shape (and stops the self-rescheduled
    // redraw loop `isEffectPlaying` drives) rather than getting stuck
    // waiting on a clip that will never load.
    await expect(canvas.getByLabelText('Map canvas')).toBeVisible();
    await waitForFrame();
    await expect(canvas.getByLabelText('Map canvas')).toBeVisible();
  },
};

const overlappingShape = {
  id: 'shape-1',
  shapeType: 'circle' as const,
  originX: 75,
  originY: 65,
  extentFeet: 5,
  orientation: null,
  color: '#ff8a5c',
};

export const SelectingAndMovingAPlacedShapeWinsOverTheLens: Story = {
  args: {
    // The lens defaults to an uncalibrated, screen-sized rect wherever the
    // session's own settings put it — it must never blanket a click meant
    // for a shape that happens to sit inside it (a real bug this regression
    // test caught: the lens hit test ran before the shape hit test).
    lensRect,
    measurementShapes: [overlappingShape],
  },
  play: async ({ args, canvasElement }) => {
    const element = within(canvasElement).getByLabelText('Map canvas');

    // Inside both the lens body and the shape's own footprint.
    fireEvent.pointerDown(element, { pointerId: 1, clientX: 75, clientY: 65 });
    fireEvent.pointerMove(element, { pointerId: 1, clientX: 100, clientY: 90 });
    fireEvent.pointerUp(element, { pointerId: 1, clientX: 100, clientY: 90 });
    await waitForFrame();

    await expect(args.onSelectMeasurementShape).toHaveBeenCalledWith('shape-1');
    await expect(args.onMeasurementShapeMoved).toHaveBeenCalledWith('shape-1', {
      x: 100,
      y: 100,
    });
    await expect(args.onLensChange).not.toHaveBeenCalled();
  },
};

export const ClickingEmptyCanvasDeselects: Story = {
  // Args are static per story (there's no state loop feeding a click's
  // callback back into a prop here), so the "already selected" state is
  // set directly rather than produced by an earlier click in this test.
  args: {
    measurementShapes: [overlappingShape],
    selectedMeasurementShapeId: 'shape-1',
  },
  play: async ({ args, canvasElement }) => {
    const element = within(canvasElement).getByLabelText('Map canvas');

    // A click well outside the shape's footprint deselects, rather than
    // moving it.
    fireEvent.pointerDown(element, {
      pointerId: 1,
      clientX: 400,
      clientY: 400,
    });
    fireEvent.pointerUp(element, { pointerId: 1, clientX: 400, clientY: 400 });

    await expect(args.onSelectMeasurementShape).toHaveBeenCalledWith(null);
    await expect(args.onMeasurementShapeMoved).not.toHaveBeenCalled();
  },
};

export const BroadcastsTheAimCursorBeforeAnOriginIsClicked: Story = {
  args: {
    measurementTool: {
      enabled: true,
      shapeType: 'circle',
      color: '#6fa7ff',
      presetExtentFeet: null,
      label: null,
    },
  },
  play: async ({ args, canvasElement }) => {
    const element = within(canvasElement).getByLabelText('Map canvas');

    fireEvent.pointerMove(element, { pointerId: 1, clientX: 120, clientY: 90 });
    await waitForFrame();

    await expect(args.onMeasurementCursorChange).toHaveBeenCalledWith({
      x: 120,
      y: 90,
    });

    fireEvent.pointerLeave(element);
    await waitForFrame();

    await expect(args.onMeasurementCursorChange).toHaveBeenLastCalledWith(null);
  },
};
