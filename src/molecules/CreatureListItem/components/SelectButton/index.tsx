'use client';

import styled from 'styled-components';

/**
 * Selecting is its own control rather than the row itself: a button wrapping
 * the whole row would nest the add button inside it, which is invalid and
 * unreachable by keyboard.
 */
export const SelectButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${props => props.theme.spacing('s')};
  flex: 1;
  min-width: 0;
  padding: 0;
  background: none;
  border: none;
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
`;
