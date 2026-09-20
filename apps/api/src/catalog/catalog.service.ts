import { Injectable } from '@nestjs/common';
import { ForbiddenError, NotFoundError, resolveMerchantScope } from '@campus-food/domain';
import { PrismaService } from '../prisma/prisma.service.js';
import { RequestContext } from '../common/request-context.js';
import {
  CreateCategoryDto,
  CreateProductDto,
  CreateSkuDto,
  SetSkuActiveDto,
  UpdateInventoryDto,
} from './catalog.dto.js';
import { toWeappProduct } from '../common/weapp-presenters.js';

@Injectable()
export class CatalogService {
  constructor(private readonly prisma: PrismaService) {}

  private assertMerchantAccess(ctx: RequestContext, merchantId: string) {
    const scope = resolveMerchantScope(ctx);
    if (scope.merchantId && scope.merchantId !== merchantId) {
      throw new ForbiddenError('Merchant scope mismatch');
    }
  }

  createCategory(ctx: RequestContext, dto: CreateCategoryDto) {
    this.assertMerchantAccess(ctx, dto.merchantId);
    return this.prisma.category.create({ data: dto });
  }

  listCategories(merchantId: string) {
    return this.prisma.category.findMany({
      where: { merchantId, active: true },
      orderBy: { sortOrder: 'asc' },
    });
  }

  createProduct(ctx: RequestContext, dto: CreateProductDto) {
    this.assertMerchantAccess(ctx, dto.merchantId);
    return this.prisma.product.create({
      data: {
        merchantId: dto.merchantId,
        name: dto.name,
        description: dto.description,
        imageUrl: dto.imageUrl,
        categoryId: dto.categoryId,
      },
    });
  }

  async listProducts(merchantId: string) {
    return this.prisma.product.findMany({
      where: { merchantId, active: true },
      include: {
        skus: { where: { active: true }, include: { inventory: true } },
        category: true,
      },
    });
  }

  async listWeappProducts(merchantId: string) {
    const products = await this.listProducts(merchantId);
    return products.map((product) => toWeappProduct(product));
  }

  async setProductSoldOut(ctx: RequestContext, skuOrProductId: string, soldOut: boolean) {
    const sku = await this.prisma.sku.findFirst({
      where: { OR: [{ id: skuOrProductId }, { productId: skuOrProductId }] },
      include: { product: true },
    });
    if (!sku) throw new NotFoundError('Product');
    this.assertMerchantAccess(ctx, sku.product.merchantId);
    await this.prisma.sku.update({ where: { id: sku.id }, data: { active: !soldOut } });
    return this.listWeappProducts(sku.product.merchantId);
  }

  async createSku(ctx: RequestContext, dto: CreateSkuDto) {
    const product = await this.prisma.product.findUnique({ where: { id: dto.productId } });
    if (!product) throw new NotFoundError('Product');
    this.assertMerchantAccess(ctx, product.merchantId);

    const sku = await this.prisma.sku.create({
      data: { productId: dto.productId, name: dto.name, priceCents: dto.priceCents },
    });
    await this.prisma.inventory.create({
      data: { skuId: sku.id, totalQty: dto.initialQty ?? 0, reservedQty: 0 },
    });
    return this.prisma.sku.findUnique({ where: { id: sku.id }, include: { inventory: true } });
  }

  async updateInventory(ctx: RequestContext, skuId: string, dto: UpdateInventoryDto) {
    const sku = await this.prisma.sku.findUnique({
      where: { id: skuId },
      include: { product: true, inventory: true },
    });
    if (!sku) throw new NotFoundError('SKU');
    this.assertMerchantAccess(ctx, sku.product.merchantId);
    if (!sku.inventory) throw new NotFoundError('Inventory');

    return this.prisma.inventory.update({
      where: { skuId },
      data: { totalQty: dto.totalQty, version: { increment: 1 } },
    });
  }

  async setSkuActive(ctx: RequestContext, skuId: string, dto: SetSkuActiveDto) {
    const sku = await this.prisma.sku.findUnique({
      where: { id: skuId },
      include: { product: true },
    });
    if (!sku) throw new NotFoundError('SKU');
    this.assertMerchantAccess(ctx, sku.product.merchantId);
    return this.prisma.sku.update({ where: { id: skuId }, data: { active: dto.active } });
  }
}
