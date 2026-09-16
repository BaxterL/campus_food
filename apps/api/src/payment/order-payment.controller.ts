import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Permission } from '@campus-food/domain';
import { PaymentProvider } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { RequirePermission } from '../common/decorators/require-permission.decorator.js';
import { RequestContext } from '../common/request-context.js';
import { CreateOrderPaymentDto } from '../order/order.dto.js';
import { PaymentService } from './payment.service.js';

@ApiTags('order-payments')
@Controller('orders')
export class OrderPaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post(':id/payments')
  @RequirePermission(Permission.PAYMENT_CREATE)
  @ApiOperation({ summary: 'Pay order from student app' })
  pay(
    @CurrentUser() user: RequestContext,
    @Param('id') id: string,
    @Body() dto: CreateOrderPaymentDto,
  ) {
    return this.paymentService.createPayment(user, {
      orderId: id,
      provider: dto.provider ?? PaymentProvider.MOCK,
    });
  }

  @Get(':id/payment-status')
  @RequirePermission(Permission.ORDER_READ_OWN)
  paymentStatus(@CurrentUser() user: RequestContext, @Param('id') id: string) {
    return this.paymentService.getStatus(user, id);
  }
}
