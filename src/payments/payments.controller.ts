import { Controller, Post, Req, Res, Headers, HttpStatus } from '@nestjs/common';
import { AllowAnonymous } from '@thallesp/nestjs-better-auth';
import type { Request, Response } from 'express';
import * as crypto from 'crypto';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { sendEmail } from 'src/common/email';

@Controller('payments')
export class PaymentsController {
    constructor(
        private readonly config: ConfigService,
        private readonly prisma: PrismaService,
        private readonly notificationsService: NotificationsService,
    ) { }

    @Post('webhook')
    @AllowAnonymous()
    async handleWebhook(
        @Req() req: Request,
        @Res() res: Response,
        @Headers('x-paystack-signature') signature: string,
    ) {
        const rawBody = (req as any).rawBody as Buffer;
        const secret = this.config.get<string>('PAYSTACK_SECRET_KEY')!;

        const expectedSignature = crypto
            .createHmac('sha512', secret)
            .update(rawBody)
            .digest('hex');

        if (signature !== expectedSignature) {
            return res.status(HttpStatus.UNAUTHORIZED).send('Invalid signature');
        }

        const event = JSON.parse(rawBody.toString());

        if (event.event === 'charge.success') {
            await this.confirmDonation(event.data.reference, event.data.metadata?.donationId);
        }

        // Always return 200 quickly — Paystack retries if it doesn't get one
        return res.status(HttpStatus.OK).send('ok');
    }

    private async confirmDonation(providerReference: string, donationId: string) {
        const donation = await this.prisma.$transaction(
            async (tx) => {
                const payment = await tx.payment.findUnique({ where: { providerReference } });

                // Idempotency guard — if we've already processed this reference, do nothing
                if (!payment || payment.status === 'SUCCESS') {
                    return null;
                }

                await tx.payment.update({
                    where: { providerReference },
                    data: { status: 'SUCCESS' },
                });

                const updatedDonation = await tx.donation.update({
                    where: { id: donationId },
                    data: { status: 'CONFIRMED' },
                });

                await tx.campaign.update({
                    where: { id: updatedDonation.campaignId },
                    data: { currentAmount: { increment: updatedDonation.amount } },
                });

                await tx.campaignEvent.create({
                    data: {
                        campaignId: updatedDonation.campaignId,
                        eventType: 'DONATION_CONFIRMED',
                        actorId: updatedDonation.donorId,
                        payload: { donationId, amount: updatedDonation.amount },
                    },
                });

                return updatedDonation;
            },
            {
                maxWait: 10000,
                timeout: 10000,
            },
        );

        // Send a notification to the donor — only if this call actually confirmed something new
        if (donation) {
            const campaign = await this.prisma.campaign.findUnique({ where: { id: donation.campaignId } });
            if (campaign) {
                await this.notificationsService.queueDonationConfirmed(donation.email, campaign.title, Number(donation.amount));

                await sendEmail({
                    to: donation.email,
                    subject: 'Thank you for your donation',
                    html: `<p>Hi ${donation.donorName ?? 'there'},</p><p>Your donation of ₦${donation.amount} to <strong>${campaign.title}</strong> has been confirmed. Thank you for your generosity.</p>`,
                });

                await sendEmail({
                    to: process.env.ADMIN_NOTIFICATION_EMAIL as string,
                    subject: `New donation: ₦${donation.amount} to ${campaign.title}`,
                    html: `<p>${donation.donorName ?? 'A donor'} (${donation.email}) donated ₦${donation.amount} to "${campaign.title}".</p>`,
                });
            }
        }
    }
}