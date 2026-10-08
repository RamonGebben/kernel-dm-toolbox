'use client';

import { useState } from 'react';
import { Button } from '~/atoms/Button';
import { FieldRow } from '~/atoms/FieldRow';
import { Select } from '~/atoms/Select';
import { Modal } from '~/atoms/Modal';
import { TextInput } from '~/atoms/TextInput';
import type { BastionMode } from '~/server/db/schema';
import { Wrapper } from '~/organisms/BastionList/components/BastionListView/components/BastionModeSwitch/components/Wrapper';
import { Current } from '~/organisms/BastionList/components/BastionListView/components/BastionModeSwitch/components/Current';
import { MutedCaption } from '~/atoms/MutedCaption';
import { Body } from '~/organisms/BastionList/components/BastionListView/components/BastionModeSwitch/components/Body';
import { ErrorText } from '~/organisms/BastionList/components/BastionListView/components/BastionModeSwitch/components/ErrorText';
import { Cluster } from '~/atoms/Cluster';

export type ModeChange =
  | { mode: 'party'; name: string }
  | { mode: 'per-character'; keeperCharacterId?: string };

export interface BastionModeSwitchProps {
  mode: BastionMode;
  /** How many bastions exist — merging or splitting only matters if any do. */
  bastionCount: number;
  /** Suggested name for the merged party bastion. */
  suggestedName: string;
  members: ReadonlyArray<{ id: string; name: string }>;
  isSwitching: boolean;
  error: string | null;
  /** Resolves once switched, so the dialog knows to close. */
  onSwitch: (change: ModeChange) => Promise<unknown>;
}

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
  const [pickedKeeperId, setKeeperId] = useState('');
  // Until the DM picks, the keeper is whoever the list puts first: the same
  // one the select shows. The members can load, or reorder, after this mounts.
  const keeperId = members.some(({ id }) => id === pickedKeeperId)
    ? pickedKeeperId
    : (members[0]?.id ?? '');
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
        <MutedCaption>Bastions</MutedCaption>
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
          <Cluster>
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
          </Cluster>
        </Body>
      </Modal>
    </Wrapper>
  );
};
