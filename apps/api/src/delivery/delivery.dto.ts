import { IsBoolean, IsDateString, IsOptional, IsString } from 'class-validator';

export class CreateRiderDto {
  @IsString()
  userId!: string;

  @IsString()
  campusId!: string;

  @IsString()
  name!: string;

  @IsString()
  phone!: string;
}

export class CreateRiderDutyDto {
  @IsString()
  riderId!: string;

  @IsDateString()
  date!: string;

  @IsString()
  startTime!: string;

  @IsString()
  endTime!: string;
}

export class AssignDispatchDto {
  @IsString()
  orderId!: string;

  @IsString()
  riderId!: string;
}

export class ReassignDispatchDto {
  @IsString()
  riderId!: string;
}

export class SetRiderActiveDto {
  @IsBoolean()
  active!: boolean;
}
