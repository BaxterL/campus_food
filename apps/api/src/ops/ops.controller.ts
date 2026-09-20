import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Permission } from '@campus-food/domain';
import type { Request, Response } from 'express';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { Public } from '../common/decorators/public.decorator.js';
import { RequirePermission } from '../common/decorators/require-permission.decorator.js';
import { RequestContext } from '../common/request-context.js';
import { OPS_SESSION_COOKIE, OpsAuthService } from '../auth/ops-auth.service.js';
import { OpsLoginDto } from '../auth/ops-auth.dto.js';
import { OpsService } from './ops.service.js';

const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: '/',
};

@ApiTags('ops')
@Controller('ops')
export class OpsController {
  constructor(
    private readonly ops: OpsService,
    private readonly opsAuth: OpsAuthService,
  ) {}

  @Get('auth/me')
  @ApiOperation({ summary: 'Ops current identity' })
  me(@CurrentUser() user: RequestContext) {
    return this.ops.me(user);
  }

  @Public()
  @Post('auth/login')
  @ApiOperation({ summary: 'Ops account login' })
  async login(
    @Body() body: OpsLoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.opsAuth.login(body.username, body.password);
    res.cookie(OPS_SESSION_COOKIE, result.token, SESSION_COOKIE_OPTIONS);
    return result.me;
  }

