import { Controller, Post, Body } from '@nestjs/common';
import { Session, type UserSession } from '@thallesp/nestjs-better-auth';
import { DonationsService } from './donations.service';
import { CreateDonationDto } from './dto/create-donation.dto';

@Controller('donations')
export class DonationsController {
    constructor(private readonly donationsService: DonationsService) { }

    @Post()
    create(@Session() session: UserSession, @Body() dto: CreateDonationDto) {
        return this.donationsService.create(session.user.id, dto);
    }
}