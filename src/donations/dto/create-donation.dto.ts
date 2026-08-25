import { IsString, IsNumber, Min, IsOptional, IsEmail, IsBoolean } from 'class-validator';

export class CreateDonationDto {
  @IsString()
  campaignId!: string;

  @IsNumber()
  @Min(1)
  amount!: number;

  @IsOptional()
  @IsString()
  donorName?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsBoolean()
  anonymous?: boolean;
}