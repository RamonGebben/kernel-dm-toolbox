'use client';

import styled from 'styled-components';

export const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing('xs')};
  min-width: 0;
`;
