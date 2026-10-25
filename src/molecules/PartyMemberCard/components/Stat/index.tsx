'use client';

import styled from 'styled-components';

export const Stat = styled.div`
  display: flex;
  gap: ${props => props.theme.spacing('xs')};
  font-size: ${props => props.theme.fontSize('s')};

  dt {
    color: ${props => props.theme.color('formBackground', 'text')};
  }

  dd {
    margin: 0;
    font-family: ${props => props.theme.fontFamily('mono')};
    color: ${props => props.theme.color('background', 'text')};
  }
`;
