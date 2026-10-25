'use client';

import styled from 'styled-components';

export const Choice = styled.div`
  display: flex;
  flex-direction: column;
  font-size: ${props => props.theme.fontSize('s')};
  color: ${props => props.theme.color('background', 'text')};

  label {
    display: flex;
    align-items: center;
    gap: ${props => props.theme.spacing('xs')};
  }
`;
