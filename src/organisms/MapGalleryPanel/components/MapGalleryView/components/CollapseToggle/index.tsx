'use client';

import styled from 'styled-components';
import { SectionTitle } from '~/organisms/MapGalleryPanel/components/MapGalleryView/components/SectionTitle';

export const CollapseToggle = styled.button`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing('xs')};
  min-width: 0;
  padding: 0;
  background: transparent;
  border: none;
  color: inherit;
  cursor: pointer;

  &:hover ${SectionTitle} {
    color: ${props => props.theme.color('background', 'text')};
  }
`;
