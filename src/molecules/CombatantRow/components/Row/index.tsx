'use client';

import styled from 'styled-components';

export const Row = styled.div<{
  $isSelected: boolean;
  $isActive: boolean;
  $isDown: boolean;
}>`
  display: grid;
  grid-template-columns: 3rem minmax(0, 1fr) 5.5rem 3rem 2.5rem;
  align-items: center;
  gap: ${props => props.theme.spacing('s')};
  width: 100%;
  padding: ${props => props.theme.spacing('s')}
    ${props => props.theme.spacing('base')};
  background: ${props =>
    props.$isSelected
      ? props.theme.color('formBackground')
      : props.theme.color('background')};
  border: ${props => props.theme.borderWidth('s')} solid
    ${props =>
      props.$isSelected
        ? props.theme.color('tertiary')
        : props.theme.color('formBackground', 'emphasis')};
  /* Whose turn it is has to read from across the table, not on inspection. */
  border-left: 3px solid
    ${props => (props.$isActive ? props.theme.color('primary') : 'transparent')};
  border-radius: ${props => props.theme.borderRadius('s')};
  /* A downed/killed combatant recedes to the same muted tone the rest of the
   * row's secondary text already uses — never plain CSS opacity, which would
   * blend every child's colour toward the background and risk retuning
   * contrast that's already tightly budgeted (see the \`danger\` comment in
   * theme/tokens.ts, tuned for exactly this "selected combatant on 0 HP"
   * case) and would carry no signal at all for a screen reader. */
  color: ${props =>
    props.$isDown
      ? props.theme.color('formBackground', 'text')
      : props.theme.color('background', 'text')};
  font-size: ${props => props.theme.fontSize('base')};

  &:hover {
    border-color: ${props => props.theme.color('primary')};
    /* Hover must not paint a turn marker on a row whose turn it is not. */
    border-left-color: ${props =>
      props.$isActive ? props.theme.color('primary') : 'transparent'};
  }
`;
