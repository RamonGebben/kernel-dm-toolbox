'use client';

import styled from 'styled-components';
import { TextInput } from '~/atoms/TextInput';
import { Button } from '~/atoms/Button';
import { EmptyState } from '~/atoms/EmptyState';
import type { CreatureSummary } from '~/organisms/CreatureLibrary/components/CreatureLibraryView';
import type { BaseSelection } from '~/organisms/NewCreatureWizard/hooks/useNewCreatureWizard';

export type BasePickerProps = {
  search: string;
  onSearchChange: (search: string) => void;
  creatures: readonly CreatureSummary[];
  isPending: boolean;
  onChoose: (selection: BaseSelection) => void;
};

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
  <Wrapper>
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
      {isPending && <Skeleton role="status" aria-label="Loading creatures" />}

      {!isPending && !creatures.length && (
        <EmptyState
          title="No matches"
          description={`Nothing matches “${search}”.`}
        />
      )}

      {!isPending && creatures.length > 0 && (
        <List>
          {creatures.map(creature => (
            <li
              key={`${creature.source}-${creature.source === 'library' ? creature.slug : creature.id}`}
            >
              <Row>
                <span>{creature.name}</span>
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
        </List>
      )}
    </Results>
  </Wrapper>
);

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.space.sm};
`;

const Results = styled.div`
  max-height: 20rem;
  overflow-y: auto;
`;

const List = styled.ul`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.space.xs};
  margin: 0;
  padding: 0;
  list-style: none;
`;

const Row = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${props => props.theme.space.sm};
  padding: ${props => props.theme.space.sm};
  background: ${props => props.theme.color.canvas};
  border: 1px solid ${props => props.theme.color.border};
  border-radius: ${props => props.theme.radius.sm};
`;

const Skeleton = styled.div`
  height: 8rem;
  border-radius: ${props => props.theme.radius.sm};
  background: ${props => props.theme.color.surfaceRaised};
`;
