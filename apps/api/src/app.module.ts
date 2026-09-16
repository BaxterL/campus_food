import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module.js';
import { CampusModule } from './campus/campus.module.js';
import { CatalogModule } from './catalog/catalog.module.js';
import { DeliveryModule } from './delivery/delivery.module.js';
import { HealthModule } from './health/health.module.js';
import { MerchantModule } from './merchant/merchant.module.js';
import { OrderModule } from './order/order.module.js';
import { OpsModule } from './ops/ops.module.js';
import { PaymentModule } from './payment/payment.module.js';
import { PrismaModule } from './prisma/prisma.module.js';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    HealthModule,
    CampusModule,
    MerchantModule,
    CatalogModule,
    OrderModule,
    PaymentModule,
    DeliveryModule,
    OpsModule,
  ],
})
export class AppModule {}