  @Public()
  @Post('auth/logout')
  @ApiOperation({ summary: 'Ops logout' })
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    await this.opsAuth.logout(req.cookies?.[OPS_SESSION_COOKIE]);
    res.clearCookie(OPS_SESSION_COOKIE, { path: '/' });
    return { ok: true };
  }

  @Public()
  @Post('auth/dev-login')
  @ApiOperation({ summary: 'Ops development login (non-production only)' })
  devLogin(@Body() body: { userId: string; role?: string; merchantId?: string }) {
    if (process.env.NODE_ENV === 'production') {
      throw new ForbiddenException('Dev login disabled');
    }
    return this.ops.devLogin(body.userId, body.role, body.merchantId);
  }

  @Get('overview/stats')
  @RequirePermission(Permission.ORDER_READ_MERCHANT)
  stats(@CurrentUser() user: RequestContext) {
    return this.ops.stats(user);
  }

  @Get('merchants')
  @RequirePermission(Permission.MERCHANT_ONBOARD)
  listMerchants(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('campusId') campusId?: string,
    @Query('reviewStatus') reviewStatus?: string,
    @Query('runStatus') runStatus?: string,
    @Query('keyword') keyword?: string,
  ) {
    return this.ops.listMerchants({
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
      campusId,
      reviewStatus,
      runStatus,
      keyword,
    });
  }

  @Post('merchants')
  @RequirePermission(Permission.MERCHANT_ONBOARD)
  createMerchant(@Body() body: { name: string; campusId?: string; contactPhone?: string; address?: string; remark?: string }) {
    return this.ops.createMerchant(body);
  }

  @Get('merchants/:id')
  @RequirePermission(Permission.MERCHANT_ONBOARD)
  getMerchant(@Param('id') id: string) {
    return this.ops.getMerchant(id);
  }

  @Patch('merchants/:id')
  @RequirePermission(Permission.MERCHANT_ONBOARD)
  updateMerchant(@Param('id') id: string, @Body() body: { name?: string; contactPhone?: string; address?: string; remark?: string }) {
    return this.ops.updateMerchant(id, body);
  }

  @Post('merchants/:id/approve')
  @RequirePermission(Permission.MERCHANT_ONBOARD)
  approve(@Param('id') id: string) {
    return this.ops.approveMerchant(id);
  }

  @Post('merchants/:id/reject')
  @RequirePermission(Permission.MERCHANT_ONBOARD)
  rejectMerchant(@Param('id') id: string) {
    return this.ops.rejectMerchant(id);
  }

  @Post('merchants/:id/toggle-status')
  @RequirePermission(Permission.MERCHANT_ONBOARD)
  toggle(@Param('id') id: string) {
    return this.ops.toggleMerchant(id);
  }

  @Get('products')
  @RequirePermission(Permission.CATALOG_MANAGE)
  listProducts(
    @CurrentUser() user: RequestContext,
    @Query('merchantId') merchantId?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.ops.listProducts(user, {
      merchantId,
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
    });
  }

  @Patch('products/:id/inventory')
  @RequirePermission(Permission.CATALOG_MANAGE)
  updateInventory(
    @CurrentUser() user: RequestContext,
    @Param('id') id: string,
    @Body() body: { stock?: number; isOnSale?: boolean },
  ) {
    return this.ops.updateInventory(id, user, body);
  }

  @Get('categories')
  @RequirePermission(Permission.CATALOG_MANAGE)
  listCategories(@CurrentUser() user: RequestContext, @Query('merchantId') merchantId?: string) {
    return this.ops.listCategories(user, merchantId);
  }

  @Post('products')
  @RequirePermission(Permission.CATALOG_MANAGE)
  createProduct(
    @CurrentUser() user: RequestContext,
    @Body()
    body: {
      merchantId?: string;
      name: string;
      description?: string;
      imageUrl?: string;
      categoryId?: string;
      categoryName?: string;
      skuName?: string;
      priceCents: number;
      stock?: number;
    },
  ) {
    return this.ops.createProduct(user, body);
  }

  @Post('uploads/image')
  @RequirePermission(Permission.CATALOG_MANAGE)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 3 * 1024 * 1024 },
    }),
  )
  uploadImage(@UploadedFile() file: Express.Multer.File) {
    return this.ops.uploadImage(file);
  }

  @Get('orders')
  @RequirePermission(Permission.ORDER_READ_MERCHANT)
  listOrders(
    @CurrentUser() user: RequestContext,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('merchantId') merchantId?: string,
    @Query('status') status?: string | string[],
  ) {
    return this.ops.listOrders(user, {
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
      merchantId,
      status,
    });
  }

  @Get('orders/:id')
  @RequirePermission(Permission.ORDER_READ_MERCHANT)
  getOrder(@CurrentUser() user: RequestContext, @Param('id') id: string) {
    return this.ops.getOrder(user, id);
  }

  @Post('orders/:id/accept')
  @RequirePermission(Permission.ORDER_MANAGE_MERCHANT)
  accept(@CurrentUser() user: RequestContext, @Param('id') id: string) {
    return this.ops.accept(user, id);
  }

  @Post('orders/:id/reject')
  @RequirePermission(Permission.ORDER_MANAGE_MERCHANT)
  reject(@CurrentUser() user: RequestContext, @Param('id') id: string) {
    return this.ops.reject(user, id);
  }

  @Post('orders/:id/mark-ready')
  @RequirePermission(Permission.ORDER_MANAGE_MERCHANT)
  markReady(@CurrentUser() user: RequestContext, @Param('id') id: string) {
    return this.ops.markReady(user, id);
  }

  @Post('orders/:id/verify-pickup')
  @RequirePermission(Permission.ORDER_MANAGE_MERCHANT)
  @ApiOperation({ summary: '核销自取取餐码并完结订单' })
  verifyPickup(
    @CurrentUser() user: RequestContext,
    @Param('id') id: string,
    @Body() body: { pickupCode: string },
  ) {
    return this.ops.verifyPickup(user, id, body.pickupCode);
  }

  @Get('dispatch/pending')
  @RequirePermission(Permission.DISPATCH_MANAGE)
  pending() {
    return this.ops.pendingDispatch();
  }

  @Get('dispatch/riders')
  @RequirePermission(Permission.DISPATCH_MANAGE)
  riders() {
    return this.ops.dispatchRiders();
  }

  @Post('dispatch/assign')
  @RequirePermission(Permission.DISPATCH_MANAGE)
  assign(@CurrentUser() user: RequestContext, @Body() body: { orderId: string; riderId: string }) {
    return this.ops.assign(user, body.orderId, body.riderId);
  }

  @Post('dispatch/reassign')
  @RequirePermission(Permission.DISPATCH_MANAGE)
  reassign(@CurrentUser() user: RequestContext, @Body() body: { orderId: string; riderId: string }) {
    return this.ops.reassign(user, body.orderId, body.riderId);
  }

  @Get('riders/whitelist')
  @RequirePermission(Permission.RIDER_MANAGE)
  whitelist(@Query('campusId') campusId?: string) {
    return this.ops.listWhitelist(campusId);
  }

  @Post('riders/whitelist')
  @RequirePermission(Permission.RIDER_MANAGE)
  createWhitelist(@Body() body: { name: string; phone: string; campusId?: string; userId?: string }) {
    return this.ops.createWhitelist(body);
  }

  @Patch('riders/whitelist/:id')
  @RequirePermission(Permission.RIDER_MANAGE)
  updateWhitelist(@Param('id') id: string, @Body() body: { isActive?: boolean; name?: string; phone?: string }) {
    return this.ops.updateWhitelist(id, body);
  }

  @Delete('riders/whitelist/:id')
  @RequirePermission(Permission.RIDER_MANAGE)
  deleteWhitelist(@Param('id') id: string) {
    return this.ops.updateWhitelist(id, { isActive: false });
  }

  @Get('finance/refund-exceptions')
  @RequirePermission(Permission.LEDGER_READ)
  refunds() {
    return this.ops.refundExceptions();
  }

  @Get('finance/reconciliation-exceptions')
  @RequirePermission(Permission.LEDGER_READ)
  recon() {
    return this.ops.reconciliationExceptions();
  }

  @Get('audit-logs')
  @RequirePermission(Permission.LEDGER_READ)
  logs(@Query('page') page?: string, @Query('pageSize') pageSize?: string) {
    return this.ops.auditLogs({
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
    });
  }
}
