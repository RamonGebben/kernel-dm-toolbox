'use client';

import styled from 'styled-components';

/** A flex child that is allowed to shrink below its content width, so
 * long text inside it can truncate. */
export const Shrink = styled.div`
  min-width: 0;
`;
