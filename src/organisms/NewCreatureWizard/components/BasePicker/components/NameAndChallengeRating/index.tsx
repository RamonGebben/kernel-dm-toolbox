'use client';

import styled from 'styled-components';

export const NameAndChallengeRating = styled.span`
  display: flex;
  align-items: baseline;
  gap: ${props => props.theme.spacing('s')};
  min-width: 0;
`;
