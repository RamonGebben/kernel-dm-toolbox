'use client';

import styled from 'styled-components';

export const PresetRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${props => props.theme.spacing('xs')};
`;
