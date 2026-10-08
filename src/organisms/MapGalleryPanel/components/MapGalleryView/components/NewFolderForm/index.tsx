'use client';

import styled from 'styled-components';

export const NewFolderForm = styled.form`
  display: flex;
  flex: 1;
  min-width: 12rem;
  gap: ${props => props.theme.spacing('xs')};
`;
