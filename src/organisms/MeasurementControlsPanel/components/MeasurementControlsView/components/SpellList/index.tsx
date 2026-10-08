'use client';

import styled from 'styled-components';

export const SpellList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing('xs')};
  max-height: 10rem;
  overflow-y: auto;
`;
