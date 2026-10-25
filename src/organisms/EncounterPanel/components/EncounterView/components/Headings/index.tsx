'use client';

import styled from 'styled-components';

export const Headings = styled.div`
  display: grid;
  grid-template-columns: 3rem minmax(0, 1fr) 5.5rem 3rem 2.5rem;
  gap: ${props => props.theme.spacing('s')};
  padding: 0 ${props => props.theme.spacing('base')}
    ${props => props.theme.spacing('xs')};
  font-size: ${props => props.theme.fontSize('s')};
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: ${props => props.theme.color('formBackground', 'text')};
`;
