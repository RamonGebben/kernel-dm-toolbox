'use client';

import styled from 'styled-components';
import { Button } from '~/atoms/Button';

export const MenuTrigger = styled(Button)`
  padding: ${props => props.theme.spacing('xs')};
`;
