import { Controller, Post, Req, Res, Headers, HttpStatus } from '@nestjs/common';
import { AllowAnonymous } from '@thallesp/nestjs-better-auth';
import type { Request, Response } from 'express';
import * as crypto from 'crypto';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

@Controller('payments')
export class PaymentsController {
  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

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
    await this.prisma.$transaction(async (tx) => {
      const payment = await tx.payment.findUnique({ where: { providerReference } });

      // Idempotency guard — if we've already processed this reference, do nothing
      if (!payment || payment.status === 'SUCCESS') {
        return;
      }

      await tx.payment.update({
        where: { providerReference },
        data: { status: 'SUCCESS' },
      });

      const donation = await tx.donation.update({
        where: { id: donationId },
        data: { status: 'CONFIRMED' },
      });

      await tx.campaign.update({
        where: { id: donation.campaignId },
        data: { currentAmount: { increment: donation.amount } },
      });

      await tx.campaignEvent.create({
        data: {
          campaignId: donation.campaignId,
          eventType: 'DONATION_CONFIRMED',
          actorId: donation.donorId,
          payload: { donationId, amount: donation.amount },
        },
      });
    });
  }
}