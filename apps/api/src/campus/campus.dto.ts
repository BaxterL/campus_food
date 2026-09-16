import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class CreateCampusDto {
  @IsString()
  name!: string;

  @IsString()
  code!: string;
}

export class CreateBuildingDto {
  @IsString()
  campusId!: string;

  @IsString()
  name!: string;

  @IsString()
  code!: string;
}

export class CreateAddressDto {
  @IsString()
  buildingId!: string;

  @IsString()
  room!: string;

  @IsOptional()
  @IsString()
  contact?: string;

  @IsOptional()
  @IsString()
  contactName?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  contactPhone?: string;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
