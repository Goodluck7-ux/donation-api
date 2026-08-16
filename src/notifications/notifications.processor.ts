import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';

@Processor('notifications')
export class NotificationsProcessor extends WorkerHost {
    private readonly logger = new Logger(NotificationsProcessor.name);

    async process(job: Job): Promise<void> {
        if (job.name === 'donation-confirmed') {
            const { donorEmail, campaignTitle, amount } = job.data;

            // Stand-in for a real email provider — proves the queue mechanism works first
            this.logger.log(
                `📧 [MOCK EMAIL] To: ${donorEmail} — Thank you for your ₦${amount} donation to "${campaignTitle}"!`,
            );

            // Simulate the kind of delay a real email API call would have
            await new Promise((resolve) => setTimeout(resolve, 500));
        }
    }
}