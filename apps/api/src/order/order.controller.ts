import { Body, Controller, Get, Headers, Param, Post } from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Permission } from '@campus-food/domain';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { RequirePermission } from '../common/decorators/require-permission.decorator.js';
import { RequestContext } from '../common/request-context.js';
import { CreateOrderDto, VerifyDeliveryCodeDto, VerifyPickupCodeDto } from './order.dto.js';
import { OrderService } from './order.service.js';

@ApiTags('orders')
@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post()
  @RequirePermission(Permission.ORDER_CREATE)
  @ApiOperation({ summary: 'Create order (idempotent per merchant)' })
  @ApiHeader({ name: 'idempotency-key', required: false })
  createOrder(
    @CurrentUser() user: RequestContext,
    @Body() dto: CreateOrderDto,
    @Headers('idempotency-key') idempotencyKey?: string,
  ) {
    return this.orderService.createOrder(user, dto, idempotencyKey);
  }

  @Get()
  @RequirePermission(Permission.ORDER_READ_OWN)
  @ApiOperation({ summary: 'List orders (scoped)' })
  listOrders(@CurrentUser() user: RequestContext) {
    return this.orderService.listOrders(user);
  }

  @Get(':id')
  @RequirePermission(Permission.ORDER_READ_OWN)
  @ApiOperation({ summary: 'Get order detail' })
  getOrder(@CurrentUser() user: RequestContext, @Param('id') id: string) {
    return this.orderService.getOrder(user, id);
  }

  @Post(':id/merchant/accept')
  @RequirePermission(Permission.ORDER_MANAGE_MERCHANT)
  @ApiOperation({ summary: 'Merchant accept order' })
  merchantAccept(@CurrentUser() user: RequestContext, @Param('id') id: string) {
    return this.orderService.merchantAccept(user, id);
  }

  @Post(':id/merchant/reject')
  @RequirePermission(Permission.ORDER_MANAGE_MERCHANT)
  @ApiOperation({ summary: 'Merchant reject order' })
  merchantReject(@CurrentUser() user: RequestContext, @Param('id') id: string) {
    return this.orderService.merchantReject(user, id);
  }

  @Post(':id/merchant/preparing')
  @RequirePermission(Permission.ORDER_MANAGE_MERCHANT)
  @ApiOperation({ summary: 'Merchant start preparing' })
  merchantPreparing(@CurrentUser() user: RequestContext, @Param('id') id: string) {
    return this.orderService.merchantPreparing(user, id);
  }

  @Post(':id/merchant/ready')
  @RequirePermission(Permission.ORDER_MANAGE_MERCHANT)
  @ApiOperation({ summary: 'Merchant mark ready (generates codes)' })
  merchantReady(@CurrentUser() user: RequestContext, @Param('id') id: string) {
    return this.orderService.merchantReady(user, id);
  }

  @Post(':id/verify-pickup')
  @RequirePermission(Permission.ORDER_MANAGE_MERCHANT)
  @ApiOperation({ summary: 'Verify pickup code and complete' })
  verifyPickup(
    @CurrentUser() user: RequestContext,
    @Param('id') id: string,
    @Body() dto: VerifyPickupCodeDto,
  ) {
    return this.orderService.verifyPickup(user, id, dto.pickupCode);
  }

  @Post(':id/verify-delivery')
  @RequirePermission(Permission.DISPATCH_RIDER)
  @ApiOperation({ summary: 'Verify delivery code and complete' })
  verifyDelivery(
    @CurrentUser() user: RequestContext,
    @Param('id') id: string,
    @Body() dto: VerifyDeliveryCodeDto,
  ) {
    return this.orderService.verifyDelivery(user, id, dto.deliveryCode);
  }
}
