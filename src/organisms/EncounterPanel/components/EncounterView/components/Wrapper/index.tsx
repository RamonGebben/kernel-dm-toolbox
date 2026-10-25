'use client';

import styled from 'styled-components';

export const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing('base')};
  height: calc(100% - ${props => props.theme.spacing('m')});
  min-height: 0;
`;
