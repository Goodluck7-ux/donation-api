import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentsService } from '../payments/payments.service';

@Injectable()
export class DonationsService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly paymentsService: PaymentsService,
    ) { }

    async create(donorId: string, dto: { campaignId: string; amount: number }) {
        const donor = await this.prisma.user.findUnique({ where: { id: donorId } });
        if (!donor) throw new NotFoundException('Donor not found');

        const donation = await this.prisma.donation.create({
            data: {
                donorId,
                campaignId: dto.campaignId,
                amount: dto.amount,
                status: 'PENDING',
            },
        });

        const { authorizationUrl, reference } = await this.paymentsService.initiate(
            donor.email,
            dto.amount,
            donation.id,
        );

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
}