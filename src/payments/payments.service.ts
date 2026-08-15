import { Injectable, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PaymentsService {
    constructor(private readonly config: ConfigService) { }

    async initiate(email: string, amount: number, donationId: string) {
        const response = await fetch('https://api.paystack.co/transaction/initialize', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${this.config.get<string>('PAYSTACK_SECRET_KEY')}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email,
                amount: Math.round(amount * 100), // Paystack expects kobo (amount x 100), never decimals
                metadata: { donationId },
            }),
        });

        const data = await response.json();

        if (!data.status) {
            throw new Error(`Paystack initialization failed: ${data.message}`);
        }

        return {
            authorizationUrl: data.data.authorization_url,
            reference: data.data.reference,
        };
    }
}