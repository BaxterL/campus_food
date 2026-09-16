import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { FulfillmentType, PaymentProvider } from '@prisma/client';

export class OrderLineDto {
  @IsOptional()
  @IsString()
  skuId?: string;

  @IsOptional()
  @IsString()
  productId?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  qty?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  quantity?: number;
}

export class CreateOrderDto {
  @IsString()
  merchantId!: string;

  @IsOptional()
  @IsEnum(FulfillmentType)
  fulfillmentType?: FulfillmentType;

  @IsOptional()
  @IsString()
  addressId?: string;

  @IsOptional()
  @IsString()
  remark?: string;

  @IsOptional()
  @IsString()
  idempotencyKey?: string;

  @IsOptional()
  @IsEnum(PaymentProvider)
  paymentProvider?: PaymentProvider;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => OrderLineDto)
  items!: OrderLineDto[];
}

export class VerifyPickupCodeDto {
  @IsString()
  pickupCode!: string;
}

export class VerifyDeliveryCodeDto {
  @IsString()
  deliveryCode!: string;
}

export class CreateOrderPaymentDto {
  @IsOptional()
  @IsEnum(PaymentProvider)
  provider?: PaymentProvider;
}
