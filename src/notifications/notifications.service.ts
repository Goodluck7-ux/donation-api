import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class NotificationsService {
    constructor(@InjectQueue('notifications') private readonly notificationsQueue: Queue) { }

    async queueDonationConfirmed(donorEmail: string, campaignTitle: string, amount: number) {
        await this.notificationsQueue.add('donation-confirmed', {
            donorEmail,
            campaignTitle,
            amount,
        });
    }
}