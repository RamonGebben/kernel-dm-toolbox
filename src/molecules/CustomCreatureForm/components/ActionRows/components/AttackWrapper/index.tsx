'use client';

import styled from 'styled-components';

export const AttackWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing('s')};
  padding: ${props => props.theme.spacing('s')};
  background: ${props => props.theme.color('formBackground')};
  border-radius: ${props => props.theme.borderRadius('s')};
`;
