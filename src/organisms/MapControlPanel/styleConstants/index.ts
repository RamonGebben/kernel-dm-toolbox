import { css } from 'styled-components';

export const OVERLAY_SURFACE = css`
  background: ${props =>
    `color-mix(in srgb, ${props.theme.color('background', 'emphasis')} 90%, transparent)`};
  backdrop-filter: blur(10px);
  border: ${props => props.theme.borderWidth('s')} solid
    ${props => props.theme.color('formBackground', 'emphasis')};
  box-shadow: ${props => props.theme.boxShadow('card')};
`;

export const RAIL_WIDTH = '3.5rem';
