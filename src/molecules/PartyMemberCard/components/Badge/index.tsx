'use client';

import styled from 'styled-components';

export const Badge = styled.span`
  padding: 0 ${props => props.theme.spacing('xs')};
  border: ${props => props.theme.borderWidth('s')} solid
    ${props => props.theme.color('formBackground', 'emphasis')};
  border-radius: ${props => props.theme.borderRadius('s')};
  font-size: ${props => props.theme.fontSize('s')};
  font-weight: ${props => props.theme.fontWeight('regular')};
  color: ${props => props.theme.color('formBackground', 'text')};
`;
