'use client';

import styled from 'styled-components';

export const StepCard = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing('xs')};
  padding: ${props => props.theme.spacing('s')};
  border: ${props => props.theme.borderWidth('s')} solid
    ${props => props.theme.color('formBackground', 'emphasis')};
  border-radius: ${props => props.theme.borderRadius('s')};
`;
