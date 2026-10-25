'use client';

import styled from 'styled-components';

export const Prompt = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${props => props.theme.spacing('s')};
  padding: ${props => props.theme.spacing('s')}
    ${props => props.theme.spacing('base')};
  border: ${props => props.theme.borderWidth('s')} solid
    ${props => props.theme.color('primary')};
  border-radius: ${props => props.theme.borderRadius('s')};
`;
