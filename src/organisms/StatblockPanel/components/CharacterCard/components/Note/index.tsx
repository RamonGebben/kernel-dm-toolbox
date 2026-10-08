'use client';

import styled from 'styled-components';

export const Note = styled.p`
  margin-top: ${props => props.theme.spacing('m')};
  font-size: ${props => props.theme.fontSize('s')};
  color: ${props => props.theme.color('formBackground', 'text')};
`;
