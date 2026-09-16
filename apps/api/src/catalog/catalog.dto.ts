import { IsBoolean, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreateCategoryDto {
  @IsString()
  merchantId!: string;

  @IsString()
  name!: string;

  @IsOptional()
  @IsInt()
  sortOrder?: number;
}

export class CreateProductDto {
  @IsString()
  merchantId!: string;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;
}

export class CreateSkuDto {
  @IsString()
  productId!: string;

  @IsString()
  name!: string;

  @IsInt()
  @Min(0)
  priceCents!: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  initialQty?: number;
}

export class UpdateInventoryDto {
  @IsInt()
  @Min(0)
  totalQty!: number;
}

export class SetSkuActiveDto {
  @IsBoolean()
  active!: boolean;
}
