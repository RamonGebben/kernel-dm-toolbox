'use client';

import styled from 'styled-components';

export const Form = styled.form`
  display: grid;
  grid-template-columns: minmax(0, 1fr) 4.5rem auto;
  gap: ${props => props.theme.spacing('xs')};
`;
