'use client';

import styled from 'styled-components';

export const Done = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing('base')};
  color: ${props => props.theme.color('background', 'text')};

  ul {
    margin: 0;
    padding-left: ${props => props.theme.spacing('base')};
  }
`;
