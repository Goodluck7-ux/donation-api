import { Controller, Post, Patch, Get, Body, Param, UseGuards } from '@nestjs/common';
import { AllowAnonymous, Session, type UserSession } from '@thallesp/nestjs-better-auth';
import { CampaignsService } from './campaigns.service';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { UpdateCampaignStatusDto } from './dto/update-campaign-status.dto';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UpdateCampaignDto } from './dto/update-campaign.dto';

@Controller('campaigns')
export class CampaignsController {
  constructor(private readonly campaignsService: CampaignsService) { }

  @Get('admin/all')
  @Roles('ORG_ADMIN', 'PLATFORM_ADMIN')
  @UseGuards(RolesGuard)
  findAllForAdmin() {
    return this.campaignsService.findAllForAdmin();
  }

  @Get('admin/stats')
  @Roles('ORG_ADMIN', 'PLATFORM_ADMIN')
  @UseGuards(RolesGuard)
  getStats() {
    return this.campaignsService.getStats();
  }

  @Get()
  @AllowAnonymous()
  findActive() {
    return this.campaignsService.findActive();
  }

  @Get('mine')
  findMine(@Session() session: UserSession) {
    return this.campaignsService.findMine(session.user.id);
  }

  @Get(':id')
  @AllowAnonymous()
  findOne(@Param('id') id: string) {
    return this.campaignsService.findOne(id);
  }

  @Post()
  @Roles('CAMPAIGN_MANAGER', 'ORG_ADMIN', 'PLATFORM_ADMIN')
  @UseGuards(RolesGuard)
  create(@Session() session: UserSession, @Body() dto: CreateCampaignDto) {
    return this.campaignsService.create(session.user.id, dto);
  }

  @Patch(':id/status')
  @Roles('ORG_ADMIN', 'PLATFORM_ADMIN', 'VERIFICATION_STAFF')
  @UseGuards(RolesGuard)
  updateStatus(
    @Session() session: UserSession,
    @Param('id') id: string,
    @Body() dto: UpdateCampaignStatusDto,
  ) {
    return this.campaignsService.transition(id, session.user.id, dto.status);
  }

  @Patch(':id')
  @Roles('CAMPAIGN_MANAGER', 'ORG_ADMIN', 'PLATFORM_ADMIN')
  @UseGuards(RolesGuard)
  update(@Param('id') id: string, @Body() dto: UpdateCampaignDto) {
    return this.campaignsService.update(id, dto);
  }
}