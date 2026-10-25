'use client';

import styled from 'styled-components';

/**
 * No fixed/percentage height and no scrolling anywhere in this component —
 * this is projected onto a TV with no controls, so every combatant must
 * stay visible without anyone touching it. The overlay box that wraps this
 * (\`PlayerScreenView\`) sizes itself to this content instead of the other
 * way around.
 */
export const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing('s')};
  width: 100%;
  padding: ${props => props.theme.spacing('s')};
`;
