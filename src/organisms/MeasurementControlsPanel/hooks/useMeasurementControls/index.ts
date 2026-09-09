'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTRPC } from '~/trpc/react';
import { useMapToolStore } from '~/stores/mapTool';
import { mapSpellShapeType } from '~/utils/mapMeasurement';

export const useMeasurementControls = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const tool = useMapToolStore(state => state.measurementTool);
  const setTool = useMapToolStore(state => state.setMeasurementTool);

  const session = useQuery(trpc.maps.getSession.queryOptions());
  const activeMapId = session.data?.activeMapId ?? null;

  const shapes = useQuery({
    ...trpc.maps.listMeasurementShapes.queryOptions({
      mapId: activeMapId ?? '',
    }),
    enabled: activeMapId !== null,
  });

  const removeMeasurementShape = useMutation(
    trpc.maps.removeMeasurementShape.mutationOptions({
      onSuccess: () =>
        queryClient.invalidateQueries({
          queryKey: trpc.maps.listMeasurementShapes.queryKey(),
        }),
    }),
  );

  const [spellSearch, setSpellSearch] = useState('');
  const spellResults = useQuery({
    ...trpc.library.listSpells.queryOptions({
      search: spellSearch,
      levels: [],
      classSlugs: [],
      limit: 20,
    }),
    enabled: spellSearch.trim().length > 0,
  });

  // Only spells whose upstream shape maps onto this feature's enum are
  // offered — see `mapSpellShapeType`. Everything else has no size to
  // auto-fill (a touch spell, a single target, …).
  const spellOptions = useMemo(
    () =>
      (spellResults.data ?? []).flatMap(spell => {
        const shapeType = mapSpellShapeType(spell.shapeType);
        if (!shapeType || spell.shapeSize == null) return [];

        return [
          {
            slug: spell.slug,
            name: spell.name,
            shapeType,
            extentFeet: spell.shapeSize,
          },
        ];
      }),
    [spellResults.data],
  );

  return {
    hasSelectedMap: activeMapId !== null,
    tool,
    onToolChange: setTool,
    shapes: shapes.data ?? [],
    onRemoveShape: (id: string) => removeMeasurementShape.mutate({ id }),
    spellSearch,
    onSpellSearchChange: setSpellSearch,
    spellOptions,
    onSelectSpell: (slug: string) => {
      const spell = spellOptions.find(option => option.slug === slug);
      if (!spell) return;

      setTool({
        enabled: true,
        shapeType: spell.shapeType,
        label: spell.name,
        sourceSpellSlug: spell.slug,
        presetExtentFeet: spell.extentFeet,
      });
    },
    onClearSpell: () =>
      setTool({ sourceSpellSlug: null, label: '', presetExtentFeet: null }),
  };
};
