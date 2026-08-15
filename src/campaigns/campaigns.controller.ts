import { Controller, Post, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { Session, type UserSession } from '@thallesp/nestjs-better-auth';
import { CampaignsService } from './campaigns.service';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { UpdateCampaignStatusDto } from './dto/update-campaign-status.dto';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('campaigns')
@Controller('campaigns')
export class CampaignsController {
    constructor(private readonly campaignsService: CampaignsService) { }

    @Post()
    @Roles('CAMPAIGN_MANAGER', 'ORG_ADMIN')
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
}