'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTRPC } from '~/trpc/react';
import {
  emptyCustomCreatureForm,
  toCreateCustomCreatureInput,
  type CustomCreatureFormValues,
} from '~/molecules/CustomCreatureForm';
import { toCustomCreatureFormValues } from '~/molecules/CustomCreatureForm/toCustomCreatureFormValues';

export type BaseSelection =
  | { kind: 'blank' }
  | { kind: 'library'; slug: string }
  | { kind: 'custom'; id: string };

export type WizardStep = 'pick-base' | 'form';

type UseNewCreatureWizardArgs = {
  onCreated: (id: string) => void;
};

export const useNewCreatureWizard = ({
  onCreated,
}: UseNewCreatureWizardArgs) => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const [step, setStep] = useState<WizardStep>('pick-base');
  const [search, setSearch] = useState('');
  const [base, setBase] = useState<BaseSelection>({ kind: 'blank' });

  const basePicker = useQuery(
    trpc.library.listCreatures.queryOptions({ search, source: 'all' }),
  );

  const libraryBase = useQuery({
    ...trpc.library.getCreatureRaw.queryOptions({
      slug: base.kind === 'library' ? base.slug : '',
    }),
    enabled: base.kind === 'library',
  });

  const customBase = useQuery({
    ...trpc.customCreatures.getRaw.queryOptions({
      id: base.kind === 'custom' ? base.id : '',
    }),
    enabled: base.kind === 'custom',
  });

  const create = useMutation(
    trpc.customCreatures.create.mutationOptions({
      onSuccess: async created => {
        await queryClient.invalidateQueries({
          queryKey: trpc.library.listCreatures.queryKey(),
        });
        onCreated(created.id);
        reset();
      },
    }),
  );

  const reset = () => {
    setStep('pick-base');
    setSearch('');
    setBase({ kind: 'blank' });
  };

  const chooseBase = (next: BaseSelection) => {
    setBase(next);
    setStep('form');
  };

  const isBasePending =
    (base.kind === 'library' && libraryBase.isPending) ||
    (base.kind === 'custom' && customBase.isPending);

  /**
   * Identifies which base creature the form is currently seeded from — by
   * identity (source + slug/id), not by name. `CustomCreatureForm` is
   * uncontrolled and only re-seeds its draft when React remounts it, so a
   * key derived from `name` alone would fail to remount (and leave the
   * form showing stale data) when two different base creatures happen to
   * share a name.
   */
  const baseKey =
    base.kind === 'blank'
      ? 'blank'
      : base.kind === 'library'
        ? `library:${base.slug}`
        : `custom:${base.id}`;

  const initialValues: CustomCreatureFormValues | null =
    base.kind === 'blank'
      ? emptyCustomCreatureForm
      : base.kind === 'library' && libraryBase.data
        ? toCustomCreatureFormValues(libraryBase.data)
        : base.kind === 'custom' && customBase.data
          ? toCustomCreatureFormValues({
              creature: {
                ...customBase.data.customCreature,
                slug: customBase.data.customCreature.id,
              },
              traits: customBase.data.traits,
              actions: customBase.data.actions,
            })
          : null;

  return {
    step,
    search,
    setSearch,
    creatures: basePicker.data ?? [],
    isBasePickerPending: basePicker.isPending,
    isBasePending,
    initialValues,
    baseKey,
    isSaving: create.isPending,
    chooseBase,
    backToPickBase: () => setStep('pick-base'),
    submit: (values: CustomCreatureFormValues) =>
      create.mutate(toCreateCustomCreatureInput(values)),
    reset,
  };
};
