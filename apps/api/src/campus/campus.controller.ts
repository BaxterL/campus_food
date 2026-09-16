import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Permission } from '@campus-food/domain';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { RequirePermission } from '../common/decorators/require-permission.decorator.js';
import { RequestContext } from '../common/request-context.js';
import { CampusService } from './campus.service.js';
import { CreateAddressDto, CreateBuildingDto, CreateCampusDto } from './campus.dto.js';

@ApiTags('campus')
@Controller('campus')
export class CampusController {
  constructor(private readonly campusService: CampusService) {}

  @Get()
  @RequirePermission(Permission.CAMPUS_READ)
  @ApiOperation({ summary: 'List campuses' })
  listCampuses() {
    return this.campusService.listCampuses();
  }

  @Get('buildings')
  @RequirePermission(Permission.CAMPUS_READ)
  @ApiOperation({ summary: 'List buildings' })
  listBuildings() {
    return this.campusService.listBuildings();
  }

  @Post()
  @RequirePermission(Permission.CAMPUS_WRITE)
  @ApiOperation({ summary: 'Create campus' })
  createCampus(@Body() dto: CreateCampusDto) {
    return this.campusService.createCampus(dto);
  }

  @Post('buildings')
  @RequirePermission(Permission.CAMPUS_WRITE)
  @ApiOperation({ summary: 'Create building' })
  createBuilding(@Body() dto: CreateBuildingDto) {
    return this.campusService.createBuilding(dto);
  }

  @Get('addresses')
  @RequirePermission(Permission.ORDER_READ_OWN)
  @ApiOperation({ summary: 'List my addresses' })
  listAddresses(@CurrentUser() user: RequestContext) {
    return this.campusService.listAddresses(user.userId);
  }

  @Post('addresses')
  @RequirePermission(Permission.ORDER_CREATE)
  @ApiOperation({ summary: 'Create address' })
  createAddress(@CurrentUser() user: RequestContext, @Body() dto: CreateAddressDto) {
    return this.campusService.createAddress(user.userId, dto);
  }
}
