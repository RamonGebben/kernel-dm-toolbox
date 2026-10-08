'use client';

import styled from 'styled-components';

export const Stepper = styled.ol`
  display: flex;
  flex-wrap: wrap;
  gap: ${props => props.theme.spacing('xs')};
  margin: 0;
  padding: 0;
  list-style: none;
`;
