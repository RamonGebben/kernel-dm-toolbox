'use client';

import { useState, type FormEvent } from 'react';
import { Button } from '~/atoms/Button';
import { Select } from '~/atoms/Select';
import { SectionHeading } from '~/atoms/SectionHeading';
import { TextInput } from '~/atoms/TextInput';
import type { BastionDetail } from '~/server/trpc/helpers/toBastionDetail';
import { formatGold } from '~/utils/applyGoldChange';
import { Stack } from '~/atoms/Stack';
import { PlainList } from '~/atoms/PlainList';
import { Row } from '~/organisms/BastionDetail/components/BastionDetailView/components/Row';
import { Actions } from '~/organisms/BastionDetail/components/BastionDetailView/components/Actions';
import { MutedCaption } from '~/atoms/MutedCaption';
import { Cluster } from '~/atoms/Cluster';
import { QuantityInput } from '~/organisms/BastionDetail/components/BastionDetailView/components/StorageSection/components/QuantityInput';

export interface StorageSectionProps {
  items: BastionDetail['storage'];
  /** Who can claim an item. */
  characters: ReadonlyArray<{ id: string; name: string }>;
  onAdd: (item: { name: string; quantity: number; note?: string }) => void;
  onClaim: (itemId: string, characterId: string | null) => void;
  onRemove: (itemId: string) => void;
}

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
    <Stack as="section" $gap="s" aria-label="Storage">
      <SectionHeading>Storage</SectionHeading>

      {items.length ? (
        <PlainList>
          {items.map(item => (
            <Row key={item.id}>
              <span>
                {item.name}
                {item.quantity > 1 ? ` ×${item.quantity}` : ''}
                {item.valueGp ? (
                  <MutedCaption>
                    {' '}
                    · worth {formatGold(item.valueGp)}
                  </MutedCaption>
                ) : null}
                {item.note ? <MutedCaption> · {item.note}</MutedCaption> : null}
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
        </PlainList>
      ) : (
        <MutedCaption>Nothing in storage.</MutedCaption>
      )}

      <Cluster as="form" onSubmit={add}>
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
      </Cluster>
    </Stack>
  );
};
