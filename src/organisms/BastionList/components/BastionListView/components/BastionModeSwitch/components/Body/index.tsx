'use client';

import styled from 'styled-components';

export const Body = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing('s')};
  color: ${props => props.theme.color('background', 'text')};

  p {
    margin: 0;
  }
`;
