'use client';

import styled from 'styled-components';

export const Event = styled.section`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing('s')};
  padding: ${props => props.theme.spacing('base')};
  border: ${props => props.theme.borderWidth('s')} solid
    ${props => props.theme.color('formBackground', 'emphasis')};
  border-radius: ${props => props.theme.borderRadius('s')};
`;
