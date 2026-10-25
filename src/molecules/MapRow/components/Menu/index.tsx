'use client';

import styled from 'styled-components';

/** Positioned off-screen until `useFloatingPosition` measures the trigger,
 * so there is nothing to flash before its first real `top`/`left` commits. */
export const Menu = styled.div`
  position: fixed;
  top: -9999px;
  left: -9999px;
  z-index: ${props => props.theme.zIndex('dropdown')};
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing('xs')};
  min-width: 12rem;
  padding: ${props => props.theme.spacing('s')};
  background: ${props => props.theme.color('formBackground')};
  border: ${props => props.theme.borderWidth('s')} solid
    ${props => props.theme.color('formBackground', 'emphasis')};
  border-radius: ${props => props.theme.borderRadius('s')};
  box-shadow: ${props => props.theme.boxShadow('card')};
`;
