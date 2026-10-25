'use client';

import styled from 'styled-components';

export const ConditionBadge = styled.span`
  flex-shrink: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  padding: 0 ${props => props.theme.spacing('xs')};
  border: ${props => props.theme.borderWidth('s')} solid
    ${props => props.theme.color('formBackground', 'emphasis')};
  border-radius: ${props => props.theme.borderRadius('s')};
  color: ${props => props.theme.color('formBackground', 'text')};
  font-size: ${props => props.theme.fontSize('s')};
`;
