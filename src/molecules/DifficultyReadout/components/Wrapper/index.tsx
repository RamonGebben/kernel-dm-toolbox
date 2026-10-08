'use client';

import styled from 'styled-components';

export const Wrapper = styled.div`
  display: flex;
  align-items: baseline;
  gap: ${props => props.theme.spacing('s')};
  font-size: ${props => props.theme.fontSize('s')};
`;
