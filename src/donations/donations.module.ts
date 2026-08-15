import { Module } from '@nestjs/common';
import { DonationsService } from './donations.service';
import { PaymentsModule } from '../payments/payments.module';
import { DonationsController } from './donations.controller';

@Module({
  imports: [PaymentsModule],
  controllers: [DonationsController],
  providers: [DonationsService],
})
export class DonationsModule { }