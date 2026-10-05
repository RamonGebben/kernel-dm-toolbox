'use client';

import styled from 'styled-components';
import { Button } from '~/atoms/Button';

export type AddableListItemProps = {
  name: string;
  subtitle: string;
  onAdd: () => void;
};

/**
 * One row of a search-and-click picker list: a name, a subtitle, and an
 * "Add" button — the shape `CreatureLibraryView`'s creature rows already
 * use, minus the select-to-view-statblock behavior that's specific to the
 * tracker's own library panel. Shared by the Scenario builder's party and
 * monster pickers so both read the same way.
 */
export const AddableListItem = ({
  name,
  subtitle,
  onAdd,
}: AddableListItemProps) => (
  <Row>
    <Details>
      <Name>{name}</Name>
      <Subtitle>{subtitle}</Subtitle>
    </Details>
    <Button
      variant="ghost"
      size="sm"
      onClick={onAdd}
      aria-label={`Add ${name}`}
    >
      +
    </Button>
  </Row>
);

const Row = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${props => props.theme.space.sm};
  width: 100%;
  padding: ${props => props.theme.space.sm} ${props => props.theme.space.md};
  background: ${props => props.theme.color.canvas};
  border: 1px solid ${props => props.theme.color.border};
  border-radius: ${props => props.theme.radius.sm};
  color: ${props => props.theme.color.textPrimary};

  &:hover {
    border-color: ${props => props.theme.color.accent};
  }
`;

const Details = styled.div`
  min-width: 0;
`;

const Name = styled.p`
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const Subtitle = styled.p`
  margin: 0;
  font-size: ${props => props.theme.fontSize.sm};
  color: ${props => props.theme.color.textMuted};
`;
