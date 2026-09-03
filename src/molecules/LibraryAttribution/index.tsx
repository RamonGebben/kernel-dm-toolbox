'use client';

import styled from 'styled-components';

export type LibraryAttributionProps = {
  title: string;
  publisher: string;
  license: string;
  licenseUrl: string;
  sourceUrl: string;
};

/**
 * SRD 5.2 is CC-BY-4.0, so the credit is a licence obligation rather than a
 * nicety — it belongs on screen, not in a comment (DECISIONS #11).
 */
export const LibraryAttribution = ({
  title,
  publisher,
  license,
  licenseUrl,
  sourceUrl,
}: LibraryAttributionProps) => (
  <Text>
    Creature data from <Link href={sourceUrl}>{title}</Link> by {publisher},
    licensed under <Link href={licenseUrl}>{license}</Link>.
  </Text>
);

const Text = styled.p`
  margin: 0;
`;

const Link = styled.a.attrs({ target: '_blank', rel: 'noreferrer' })`
  color: ${props => props.theme.color.accent};
`;
