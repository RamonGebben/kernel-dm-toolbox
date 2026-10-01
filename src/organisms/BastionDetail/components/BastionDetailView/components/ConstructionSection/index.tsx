'use client';

import styled from 'styled-components';
import { Button } from '~/atoms/Button';
import { SectionHeading } from '~/atoms/SectionHeading';
import { ConfirmButton } from '~/molecules/ConfirmButton';
import type { BastionDetail } from '~/server/trpc/helpers/toBastionDetail';
import { formatGold } from '~/utils/applyGoldChange';

export type ConstructionSectionProps = {
  projects: BastionDetail['projects'];
  onFinish: (projectId: string) => void;
  onCancel: (projectId: string) => void;
};

/**
 * Work paid for and under way. Bastion turns will count the days down; the
 * DM can finish anything on the spot, or cancel it for a full refund.
 */
export const ConstructionSection = ({
  projects,
  onFinish,
  onCancel,
}: ConstructionSectionProps) => (
  <Section aria-label="Construction">
    <SectionHeading>Construction</SectionHeading>

    {projects.length ? (
      <List>
        {projects.map(project => (
          <Row key={project.id}>
            <div>
              <Description>{project.description}</Description>
              <Muted>
                {project.daysRemaining} day
                {project.daysRemaining === 1 ? '' : 's'} left · paid{' '}
                {formatGold(project.costGp)}
              </Muted>
            </div>
            <Actions>
              <Button
                variant="secondary"
                size="sm"
                aria-label={`Finish now: ${project.description}`}
                onClick={() => onFinish(project.id)}
              >
                Finish now
              </Button>
              <ConfirmButton
                label="Cancel"
                ariaLabel={`Cancel: ${project.description}`}
                confirmLabel={`Cancel and refund ${formatGold(project.costGp)}`}
                onConfirm={() => onCancel(project.id)}
              />
            </Actions>
          </Row>
        ))}
      </List>
    ) : (
      <Muted>Nothing under construction.</Muted>
    )}
  </Section>
);

const Section = styled.section`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.space.sm};
`;

const List = styled.ul`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.space.xs};
  margin: 0;
  padding: 0;
  list-style: none;
`;

const Row = styled.li`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: ${props => props.theme.space.sm};
  padding: ${props => props.theme.space.xs} ${props => props.theme.space.sm};
  border: 1px solid ${props => props.theme.color.border};
  border-radius: ${props => props.theme.radius.sm};
`;

const Description = styled.p`
  margin: 0;
  color: ${props => props.theme.color.textPrimary};
`;

const Muted = styled.p`
  margin: 0;
  font-size: ${props => props.theme.fontSize.sm};
  color: ${props => props.theme.color.textMuted};
`;

const Actions = styled.div`
  display: flex;
  gap: ${props => props.theme.space.xs};
`;
