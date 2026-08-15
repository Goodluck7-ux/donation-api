import { IsString, IsNumber, Min, MaxLength } from 'class-validator';

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
}