/**
 * Pure geometry for rotating the player screen 90° to match a physically
 * landscape/portrait TV. The player screen's own reported viewport size is
 * "physical" — what the browser actually measures; `auto` follows it as-is,
 * while an explicit override rotates the rendered frame instead.
 */

export type PlayerScreenOrientationSetting = 'auto' | 'landscape' | 'portrait';
export type PhysicalOrientation = 'landscape' | 'portrait';

export type PhysicalSize = { width: number; height: number };

/** A square viewport counts as landscape — there's no rotation to prefer. */
export const derivePhysicalOrientation = (
  size: PhysicalSize,
): PhysicalOrientation => (size.width >= size.height ? 'landscape' : 'portrait');

export const resolveEffectiveOrientation = (
  setting: PlayerScreenOrientationSetting,
  physical: PhysicalOrientation,
): PhysicalOrientation => (setting === 'auto' ? physical : setting);

export type OrientationFrame = {
  rotationDeg: 0 | 90;
  /** The frame's own local (pre-rotation) box. Swapped relative to the
   * physical viewport exactly when a rotation is needed, so the rotated
   * frame's bounding box exactly refills the physical viewport. */
  width: number;
  height: number;
};

/** The frame the player screen's content should render into, given its
 * actual physical size and the DM's orientation setting. */
export const computeOrientationFrame = (
  physicalSize: PhysicalSize,
  setting: PlayerScreenOrientationSetting,
): OrientationFrame => {
  const physical = derivePhysicalOrientation(physicalSize);
  const effective = resolveEffectiveOrientation(setting, physical);

  if (effective === physical) {
    return { rotationDeg: 0, width: physicalSize.width, height: physicalSize.height };
  }

  return {
    rotationDeg: 90,
    width: physicalSize.height,
    height: physicalSize.width,
  };
};
