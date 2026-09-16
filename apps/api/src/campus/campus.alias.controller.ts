import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Permission } from '@campus-food/domain';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { RequirePermission } from '../common/decorators/require-permission.decorator.js';
import { RequestContext } from '../common/request-context.js';
import { CampusService } from './campus.service.js';
import { CreateAddressDto } from './campus.dto.js';

@ApiTags('addresses')
@Controller('addresses')
export class AddressController {
  constructor(private readonly campusService: CampusService) {}

  @Get()
  @RequirePermission(Permission.ORDER_READ_OWN)
  list(@CurrentUser() user: RequestContext) {
    return this.campusService.listAddresses(user.userId);
  }

  @Post()
  @RequirePermission(Permission.ORDER_CREATE)
  create(@CurrentUser() user: RequestContext, @Body() dto: CreateAddressDto) {
    return this.campusService.createAddress(user.userId, dto);
  }

  @Put(':id')
  @RequirePermission(Permission.ORDER_CREATE)
  update(
    @CurrentUser() user: RequestContext,
    @Param('id') id: string,
    @Body() dto: Partial<CreateAddressDto>,
  ) {
    return this.campusService.updateAddress(user.userId, id, dto);
  }

  @Delete(':id')
  @RequirePermission(Permission.ORDER_CREATE)
  remove(@CurrentUser() user: RequestContext, @Param('id') id: string) {
    return this.campusService.deleteAddress(user.userId, id);
  }
}

@ApiTags('buildings')
@Controller('buildings')
export class BuildingAliasController {
  constructor(private readonly campusService: CampusService) {}

  @Get()
  @RequirePermission(Permission.CAMPUS_READ)
  list(@Query('campusId') campusId?: string) {
    return this.campusService.listBuildings(campusId);
  }
}
