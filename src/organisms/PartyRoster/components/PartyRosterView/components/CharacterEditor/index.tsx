'use client';

import { useState } from 'react';
import styled from 'styled-components';
import { Modal } from '~/atoms/Modal';
import { Button } from '~/atoms/Button';
import {
  CharacterForm,
  type CharacterFormValues,
} from '~/molecules/CharacterForm';

export type CharacterEditorProps = {
  /** Null opens a blank form for a new character. */
  editing: { id: string; name: string; values: CharacterFormValues } | null;
  isOpen: boolean;
  isSaving: boolean;
  isRemoving: boolean;
  onSubmit: (values: CharacterFormValues) => void;
  onRemove: (id: string) => void;
  onClose: () => void;
};

/**
 * The create/edit dialog. Removing lives here, behind a second click, rather
 * than on every card: it is the one action on the Party page with no undo in
 * the UI, so it is never one stray click away.
 */
export const CharacterEditor = ({
  editing,
  isOpen,
  isSaving,
  isRemoving,
  onSubmit,
  onRemove,
  onClose,
}: CharacterEditorProps) => (
  <Modal
    title={editing ? `Edit ${editing.name}` : 'New character'}
    isOpen={isOpen}
    onClose={onClose}
    size="wide"
  >
    <CharacterForm
      key={editing?.id ?? 'new'}
      initialValues={editing?.values}
      isSaving={isSaving}
      submitLabel={editing ? 'Save changes' : 'Add character'}
      onSubmit={onSubmit}
      onCancel={onClose}
    />
    {editing ? (
      <RemoveCharacter
        key={`remove-${editing.id}`}
        name={editing.name}
        isRemoving={isRemoving}
        onConfirm={() => onRemove(editing.id)}
      />
    ) : null}
  </Modal>
);

type RemoveCharacterProps = {
  name: string;
  isRemoving: boolean;
  onConfirm: () => void;
};

/** Two clicks: the first only asks. */
const RemoveCharacter = ({
  name,
  isRemoving,
  onConfirm,
}: RemoveCharacterProps) => {
  const [isConfirming, setIsConfirming] = useState(false);

  if (!isConfirming) {
    return (
      <Footer>
        <Button variant="ghost" size="sm" onClick={() => setIsConfirming(true)}>
          Remove from party…
        </Button>
      </Footer>
    );
  }

  return (
    <Footer>
      <Warning>
        Remove {name}? They leave the roster for good, and their own bastion is
        abandoned, with any construction refunded. A character already in a
        fight stays in it.
      </Warning>
      <Button
        variant="secondary"
        size="sm"
        disabled={isRemoving}
        onClick={onConfirm}
      >
        {isRemoving ? 'Removing…' : `Remove ${name}`}
      </Button>
      <Button variant="ghost" size="sm" onClick={() => setIsConfirming(false)}>
        Keep
      </Button>
    </Footer>
  );
};

const Footer = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${props => props.theme.space.sm};
  margin-top: ${props => props.theme.space.md};
  padding-top: ${props => props.theme.space.md};
  border-top: 1px solid ${props => props.theme.color.border};
`;

const Warning = styled.p`
  flex-basis: 100%;
  margin: 0;
  font-size: ${props => props.theme.fontSize.sm};
  color: ${props => props.theme.color.textMuted};
`;
