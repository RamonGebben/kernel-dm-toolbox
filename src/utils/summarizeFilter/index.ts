export interface FilterOption<TValue> {
  value: TValue;
  label: string;
}

export interface FilterRange<TValue> {
  min: TValue | null;
  max: TValue | null;
}

/** How many labels a tag spells out before it collapses the rest to "+N". */
const MAX_SHOWN_LABELS = 2;

const labelFor = <TValue>(
  options: ReadonlyArray<FilterOption<TValue>>,
  value: TValue,
): string =>
  options.find(option => option.value === value)?.label ?? String(value);

/**
 * The text a collapsed filter tag shows for a multi-choice filter —
 * "Dragon, Undead", or "Dragon, Fiend +2" once there are too many to fit —
 * and `null` when nothing is selected, meaning the filter isn't applied.
 *
 * Labels follow the options' own order, not the order they were ticked in,
 * so the same selection always reads the same way.
 */
export const summarizeSelection = (
  options: ReadonlyArray<FilterOption<string>>,
  selectedValues: ReadonlyArray<string>,
): string | null => {
  if (!selectedValues.length) return null;

  const known = options.filter(option => selectedValues.includes(option.value));
  const unknown = selectedValues.filter(
    value => !options.some(option => option.value === value),
  );
  const labels = [...known.map(option => option.label), ...unknown];
  const shown = labels.slice(0, MAX_SHOWN_LABELS).join(', ');
  const hiddenCount = labels.length - MAX_SHOWN_LABELS;

  return hiddenCount > 0 ? `${shown} +${hiddenCount}` : shown;
};

/**
 * The tag text for a from–to filter: "1/4–2", "≥ 1/4", "≤ 2", a single
 * value when both bounds agree, and `null` when neither bound is set.
 */
export const summarizeRange = <TValue>(
  options: ReadonlyArray<FilterOption<TValue>>,
  range: FilterRange<TValue>,
): string | null => {
  const { min, max } = range;
  if (min == null && max == null) return null;
  if (min == null) return `≤ ${labelFor(options, max as TValue)}`;
  if (max == null) return `≥ ${labelFor(options, min)}`;
  if (min === max) return labelFor(options, min);
  return `${labelFor(options, min)}–${labelFor(options, max)}`;
};
