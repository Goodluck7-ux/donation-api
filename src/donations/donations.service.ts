import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentsService } from '../payments/payments.service';
import { CreateDonationDto } from './dto/create-donation.dto';
import * as crypto from 'crypto';

@Injectable()
export class DonationsService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly paymentsService: PaymentsService,
    ) { }

    async create(donorId: string | null, dto: CreateDonationDto) {
        let email: string;
        let donorName: string | undefined;

        if (donorId) {
            const donor = await this.prisma.user.findUnique({ where: { id: donorId } });
            if (!donor) throw new NotFoundException('Donor not found');
            email = donor.email;
            donorName = donor.name ?? undefined;
        } else {
            if (!dto.email) {
                throw new BadRequestException('Email is required to donate as a guest');
            }
            email = dto.email;
            donorName = dto.donorName;
        }

        const donation = await this.prisma.donation.create({
            data: {
                donorId: donorId ?? undefined,
                donorName,
                email,
                anonymous: dto.anonymous ?? false,
                campaignId: dto.campaignId,
                amount: dto.amount,
                status: 'PENDING',
            },
        });

        const { authorizationUrl, reference } = await this.paymentsService.initiate(email, dto.amount, donation.id);

        await this.prisma.payment.create({
            data: {
                donationId: donation.id,
                providerReference: reference,
                provider: 'paystack',
                status: 'INITIATED',
            },
        });

        return { donationId: donation.id, authorizationUrl };
    }

    async findMyDonations(donorId: string) {
        return this.prisma.donation.findMany({
            where: { donorId },
            orderBy: { createdAt: 'desc' },
            include: { campaign: { select: { id: true, title: true, status: true } } },
        });
    }

    async findUnclaimed(userEmail: string) {
        const donations = await this.prisma.donation.findMany({
            where: { email: userEmail, donorId: null, status: 'CONFIRMED' },
        });
        return {
            count: donations.length,
            total: donations.reduce((sum, d) => sum + Number(d.amount), 0),
        };
    }

    async requestClaim(userId: string, userEmail: string) {
        const token = crypto.randomBytes(24).toString('hex');
        await this.prisma.verification.create({
            data: {
                identifier: `claim:${token}`,
                value: JSON.stringify({ userId, email: userEmail }),
                expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
            },
        });
        return token;
    }

    async confirmClaim(token: string) {
        const record = await this.prisma.verification.findFirst({
            where: { identifier: `claim:${token}` },
        });
        if (!record || record.expiresAt < new Date()) {
            throw new BadRequestException('This claim link is invalid or has expired');
        }

        const { userId, email } = JSON.parse(record.value);

        const result = await this.prisma.donation.updateMany({
            where: { email, donorId: null, status: 'CONFIRMED' },
            data: { donorId: userId },
        });

        await this.prisma.verification.delete({ where: { id: record.id } });

        return { claimedCount: result.count };
    }
}