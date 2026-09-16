import { Module } from '@nestjs/common';
import { OrderModule } from '../order/order.module.js';
import { DeliveryController } from './delivery.controller.js';
import { DeliveryService } from './delivery.service.js';
import { RiderPortalController } from './rider-portal.controller.js';

@Module({
  imports: [OrderModule],
  controllers: [DeliveryController, RiderPortalController],
  providers: [DeliveryService],
  exports: [DeliveryService],
})
export class DeliveryModule {}
