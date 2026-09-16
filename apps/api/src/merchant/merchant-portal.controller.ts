import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Permission } from '@campus-food/domain';
import { IsBoolean, IsOptional } from 'class-validator';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { RequirePermission } from '../common/decorators/require-permission.decorator.js';
import { RequestContext } from '../common/request-context.js';
import { CatalogService } from '../catalog/catalog.service.js';
import { OrderService } from '../order/order.service.js';
import { MerchantService } from './merchant.service.js';

class OpenStatusDto {
  @IsOptional()
  @IsBoolean()
  isOpen?: boolean;
}

class SoldOutDto {
  @IsBoolean()
  soldOut!: boolean;
}

@ApiTags('merchant-portal')
@Controller('merchant')
export class MerchantPortalController {
  constructor(
    private readonly merchants: MerchantService,
    private readonly catalog: CatalogService,
    private readonly orders: OrderService,
  ) {}

  @Get('profile')
  @RequirePermission(Permission.ORDER_READ_MERCHANT)
  profile(@CurrentUser() user: RequestContext) {
    return this.merchants.getBoundMerchant(user);
  }

  @Patch('profile')
  @RequirePermission(Permission.CATALOG_MANAGE)
  setOpen(@CurrentUser() user: RequestContext, @Body() dto: OpenStatusDto) {
    return this.merchants.setOpen(user, dto.isOpen ?? true);
  }

  @Get('orders')
  @RequirePermission(Permission.ORDER_READ_MERCHANT)
  listOrders(@CurrentUser() user: RequestContext) {
    return this.orders.listOrders(user);
  }

  @Post('orders/:id/accept')
  @RequirePermission(Permission.ORDER_MANAGE_MERCHANT)
  accept(@CurrentUser() user: RequestContext, @Param('id') id: string) {
    return this.orders.merchantAccept(user, id);
  }

  @Post('orders/:id/reject')
  @RequirePermission(Permission.ORDER_MANAGE_MERCHANT)
  reject(@CurrentUser() user: RequestContext, @Param('id') id: string) {
    return this.orders.merchantReject(user, id);
  }

  @Post('orders/:id/ready')
  @RequirePermission(Permission.ORDER_MANAGE_MERCHANT)
  ready(@CurrentUser() user: RequestContext, @Param('id') id: string) {
    return this.orders.merchantReadyFromCurrent(user, id);
  }

  @Get('products')
  @RequirePermission(Permission.CATALOG_MANAGE)
  products(@CurrentUser() user: RequestContext) {
    if (!user.merchantId) return [];
    return this.catalog.listWeappProducts(user.merchantId);
  }

  @Patch('products/:productId')
  @RequirePermission(Permission.CATALOG_MANAGE)
  soldOut(
    @CurrentUser() user: RequestContext,
    @Param('productId') productId: string,
    @Body() dto: SoldOutDto,
  ) {
    return this.catalog.setProductSoldOut(user, productId, dto.soldOut);
  }
}
