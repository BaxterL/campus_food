import { IsEnum, IsOptional, IsString } from 'class-validator';
import { UserRole } from '@prisma/client';

export class OnboardMerchantDto {
  @IsOptional()
  @IsString()
  campusId?: string;

  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  openHours?: string;
}

export class SubmitQualificationDto {
  @IsString()
  merchantId!: string;

  @IsString()
  docType!: string;

  @IsString()
  docUrl!: string;
}

export class ReviewQualificationDto {
  @IsEnum(['APPROVED', 'REJECTED'] as const)
  status!: 'APPROVED' | 'REJECTED';

  @IsOptional()
  @IsString()
  rejectReason?: string;
}

export class InviteStaffDto {
  @IsString()
  phone!: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}

export class AcceptInvitationDto {
  @IsString()
  token!: string;
}
