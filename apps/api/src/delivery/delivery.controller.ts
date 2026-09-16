import { Body, Controller, Get, Param, Post, Put, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Permission } from '@campus-food/domain';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { RequirePermission } from '../common/decorators/require-permission.decorator.js';
import { RequestContext } from '../common/request-context.js';
import {
  AssignDispatchDto,
  CreateRiderDto,
  CreateRiderDutyDto,
  ReassignDispatchDto,
  SetRiderActiveDto,
} from './delivery.dto.js';
import { DeliveryService } from './delivery.service.js';
import { VerifyPickupCodeDto } from '../order/order.dto.js';

@ApiTags('delivery')
@Controller('delivery')
export class DeliveryController {
  constructor(private readonly deliveryService: DeliveryService) {}

  @Post('riders')
  @RequirePermission(Permission.RIDER_MANAGE)
  @ApiOperation({ summary: 'Add rider to whitelist' })
  createRider(@Body() dto: CreateRiderDto) {
    return this.deliveryService.createRider(dto);
  }

  @Get('riders')
  @RequirePermission(Permission.RIDER_MANAGE)
  @ApiOperation({ summary: 'List riders' })
  listRiders(@Query('campusId') campusId?: string) {
    return this.deliveryService.listRiders(campusId);
  }

  @Put('riders/:riderId/active')
  @RequirePermission(Permission.RIDER_MANAGE)
  @ApiOperation({ summary: 'Enable/disable rider' })
  setRiderActive(@Param('riderId') riderId: string, @Body() dto: SetRiderActiveDto) {
    return this.deliveryService.setRiderActive(riderId, dto);
  }

  @Post('duties')
  @RequirePermission(Permission.RIDER_MANAGE)
  @ApiOperation({ summary: 'Set rider duty schedule' })
  createDuty(@Body() dto: CreateRiderDutyDto) {
    return this.deliveryService.createDuty(dto);
  }

  @Post('dispatch/assign')
  @RequirePermission(Permission.DISPATCH_MANAGE)
  @ApiOperation({ summary: 'Manual dispatch assign' })
  assign(@CurrentUser() user: RequestContext, @Body() dto: AssignDispatchDto) {
    return this.deliveryService.assignDispatch(user, dto);
  }

  @Put('dispatch/:orderId/reassign')
  @RequirePermission(Permission.DISPATCH_MANAGE)
  @ApiOperation({ summary: 'Reassign dispatch' })
  reassign(
    @CurrentUser() user: RequestContext,
    @Param('orderId') orderId: string,
    @Body() dto: ReassignDispatchDto,
  ) {
    return this.deliveryService.reassignDispatch(user, orderId, dto);
  }

  @Get('dispatch/mine')
  @RequirePermission(Permission.DISPATCH_RIDER)
  @ApiOperation({ summary: 'Rider: my dispatches' })
  myDispatches(@CurrentUser() user: RequestContext) {
    return this.deliveryService.listMyDispatches(user);
  }

  @Post('dispatch/:orderId/accept')
  @RequirePermission(Permission.DISPATCH_RIDER)
  @ApiOperation({ summary: 'Rider accept dispatch' })
  riderAccept(@CurrentUser() user: RequestContext, @Param('orderId') orderId: string) {
    return this.deliveryService.riderAccept(user, orderId);
  }

  @Post('dispatch/:orderId/pickup')
  @RequirePermission(Permission.DISPATCH_RIDER)
  @ApiOperation({ summary: 'Rider pickup with code' })
  riderPickup(
    @CurrentUser() user: RequestContext,
    @Param('orderId') orderId: string,
    @Body() dto: VerifyPickupCodeDto,
  ) {
    return this.deliveryService.riderPickup(user, orderId, dto.pickupCode);
  }
}
