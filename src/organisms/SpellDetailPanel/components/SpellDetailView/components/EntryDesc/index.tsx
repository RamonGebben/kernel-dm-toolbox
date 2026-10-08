'use client';

import styled from 'styled-components';

export const EntryDesc = styled.div`
  margin: 0 0 ${props => props.theme.spacing('xs')};
  white-space: pre-line;
  color: ${props => props.theme.color('formBackground', 'text')};
`;
