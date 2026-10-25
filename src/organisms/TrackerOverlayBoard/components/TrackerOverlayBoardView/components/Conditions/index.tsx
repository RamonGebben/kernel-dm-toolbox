'use client';

import styled from 'styled-components';

/** Never wraps to a second line and never grows past its share of the row —
 * `ConditionBadge` truncates instead, so an active combatant with several
 * conditions can't push the row's height around. */
export const Conditions = styled.div`
  display: flex;
  flex-wrap: nowrap;
  gap: ${props => props.theme.spacing('xs')};
  min-width: 0;
  max-width: 45%;
  overflow: hidden;
`;
