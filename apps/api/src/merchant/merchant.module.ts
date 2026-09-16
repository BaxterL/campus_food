import { Module } from '@nestjs/common';
import { CatalogModule } from '../catalog/catalog.module.js';
import { OrderModule } from '../order/order.module.js';
import { MerchantController } from './merchant.controller.js';
import { MerchantPortalController } from './merchant-portal.controller.js';
import { MerchantService } from './merchant.service.js';

@Module({
  imports: [CatalogModule, OrderModule],
  controllers: [MerchantController, MerchantPortalController],
  providers: [MerchantService],
  exports: [MerchantService],
})
export class MerchantModule {}
