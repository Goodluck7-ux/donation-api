import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { canTransition } from './campaign-state-machine';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { CampaignStatus } from '../../generated/prisma';

@Injectable()
export class CampaignsService {
    constructor(private readonly prisma: PrismaService) { }

    async create(managerId: string, dto: CreateCampaignDto) {
        const campaign = await this.prisma.campaign.create({
            data: {
                title: dto.title,
                description: dto.description,
                goalAmount: dto.goalAmount,
                organizationId: dto.organizationId,
                managerId,
                status: 'DRAFT',
            },
        });

        await this.logEvent(campaign.id, 'CAMPAIGN_CREATED', managerId, {
            title: campaign.title,
        });

        return campaign;
    }

    async transition(campaignId: string, actorId: string, targetStatus: CampaignStatus) {
        const campaign = await this.prisma.campaign.findUnique({ where: { id: campaignId } });
        if (!campaign) {
            throw new NotFoundException('Campaign not found');
        }

        if (!canTransition(campaign.status, targetStatus)) {
            throw new BadRequestException(
                `Cannot move campaign from ${campaign.status} to ${targetStatus}`,
            );
        }

        const updated = await this.prisma.campaign.update({
            where: { id: campaignId },
            data: { status: targetStatus },
        });

        await this.logEvent(campaignId, 'CAMPAIGN_STATUS_CHANGED', actorId, {
            from: campaign.status,
            to: targetStatus,
        });

        return updated;
    }

    private async logEvent(campaignId: string, eventType: string, actorId: string, payload: object) {
        return this.prisma.campaignEvent.create({
            data: { campaignId, eventType, actorId, payload },
        });
    }
}