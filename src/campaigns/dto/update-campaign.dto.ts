import { IsString, IsNumber, Min, MaxLength, IsOptional, IsEnum } from 'class-validator';
import { CampaignCategory } from '../../../generated/prisma';

export class UpdateCampaignDto {
    @IsString()
    @MaxLength(150)
    @IsOptional()
    title?: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsNumber()
    @Min(1)
    @IsOptional()
    goalAmount?: number;

    @IsString()
    @IsOptional()
    imageUrl?: string;

    @IsEnum(CampaignCategory)
    @IsOptional()
    category?: CampaignCategory;
}