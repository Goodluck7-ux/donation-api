import { IsString, IsNumber, Min, MaxLength, IsEnum, IsOptional } from 'class-validator';
import { CampaignCategory } from '../../../generated/prisma';

export class CreateCampaignDto {
    @IsString()
    @MaxLength(150)
    title!: string;

    @IsString()
    description!: string;

    @IsNumber()
    @Min(1)
    goalAmount!: number;

    @IsString()
    organizationId!: string;

    @IsEnum(CampaignCategory)
    category!: CampaignCategory;

    @IsString()
    @IsOptional()
    imageUrl?: string;
}