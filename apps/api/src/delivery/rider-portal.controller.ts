import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Permission } from '@campus-food/domain';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { RequirePermission } from '../common/decorators/require-permission.decorator.js';
import { RequestContext } from '../common/request-context.js';
import { DeliveryService } from './delivery.service.js';
import { OrderService } from '../order/order.service.js';
import { VerifyDeliveryCodeDto, VerifyPickupCodeDto } from '../order/order.dto.js';

@ApiTags('rider-portal')
@Controller('rider')
export class RiderPortalController {
  constructor(
    private readonly delivery: DeliveryService,
    private readonly orders: OrderService,
  ) {}

  @Get('duty')
  @RequirePermission(Permission.DISPATCH_RIDER)
  duty(@CurrentUser() user: RequestContext) {
    return this.delivery.getDuty(user);
  }

  @Post('duty/on')
  @RequirePermission(Permission.DISPATCH_RIDER)
  on(@CurrentUser() user: RequestContext) {
    return this.delivery.setDuty(user, true);
  }

  @Post('duty/off')
  @RequirePermission(Permission.DISPATCH_RIDER)
  off(@CurrentUser() user: RequestContext) {
    return this.delivery.setDuty(user, false);
  }

  @Get('tasks')
  @RequirePermission(Permission.DISPATCH_RIDER)
  tasks(@CurrentUser() user: RequestContext) {
    return this.delivery.listMyDispatches(user);
  }

  @Get('tasks/:taskId')
  @RequirePermission(Permission.DISPATCH_RIDER)
  task(@CurrentUser() user: RequestContext, @Param('taskId') taskId: string) {
    return this.delivery.getTask(user, taskId);
  }

  @Post('tasks/:taskId/accept')
  @RequirePermission(Permission.DISPATCH_RIDER)
  accept(@CurrentUser() user: RequestContext, @Param('taskId') taskId: string) {
    return this.delivery.riderAccept(user, taskId);
  }

  @Post('tasks/:taskId/arrive-store')
  @RequirePermission(Permission.DISPATCH_RIDER)
  arrive(@CurrentUser() user: RequestContext, @Param('taskId') taskId: string) {
    return this.delivery.riderArrive(user, taskId);
  }

  @Post('tasks/:taskId/pickup')
  @RequirePermission(Permission.DISPATCH_RIDER)
  pickup(
    @CurrentUser() user: RequestContext,
    @Param('taskId') taskId: string,
    @Body() dto: VerifyPickupCodeDto,
  ) {
    return this.delivery.riderPickup(user, taskId, dto.pickupCode);
  }

  @Post('tasks/:taskId/deliver')
  @RequirePermission(Permission.DISPATCH_RIDER)
  async deliver(
    @CurrentUser() user: RequestContext,
    @Param('taskId') taskId: string,
    @Body() dto: VerifyDeliveryCodeDto,
  ) {
    await this.orders.verifyDelivery(user, taskId, dto.deliveryCode);
    return this.delivery.getTask(user, taskId);
  }
}
