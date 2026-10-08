'use client';

import styled from 'styled-components';

export const MemberRooms = styled.fieldset`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing('xs')};
  margin: 0;
  padding: 0;
  border: 0;
`;
