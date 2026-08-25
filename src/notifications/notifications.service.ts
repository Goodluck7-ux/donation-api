import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  async queueDonationConfirmed(donorEmail: string, campaignTitle: string, amount: number) {
    // Redis queue temporarily disabled — real donor/admin emails still send directly via Resend
    this.logger.log(`(notification queue skipped) Would have queued: ${donorEmail} — ${campaignTitle} — ₦${amount}`);
  }
}