'use client';

import { Button } from '~/atoms/Button';
import { SectionHeading } from '~/atoms/SectionHeading';
import { ConfirmButton } from '~/molecules/ConfirmButton';
import type { BastionDetail } from '~/server/trpc/helpers/toBastionDetail';
import { formatGold } from '~/utils/applyGoldChange';
import { Stack } from '~/atoms/Stack';
import { PlainList } from '~/atoms/PlainList';
import { Row } from '~/organisms/BastionDetail/components/BastionDetailView/components/ConstructionSection/components/Row';
import { Paragraph } from '~/atoms/Paragraph';
import { MutedNote } from '~/atoms/MutedNote';
import { Cluster } from '~/atoms/Cluster';

export interface ConstructionSectionProps {
  projects: BastionDetail['projects'];
  onFinish: (projectId: string) => void;
  onCancel: (projectId: string) => void;
}

/**
 * Work paid for and under way. Bastion turns will count the days down; the
 * DM can finish anything on the spot, or cancel it for a full refund.
 */
export const ConstructionSection = ({
  projects,
  onFinish,
  onCancel,
}: ConstructionSectionProps) => (
  <Stack as="section" $gap="s" aria-label="Construction">
    <SectionHeading>Construction</SectionHeading>

    {projects.length ? (
      <PlainList>
        {projects.map(project => (
          <Row key={project.id}>
            <div>
              <Paragraph>{project.description}</Paragraph>
              <MutedNote>
                {project.daysRemaining} day
                {project.daysRemaining === 1 ? '' : 's'} left · paid{' '}
                {formatGold(project.costGp)}
              </MutedNote>
            </div>
            <Cluster $gap="xs">
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
            </Cluster>
          </Row>
        ))}
      </PlainList>
    ) : (
      <MutedNote>Nothing under construction.</MutedNote>
    )}
  </Stack>
);
