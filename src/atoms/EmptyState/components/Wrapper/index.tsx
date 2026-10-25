'use client';

import styled from 'styled-components';

export const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${props => props.theme.spacing('s')};
  padding: ${props => props.theme.spacing('l')}
    ${props => props.theme.spacing('base')};
  text-align: center;
`;
