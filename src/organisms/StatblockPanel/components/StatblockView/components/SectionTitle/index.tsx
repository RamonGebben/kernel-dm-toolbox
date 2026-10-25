'use client';

import styled from 'styled-components';

export const SectionTitle = styled.h4`
  margin: ${props => props.theme.spacing('m')} 0
    ${props => props.theme.spacing('s')};
  padding-bottom: ${props => props.theme.spacing('xs')};
  border-bottom: ${props => props.theme.borderWidth('s')} solid
    ${props => props.theme.color('secondary')};
  font-size: ${props => props.theme.fontSize('m')};
  color: ${props => props.theme.color('primary')};
`;
