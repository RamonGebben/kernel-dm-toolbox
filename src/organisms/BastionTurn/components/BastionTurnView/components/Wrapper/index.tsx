'use client';

import styled from 'styled-components';

export const Wrapper = styled.section`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing('xs')};
  padding: ${props => props.theme.spacing('s')}
    ${props => props.theme.spacing('base')};
  border: ${props => props.theme.borderWidth('s')} solid
    ${props => props.theme.color('primary')};
  border-radius: ${props => props.theme.borderRadius('s')};
  margin-bottom: ${props => props.theme.spacing('base')};
`;
