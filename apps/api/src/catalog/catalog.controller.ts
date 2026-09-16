import { Body, Controller, Get, Param, Post, Put, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Permission } from '@campus-food/domain';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { RequirePermission } from '../common/decorators/require-permission.decorator.js';
import { RequestContext } from '../common/request-context.js';
import {
  CreateCategoryDto,
  CreateProductDto,
  CreateSkuDto,
  SetSkuActiveDto,
  UpdateInventoryDto,
} from './catalog.dto.js';
import { CatalogService } from './catalog.service.js';

@ApiTags('catalog')
@Controller('catalog')
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Post('categories')
  @RequirePermission(Permission.CATALOG_MANAGE)
  @ApiOperation({ summary: 'Create category' })
  createCategory(@CurrentUser() user: RequestContext, @Body() dto: CreateCategoryDto) {
    return this.catalogService.createCategory(user, dto);
  }

  @Get('categories')
  @RequirePermission(Permission.CAMPUS_READ)
  @ApiOperation({ summary: 'List categories' })
  listCategories(@Query('merchantId') merchantId: string) {
    return this.catalogService.listCategories(merchantId);
  }

  @Post('products')
  @RequirePermission(Permission.CATALOG_MANAGE)
  @ApiOperation({ summary: 'Create product' })
  createProduct(@CurrentUser() user: RequestContext, @Body() dto: CreateProductDto) {
    return this.catalogService.createProduct(user, dto);
  }

  @Get('products')
  @RequirePermission(Permission.CAMPUS_READ)
  @ApiOperation({ summary: 'List products with SKUs' })
  listProducts(@Query('merchantId') merchantId: string) {
    return this.catalogService.listProducts(merchantId);
  }

  @Post('skus')
  @RequirePermission(Permission.CATALOG_MANAGE)
  @ApiOperation({ summary: 'Create SKU with inventory' })
  createSku(@CurrentUser() user: RequestContext, @Body() dto: CreateSkuDto) {
    return this.catalogService.createSku(user, dto);
  }

  @Put('skus/:skuId/inventory')
  @RequirePermission(Permission.CATALOG_MANAGE)
  @ApiOperation({ summary: 'Update inventory qty' })
  updateInventory(
    @CurrentUser() user: RequestContext,
    @Param('skuId') skuId: string,
    @Body() dto: UpdateInventoryDto,
  ) {
    return this.catalogService.updateInventory(user, skuId, dto);
  }

  @Put('skus/:skuId/active')
  @RequirePermission(Permission.CATALOG_MANAGE)
  @ApiOperation({ summary: 'Enable/disable SKU' })
  setSkuActive(
    @CurrentUser() user: RequestContext,
    @Param('skuId') skuId: string,
    @Body() dto: SetSkuActiveDto,
  ) {
    return this.catalogService.setSkuActive(user, skuId, dto);
  }
}
