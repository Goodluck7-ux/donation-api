import { CampaignStatus } from '../../generated/prisma';

const TRANSITIONS: Record<CampaignStatus, CampaignStatus[]> = {
    DRAFT: ['SUBMITTED', 'CANCELLED'],
    SUBMITTED: ['UNDER_REVIEW', 'CANCELLED'],
    UNDER_REVIEW: ['APPROVED', 'REJECTED'],
    APPROVED: ['ACTIVE', 'CANCELLED'],
    ACTIVE: ['FUNDED', 'SUSPENDED', 'EXPIRED', 'CANCELLED'],
    FUNDED: ['IN_PROGRESS', 'SUSPENDED'],
    IN_PROGRESS: ['COMPLETED', 'SUSPENDED'],
    COMPLETED: [],
    REJECTED: [],
    SUSPENDED: ['ACTIVE', 'CANCELLED'],
    CANCELLED: [],
    EXPIRED: [],
};

export function canTransition(from: CampaignStatus, to: CampaignStatus): boolean {
    return TRANSITIONS[from].includes(to);
}