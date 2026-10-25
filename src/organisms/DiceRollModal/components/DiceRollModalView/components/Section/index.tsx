'use client';

import styled from 'styled-components';

export const Section = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing('s')};

  & + & {
    margin-top: ${props => props.theme.spacing('base')};
    padding-top: ${props => props.theme.spacing('base')};
    border-top: ${props => props.theme.borderWidth('s')} solid
      ${props => props.theme.color('formBackground', 'emphasis')};
  }
`;
