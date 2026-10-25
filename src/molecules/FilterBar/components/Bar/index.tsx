'use client';

import styled from 'styled-components';

export const Bar = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${props => props.theme.spacing('xs')};
`;
