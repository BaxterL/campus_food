import { IsEnum, IsOptional, IsString } from 'class-validator';
import { PaymentProvider } from '@prisma/client';

export class CreatePaymentDto {
  @IsString()
  orderId!: string;

  @IsEnum(PaymentProvider)
  provider!: PaymentProvider;
}

export class CreateRefundDto {
  @IsString()
  orderId!: string;

  @IsOptional()
  @IsString()
  reason?: string;
}
