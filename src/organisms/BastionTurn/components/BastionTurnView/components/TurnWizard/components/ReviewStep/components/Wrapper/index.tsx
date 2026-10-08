'use client';

import styled from 'styled-components';

export const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing('s')};
  color: ${props => props.theme.color('background', 'text')};
`;
