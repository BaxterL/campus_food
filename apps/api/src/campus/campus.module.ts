import { Module } from '@nestjs/common';
import { AddressController, BuildingAliasController } from './campus.alias.controller.js';
import { CampusController } from './campus.controller.js';
import { CampusService } from './campus.service.js';

@Module({
  controllers: [CampusController, AddressController, BuildingAliasController],
  providers: [CampusService],
  exports: [CampusService],
})
export class CampusModule {}
