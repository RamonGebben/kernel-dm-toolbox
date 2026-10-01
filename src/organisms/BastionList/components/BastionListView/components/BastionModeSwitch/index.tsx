'use client';

import { useState } from 'react';
import styled from 'styled-components';
import { Button } from '~/atoms/Button';
import { FieldRow, Select } from '~/atoms/FormControls';
import { Modal } from '~/atoms/Modal';
import { TextInput } from '~/atoms/TextInput';
import type { BastionMode } from '~/server/db/schema';

export type ModeChange =
  | { mode: 'party'; name: string }
  | { mode: 'per-character'; keeperCharacterId?: string };

export type BastionModeSwitchProps = {
  mode: BastionMode;
  /** How many bastions exist — merging or splitting only matters if any do. */
  bastionCount: number;
  /** Suggested name for the merged party bastion. */
  suggestedName: string;
  members: readonly { id: string; name: string }[];
  isSwitching: boolean;
  error: string | null;
  /** Resolves once switched, so the dialog knows to close. */
  onSwitch: (change: ModeChange) => Promise<unknown>;
};

const modeLabels: Record<BastionMode, string> = {
  'per-character': 'One per character',
  party: 'One for the whole party',
};

/**
 * The campaign's bastion mode, and switching it. Switching never loses
 * anything: per-character bastions merge into the party's, keeping who holds
 * what; the party's splits back out by holder (DECISIONS #34).
 */
export const BastionModeSwitch = ({
  mode,
  bastionCount,
  suggestedName,
  members,
  isSwitching,
  error,
  onSwitch,
}: BastionModeSwitchProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState(suggestedName);
  const [keeperId, setKeeperId] = useState(members[0]?.id ?? '');
  const target: BastionMode = mode === 'party' ? 'per-character' : 'party';

  const confirm = async () => {
    try {
      await onSwitch(
        target === 'party'
          ? { mode: 'party', name: name.trim() || suggestedName }
          : { mode: 'per-character', keeperCharacterId: keeperId || undefined },
      );
      setIsOpen(false);
    } catch {
      // Shown below via `error`; keep the dialog open.
    }
  };

  return (
    <Wrapper>
      <Current>
        <Label>Bastions</Label>
        <span>{modeLabels[mode]}</span>
      </Current>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => {
          setName(suggestedName);
          setIsOpen(true);
        }}
      >
        Switch to {modeLabels[target].toLowerCase()}
      </Button>

      <Modal
        title={`Switch to ${modeLabels[target].toLowerCase()}`}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      >
        <Body>
          {target === 'party' ? (
            <>
              <p>
                {bastionCount
                  ? `The ${bastionCount === 1 ? 'bastion merges into' : `${bastionCount} bastions merge into`} one the whole party shares.`
                  : 'The party will share one bastion.'}{' '}
                Every member keeps the facilities they hold and their own
                allowance, and gives orders to their own facilities. Defenders
                pool together.
              </p>
              {bastionCount ? (
                <FieldRow>
                  <label htmlFor="mode-switch-name">
                    Name of the party bastion
                  </label>
                  <TextInput
                    id="mode-switch-name"
                    value={name}
                    onChange={event => setName(event.target.value)}
                  />
                </FieldRow>
              ) : null}
            </>
          ) : (
            <>
              <p>
                {bastionCount
                  ? 'The party bastion splits into one bastion per member who holds a facility or brought rooms, each taking what is theirs.'
                  : 'Each character will have their own bastion.'}
              </p>
              {bastionCount && members.length ? (
                <FieldRow>
                  <label htmlFor="mode-switch-keeper">
                    Who keeps the defenders, walls and storage?
                  </label>
                  <Select
                    id="mode-switch-keeper"
                    value={keeperId}
                    onChange={event => setKeeperId(event.target.value)}
                  >
                    {members.map(member => (
                      <option key={member.id} value={member.id}>
                        {member.name}
                      </option>
                    ))}
                  </Select>
                </FieldRow>
              ) : null}
            </>
          )}
          {error ? <ErrorText role="alert">{error}</ErrorText> : null}
          <Actions>
            <Button
              size="sm"
              disabled={isSwitching}
              onClick={() => void confirm()}
            >
              {isSwitching ? 'Switching…' : 'Switch'}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
          </Actions>
        </Body>
      </Modal>
    </Wrapper>
  );
};

const Wrapper = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: ${props => props.theme.space.xs};
`;

const Current = styled.div`
  display: flex;
  flex-direction: column;
  color: ${props => props.theme.color.textPrimary};
`;

const Label = styled.span`
  font-size: ${props => props.theme.fontSize.sm};
  color: ${props => props.theme.color.textMuted};
`;

const Body = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.space.sm};
  color: ${props => props.theme.color.textPrimary};

  p {
    margin: 0;
  }
`;

const ErrorText = styled.p`
  font-size: ${props => props.theme.fontSize.sm};
  color: ${props => props.theme.color.danger};
`;

const Actions = styled.div`
  display: flex;
  gap: ${props => props.theme.space.sm};
`;
