import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Permission } from '@campus-food/domain';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { RequirePermission } from '../common/decorators/require-permission.decorator.js';
import { RequestContext } from '../common/request-context.js';
import { CreatePaymentDto, CreateRefundDto } from './payment.dto.js';
import { PaymentService } from './payment.service.js';

@ApiTags('payments')
@Controller('payments')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post()
  @RequirePermission(Permission.PAYMENT_CREATE)
  @ApiOperation({ summary: 'Pay order (Mock / OfflineMerchantDirect)' })
  createPayment(@CurrentUser() user: RequestContext, @Body() dto: CreatePaymentDto) {
    return this.paymentService.createPayment(user, dto);
  }

  @Post('refunds')
  @RequirePermission(Permission.REFUND_CREATE)
  @ApiOperation({ summary: 'Refund order' })
  createRefund(@CurrentUser() user: RequestContext, @Body() dto: CreateRefundDto) {
    return this.paymentService.createRefund(user, dto);
  }
}
