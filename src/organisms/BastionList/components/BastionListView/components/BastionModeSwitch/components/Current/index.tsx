'use client';

import styled from 'styled-components';

export const Current = styled.div`
  display: flex;
  flex-direction: column;
  color: ${props => props.theme.color('background', 'text')};
`;
