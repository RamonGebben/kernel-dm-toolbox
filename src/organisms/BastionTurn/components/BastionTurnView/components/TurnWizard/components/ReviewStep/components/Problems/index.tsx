'use client';

import styled from 'styled-components';

export const Problems = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing('s')};
  padding: ${props => props.theme.spacing('base')};
  border: ${props => props.theme.borderWidth('s')} solid
    ${props => props.theme.color('error')};
  border-radius: ${props => props.theme.borderRadius('s')};
  color: ${props => props.theme.color('background', 'text')};

  ul {
    margin: 0;
    padding-left: ${props => props.theme.spacing('base')};
  }
`;
