import { Controller, Post, Get, Body, Query } from '@nestjs/common';
import { Session, type UserSession, OptionalAuth } from '@thallesp/nestjs-better-auth';
import { DonationsService } from './donations.service';
import { CreateDonationDto } from './dto/create-donation.dto';
import { AllowAnonymous } from '@thallesp/nestjs-better-auth';
import { sendEmail } from '../common/email';
import { ConfigService } from '@nestjs/config';

@Controller('donations')
export class DonationsController {
  constructor(private readonly donationsService: DonationsService,
    private readonly config: ConfigService
  ) { }

  @Post()
  @OptionalAuth()
  create(@Session() session: UserSession | null, @Body() dto: CreateDonationDto) {
    return this.donationsService.create(session?.user?.id ?? null, dto);
  }

  @Get('me')
  findMine(@Session() session: UserSession) {
    return this.donationsService.findMyDonations(session.user.id);
  }

  @Get('unclaimed')
  findUnclaimed(@Session() session: UserSession) {
    return this.donationsService.findUnclaimed(session.user.email);
  }

  @Post('claim')
  async requestClaim(@Session() session: UserSession) {
    const token = await this.donationsService.requestClaim(session.user.id, session.user.email);
    const frontendUrl = this.config.get<string>('FRONTEND_URL');
    await sendEmail({
      to: session.user.email,
      subject: 'Confirm your past donations',
      html: `<p>Click <a href="${frontendUrl}/claim-donations?token=${token}">here</a> to add your previous donations to your account. This link expires in 1 hour.</p>`,
    });
    return { status: 'sent' };
  }

  @Get('claim/verify')
  @AllowAnonymous()
  confirmClaim(@Query('token') token: string) {
    return this.donationsService.confirmClaim(token);
  }

  @Get('public/recent')
  async getRecentPublicDonations() {
    return this.donationsService.getRecentPublicDonations();
  }


}