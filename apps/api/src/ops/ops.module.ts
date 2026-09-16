import { Module } from '@nestjs/common';
import { CatalogModule } from '../catalog/catalog.module.js';
import { DeliveryModule } from '../delivery/delivery.module.js';
import { MerchantModule } from '../merchant/merchant.module.js';
import { OrderModule } from '../order/order.module.js';
import { OpsController } from './ops.controller.js';
import { OpsService } from './ops.service.js';

@Module({
  imports: [MerchantModule, CatalogModule, OrderModule, DeliveryModule],
  controllers: [OpsController],
  providers: [OpsService],
})
export class OpsModule {}
