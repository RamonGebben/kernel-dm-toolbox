'use client';

import styled from 'styled-components';
import { Select } from '~/atoms/Select';

export const ClassSelect = styled(Select)`
  padding: ${props => props.theme.spacing('s')};
  font-size: ${props => props.theme.fontSize('base')};
`;
