import { Controller, Post, Get, Body, Param, UseGuards } from '@nestjs/common';
import { Session, type UserSession } from '@thallesp/nestjs-better-auth';
import { OrganizationsService } from './organizations.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';


@Controller('organizations')
export class OrganizationsController {
    constructor(private readonly organizationsService: OrganizationsService) { }


    @Get('admin/all')
    @Roles('ORG_ADMIN', 'PLATFORM_ADMIN')
    @UseGuards(RolesGuard)
    findAllForAdmin() {
        return this.organizationsService.findAll();
    }

    @Post()
    @Roles('ORG_ADMIN', 'PLATFORM_ADMIN')
    @UseGuards(RolesGuard)
    create(@Session() session: UserSession, @Body() dto: CreateOrganizationDto) {
        return this.organizationsService.create(session.user.id, dto);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.organizationsService.findById(id);
    }
}