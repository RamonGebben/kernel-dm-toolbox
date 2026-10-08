'use client';

import { TextInput } from '~/atoms/TextInput';
import { Button } from '~/atoms/Button';
import { EmptyState } from '~/atoms/EmptyState';
import type { CreatureSummary } from '~/organisms/CreatureLibrary/components/CreatureLibraryView';
import type { BaseSelection } from '~/organisms/NewCreatureWizard/hooks/useNewCreatureWizard';
import { Stack } from '~/atoms/Stack';
import { Results } from '~/organisms/NewCreatureWizard/components/BasePicker/components/Results';
import { PlainList } from '~/atoms/PlainList';
import { Row } from '~/organisms/NewCreatureWizard/components/BasePicker/components/Row';
import { NameAndChallengeRating } from '~/organisms/NewCreatureWizard/components/BasePicker/components/NameAndChallengeRating';
import { MonoCaption } from '~/atoms/MonoCaption';
import { Skeleton } from '~/atoms/Skeleton';

export interface BasePickerProps {
  search: string;
  onSearchChange: (search: string) => void;
  creatures: ReadonlyArray<CreatureSummary>;
  isPending: boolean;
  onChoose: (selection: BaseSelection) => void;
}

/**
 * Step 1 of the "New Creature" wizard: start blank, or search across both
 * the library and the DM's own creatures for something to copy from.
 */
export const BasePicker = ({
  search,
  onSearchChange,
  creatures,
  isPending,
  onChoose,
}: BasePickerProps) => (
  <Stack $gap="s">
    <Button
      type="button"
      variant="secondary"
      onClick={() => onChoose({ kind: 'blank' })}
    >
      Start blank
    </Button>

    <TextInput
      value={search}
      onChange={event => onSearchChange(event.target.value)}
      placeholder="Or search for a creature to copy…"
      aria-label="Search for a base creature"
    />

    <Results>
      {isPending && <Skeleton $height="8rem" aria-label="Loading creatures" />}

      {!isPending && !creatures.length && (
        <EmptyState
          title="No matches"
          description={`Nothing matches “${search}”.`}
        />
      )}

      {!isPending && creatures.length > 0 && (
        <PlainList>
          {creatures.map(creature => (
            <li
              key={`${creature.source}-${creature.source === 'library' ? creature.slug : creature.id}`}
            >
              <Row>
                <NameAndChallengeRating>
                  <span>{creature.name}</span>
                  <MonoCaption>CR {creature.challengeRatingLabel}</MonoCaption>
                </NameAndChallengeRating>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    onChoose(
                      creature.source === 'library'
                        ? { kind: 'library', slug: creature.slug }
                        : { kind: 'custom', id: creature.id },
                    )
                  }
                >
                  Use as base
                </Button>
              </Row>
            </li>
          ))}
        </PlainList>
      )}
    </Results>
  </Stack>
);
