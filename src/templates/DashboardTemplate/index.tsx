'use client';

import type { ReactNode } from 'react';
import styled from 'styled-components';
import { navigationItems } from '~/content/navigation';

type DashboardTemplateProps = {
  campaignName: string;
  /**
   * Resolved server-side from a feature gate and passed down as a plain
   * boolean. This component must never read the gate itself.
   */
  isInitiativeTrackerEnabled: boolean;
  /** The connected status panel, injected by the page. */
  statusSlot: ReactNode;
};

/**
 * A template is the full body of a page: props in, JSX out, no data fetching
 * and no gate reading. The page above it does the fetching and the gate
 * evaluation, then hands the results down.
 */
export const DashboardTemplate = ({
  campaignName,
  isInitiativeTrackerEnabled,
  statusSlot,
}: DashboardTemplateProps) => {
  const visibleItems = navigationItems.filter(
    item => item.gate !== 'initiativeTracker' || isInitiativeTrackerEnabled,
  );

  return (
    <Page>
      <Header>
        <Eyebrow>Campaign</Eyebrow>
        <CampaignName>{campaignName}</CampaignName>
      </Header>

      <Main>
        {statusSlot}

        <Sections>
          {visibleItems.map(item => (
            <SectionCard key={item.id}>
              <SectionTitle>{item.label}</SectionTitle>
              <SectionDescription>{item.description}</SectionDescription>
            </SectionCard>
          ))}
        </Sections>
      </Main>
    </Page>
  );
};

const Page = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.space.xl};
  max-width: 60rem;
  margin: 0 auto;
  padding: ${props => props.theme.space.xl} ${props => props.theme.space.md};
`;

const Header = styled.header`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.space.xs};
`;

const Eyebrow = styled.span`
  font-size: ${props => props.theme.fontSize.sm};
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: ${props => props.theme.color.textMuted};
`;

const CampaignName = styled.h1`
  margin: 0;
  font-size: ${props => props.theme.fontSize.xl};
  color: ${props => props.theme.color.textPrimary};
`;

const Main = styled.main`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.space.lg};
`;

const Sections = styled.div`
  display: grid;
  gap: ${props => props.theme.space.md};

  ${props => props.theme.media.md} {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
`;

const SectionCard = styled.article`
  padding: ${props => props.theme.space.lg};
  background: ${props => props.theme.color.surface};
  border: 1px solid ${props => props.theme.color.border};
  border-radius: ${props => props.theme.radius.md};
`;

const SectionTitle = styled.h3`
  margin: 0 0 ${props => props.theme.space.xs};
  font-size: ${props => props.theme.fontSize.lg};
  color: ${props => props.theme.color.textPrimary};
`;

const SectionDescription = styled.p`
  margin: 0;
  font-size: ${props => props.theme.fontSize.sm};
  color: ${props => props.theme.color.textMuted};
`;
