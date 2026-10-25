'use client';

import styled from 'styled-components';
import { MutedNote } from '~/atoms/MutedNote';

export const Message = styled(MutedNote)`
  font-size: ${props => props.theme.fontSize('base')};
`;
