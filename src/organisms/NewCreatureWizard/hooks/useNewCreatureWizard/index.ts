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
    isSaving: create.isPending,
    chooseBase,
    backToPickBase: () => setStep('pick-base'),
    submit: (values: CustomCreatureFormValues) =>
      create.mutate(toCreateCustomCreatureInput(values)),
    reset,
  };
};
