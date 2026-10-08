'use client';

import styled from 'styled-components';

export const Fields = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${props => props.theme.spacing('s')};
  font-size: ${props => props.theme.fontSize('s')};
  color: ${props => props.theme.color('formBackground', 'text')};

  label {
    display: flex;
    align-items: center;
    gap: ${props => props.theme.spacing('xs')};
  }
`;
