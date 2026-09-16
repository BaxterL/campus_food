import { Module } from '@nestjs/common';
import { OrderModule } from '../order/order.module.js';
import { OrderPaymentController } from './order-payment.controller.js';
import { PaymentController } from './payment.controller.js';
import { PaymentService } from './payment.service.js';

@Module({
  imports: [OrderModule],
  controllers: [PaymentController, OrderPaymentController],
  providers: [PaymentService],
})
export class PaymentModule {}
