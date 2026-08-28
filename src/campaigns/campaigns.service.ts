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
                category: dto.category,
                imageUrl: dto.imageUrl,
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

    async findActive() {
        return this.prisma.campaign.findMany({
            where: { status: 'ACTIVE' },
            orderBy: { createdAt: 'desc' },
        });
    }

    async findOne(id: string) {
        const campaign = await this.prisma.campaign.findUnique({ where: { id } });
        if (!campaign) throw new NotFoundException('Campaign not found');
        return campaign;
    }

    private async logEvent(campaignId: string, eventType: string, actorId: string, payload: object) {
        return this.prisma.campaignEvent.create({
            data: { campaignId, eventType, actorId, payload },
        });
    }


    async findAllForAdmin() {
        return this.prisma.campaign.findMany({ orderBy: { createdAt: 'desc' } });
    }

    async getStats() {
        const [totalRaised, activeCausesCount, donationsCount, distinctDonors] = await Promise.all([
            this.prisma.campaign.aggregate({ _sum: { currentAmount: true } }),
            this.prisma.campaign.count({ where: { status: 'ACTIVE' } }),
            this.prisma.donation.count({ where: { status: 'CONFIRMED' } }),
            this.prisma.donation.findMany({
                where: { status: 'CONFIRMED' },
                distinct: ['donorId'],
                select: { donorId: true },
            }),
        ]);
        return {
            totalRaised: totalRaised._sum.currentAmount ?? 0,
            totalDonors: distinctDonors.length,
            activeCauses: activeCausesCount,
            donationsCount,
        };
    }

    async update(id: string, dto: Partial<{ title: string; description: string; goalAmount: number; imageUrl: string }>) {
        const campaign = await this.prisma.campaign.findUnique({ where: { id } });
        if (!campaign) throw new NotFoundException('Campaign not found');

        return this.prisma.campaign.update({
            where: { id },
            data: dto,
        });
    }

    async findMine(managerId: string) {
        return this.prisma.campaign.findMany({
            where: { managerId },
            orderBy: { createdAt: 'desc' },
        });
    }

    async getPublicStats() {
        const [totalRaisedResult, activeCauses, distinctDonors] = await Promise.all([
            this.prisma.campaign.aggregate({ _sum: { currentAmount: true } }),
            this.prisma.campaign.count({ where: { status: 'ACTIVE' } }),
            this.prisma.donation.groupBy({
                by: ['email'],
                where: { status: 'CONFIRMED' },
            }),
        ]);

        return {
            totalRaised: totalRaisedResult._sum.currentAmount ?? 0,
            activeCauses,
            totalDonors: distinctDonors.length,
        };
    }
}