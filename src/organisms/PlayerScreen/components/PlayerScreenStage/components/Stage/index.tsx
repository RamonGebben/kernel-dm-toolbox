'use client';

import styled from 'styled-components';

export const Stage = styled.div`
  position: relative;
  width: 100dvw;
  height: 100dvh;
  overflow: hidden;
  background: ${props => props.theme.color('background')};
`;
