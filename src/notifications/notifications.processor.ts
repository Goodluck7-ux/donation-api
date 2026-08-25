import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { sendEmail } from 'src/common/email';

@Processor('notifications')
export class NotificationsProcessor extends WorkerHost {
    private readonly logger = new Logger(NotificationsProcessor.name);

    async process(job: Job): Promise<void> {
        if (job.name === 'donation-confirmed') {
            const { donorEmail, campaignTitle, amount } = job.data;

            await sendEmail({
                to: donorEmail,
                subject: 'Donation Confirmed',
                html: ` To: ${donorEmail} — Thank you for your ₦${amount} donation to "${campaignTitle}"!`,
            });

            // Simulate the kind of delay a real email API call would have
            await new Promise((resolve) => setTimeout(resolve, 500));
        }
    }
}