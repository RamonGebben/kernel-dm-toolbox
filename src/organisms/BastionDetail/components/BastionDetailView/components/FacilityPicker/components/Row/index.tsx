'use client';

import styled from 'styled-components';

export const Row = styled.li`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${props => props.theme.spacing('s')};
  padding: ${props => props.theme.spacing('xs')}
    ${props => props.theme.spacing('s')};
  border: ${props => props.theme.borderWidth('s')} solid
    ${props => props.theme.color('formBackground', 'emphasis')};
  border-radius: ${props => props.theme.borderRadius('s')};
`;
