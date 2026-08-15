import { IsEnum } from 'class-validator';
import { CampaignStatus } from '../../../generated/prisma';

export class UpdateCampaignStatusDto {
  @IsEnum(CampaignStatus)
  status!: CampaignStatus;
}