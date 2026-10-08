'use client';

import styled from 'styled-components';

/** The padded area beside the navigation rail that a template's panels sit in. */
export const Workspace = styled.div`
  display: flex;
  flex: 1;
  min-width: 0;
  min-height: 0;
  padding: ${props => props.theme.spacing('base')};
`;
