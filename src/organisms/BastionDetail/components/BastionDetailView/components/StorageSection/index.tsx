'use client';

import { useState, type FormEvent } from 'react';
import styled from 'styled-components';
import { Button } from '~/atoms/Button';
import { Select } from '~/atoms/FormControls';
import { SectionHeading } from '~/atoms/SectionHeading';
import { TextInput } from '~/atoms/TextInput';
import type { BastionDetail } from '~/server/trpc/helpers/toBastionDetail';

export type StorageSectionProps = {
  items: BastionDetail['storage'];
  /** Who can claim an item. */
  characters: readonly { id: string; name: string }[];
  onAdd: (item: { name: string; quantity: number; note?: string }) => void;
  onClaim: (itemId: string, characterId: string | null) => void;
  onRemove: (itemId: string) => void;
};

/**
 * What the bastion has made or found and nobody has collected. Bastion turns
 * will fill this on their own; for now the DM adds to it by hand.
 */
export const StorageSection = ({
  items,
  characters,
  onAdd,
  onClaim,
  onRemove,
}: StorageSectionProps) => {
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('1');

  const add = (event: FormEvent) => {
    event.preventDefault();
    if (!name.trim()) return;

    onAdd({ name: name.trim(), quantity: Math.max(1, Number(quantity) || 1) });
    setName('');
    setQuantity('1');
  };

  return (
    <Section aria-label="Storage">
      <SectionHeading>Storage</SectionHeading>

      {items.length ? (
        <List>
          {items.map(item => (
            <Row key={item.id}>
              <span>
                {item.name}
                {item.quantity > 1 ? ` ×${item.quantity}` : ''}
                {item.note ? <Muted> · {item.note}</Muted> : null}
              </span>
              <Actions>
                <Select
                  aria-label={`Who claimed ${item.name}`}
                  value={item.claimedBy?.id ?? ''}
                  onChange={event =>
                    onClaim(item.id, event.target.value || null)
                  }
                >
                  <option value="">Unclaimed</option>
                  {characters.map(character => (
                    <option key={character.id} value={character.id}>
                      {character.name}
                    </option>
                  ))}
                </Select>
                <Button
                  variant="ghost"
                  size="sm"
                  aria-label={`Remove ${item.name}`}
                  onClick={() => onRemove(item.id)}
                >
                  Remove
                </Button>
              </Actions>
            </Row>
          ))}
        </List>
      ) : (
        <Muted>Nothing in storage.</Muted>
      )}

      <AddForm onSubmit={add}>
        <TextInput
          aria-label="Item"
          placeholder="Item"
          value={name}
          onChange={event => setName(event.target.value)}
        />
        <QuantityInput
          aria-label="Quantity"
          type="number"
          min={1}
          value={quantity}
          onChange={event => setQuantity(event.target.value)}
        />
        <Button type="submit" size="sm" disabled={!name.trim()}>
          Store
        </Button>
      </AddForm>
    </Section>
  );
};

const Section = styled.section`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.space.sm};
`;

const List = styled.ul`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.space.xs};
  margin: 0;
  padding: 0;
  list-style: none;
`;

const Row = styled.li`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: ${props => props.theme.space.sm};
  padding: ${props => props.theme.space.xs} ${props => props.theme.space.sm};
  border: 1px solid ${props => props.theme.color.border};
  border-radius: ${props => props.theme.radius.sm};
  color: ${props => props.theme.color.textPrimary};
`;

const Actions = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.space.xs};
`;

const Muted = styled.span`
  font-size: ${props => props.theme.fontSize.sm};
  color: ${props => props.theme.color.textMuted};
`;

const AddForm = styled.form`
  display: flex;
  gap: ${props => props.theme.space.sm};
`;

const QuantityInput = styled(TextInput)`
  width: 5rem;
`;
