import { IsNumber, IsString, Min } from "class-validator";

export class CreateDonationDto {
    @IsString()
    campaignId!: string;

    @IsNumber()
    @Min(1)
    amount!: number;
}