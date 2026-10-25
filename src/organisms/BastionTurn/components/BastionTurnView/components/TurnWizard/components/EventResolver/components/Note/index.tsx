'use client';

import styled from 'styled-components';
import { Paragraph } from '~/atoms/Paragraph';

export const Note = styled(Paragraph)`
  color: ${props => props.theme.color('tertiary')};
`;
