'use client';

import styled from 'styled-components';

export const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing('m')};
  max-width: 60rem;
  margin: 0 auto;
  padding: ${props => props.theme.spacing('l')}
    ${props => props.theme.spacing('base')};
`;
