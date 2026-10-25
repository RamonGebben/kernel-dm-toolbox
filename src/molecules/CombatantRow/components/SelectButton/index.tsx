'use client';

import styled from 'styled-components';

export const SelectButton = styled.button`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing('s')};
  min-width: 0;
  padding: 0;
  background: none;
  border: none;
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;
