'use client';

import styled from 'styled-components';

/** A plain row — the swatch/label are a real \`<button>\` (\`ShapeSelectButton\`)
 * and "Remove" is a sibling \`Button\`. Nesting the whole row as one button
 * containing another button is both invalid HTML and a "nested interactive
 * controls" a11y violation, so the two affordances live side by side
 * instead. Selection is shown with the border only, never a background
 * fill — \`accentMuted\` behind the row's muted text fails colour-contrast. */
export const ShapeRow = styled.div<{ $isSelected: boolean }>`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing('s')};
  width: 100%;
  padding: ${props => props.theme.spacing('xs')}
    ${props => props.theme.spacing('s')};
  border: ${props => props.theme.borderWidth('s')} solid
    ${props =>
      props.$isSelected
        ? props.theme.color('primary')
        : props.theme.color('formBackground', 'emphasis')};
  border-radius: ${props => props.theme.borderRadius('s')};
  background: ${props => props.theme.color('background')};
`;
