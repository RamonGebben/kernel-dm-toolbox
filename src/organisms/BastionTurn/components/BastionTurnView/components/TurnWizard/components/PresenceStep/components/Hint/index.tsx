'use client';

import styled from 'styled-components';

export const Hint = styled.span`
  padding-left: ${props => props.theme.spacing('m')};
  color: ${props => props.theme.color('formBackground', 'text')};
`;
