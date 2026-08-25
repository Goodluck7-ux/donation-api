import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';

@Injectable()
export class OrganizationsService {
    constructor(private readonly prisma: PrismaService) { }

    async create(ownerId: string, dto: CreateOrganizationDto) {
        const org = await this.prisma.organization.create({
            data: { name: dto.name },
        });

        // Link the creating user to this org so they can manage its campaigns
        await this.prisma.user.update({
            where: { id: ownerId },
            data: { organizationId: org.id },
        });

        return org;
    }

    async findById(id: string) {
        const org = await this.prisma.organization.findUnique({ where: { id } });
        if (!org) throw new NotFoundException('Organization not found');
        return org;
    }
    
    async findAll() {
        return this.prisma.organization.findMany({ orderBy: { createdAt: 'desc' } });
    }
}