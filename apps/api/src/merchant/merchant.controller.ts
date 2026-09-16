import { Body, Controller, Get, Param, Post, Put, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Permission } from '@campus-food/domain';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { RequirePermission } from '../common/decorators/require-permission.decorator.js';
import { RequestContext } from '../common/request-context.js';
import { CatalogService } from '../catalog/catalog.service.js';
import {
  AcceptInvitationDto,
  InviteStaffDto,
  OnboardMerchantDto,
  ReviewQualificationDto,
  SubmitQualificationDto,
} from './merchant.dto.js';
import { MerchantService } from './merchant.service.js';

@ApiTags('merchant')
@Controller('merchants')
export class MerchantController {
  constructor(
    private readonly merchantService: MerchantService,
    private readonly catalogService: CatalogService,
  ) {}

  @Get()
  @RequirePermission(Permission.CAMPUS_READ)
  @ApiOperation({ summary: 'List active merchants' })
  list(@Query('campusId') campusId?: string) {
    return this.merchantService.listMerchants(campusId);
  }

  @Get(':id/products')
  @RequirePermission(Permission.CAMPUS_READ)
  @ApiOperation({ summary: 'List merchant products for students' })
  products(@Param('id') id: string) {
    return this.catalogService.listWeappProducts(id);
  }

  @Get(':id')
  @RequirePermission(Permission.CAMPUS_READ)
  merchant(@Param('id') id: string) {
    return this.merchantService.getMerchant(id);
  }

  @Post('onboard')
  @RequirePermission(Permission.MERCHANT_ONBOARD)
  @ApiOperation({ summary: 'Manual merchant onboarding' })
  onboard(@Body() dto: OnboardMerchantDto) {
    return this.merchantService.onboard(dto);
  }

  @Put(':id/activate')
  @RequirePermission(Permission.MERCHANT_ONBOARD)
  @ApiOperation({ summary: 'Activate merchant' })
  activate(@Param('id') id: string) {
    return this.merchantService.activate(id);
  }

  @Post('qualifications')
  @RequirePermission(Permission.MERCHANT_MANAGE)
  @ApiOperation({ summary: 'Submit qualification' })
  submitQualification(@Body() dto: SubmitQualificationDto) {
    return this.merchantService.submitQualification(dto);
  }

  @Put('qualifications/:id/review')
  @RequirePermission(Permission.MERCHANT_ONBOARD)
  @ApiOperation({ summary: 'Review qualification' })
  reviewQualification(
    @Param('id') id: string,
    @CurrentUser() user: RequestContext,
    @Body() dto: ReviewQualificationDto,
  ) {
    return this.merchantService.reviewQualification(id, user.userId, dto);
  }

  @Post(':merchantId/invitations')
  @RequirePermission(Permission.MERCHANT_MANAGE)
  @ApiOperation({ summary: 'Invite staff' })
  inviteStaff(
    @Param('merchantId') merchantId: string,
    @CurrentUser() user: RequestContext,
    @Body() dto: InviteStaffDto,
  ) {
    return this.merchantService.inviteStaff(user, merchantId, dto);
  }

  @Post('invitations/accept')
  @RequirePermission(Permission.CAMPUS_READ)
  @ApiOperation({ summary: 'Accept staff invitation' })
  acceptInvitation(@CurrentUser() user: RequestContext, @Body() dto: AcceptInvitationDto) {
    return this.merchantService.acceptInvitation(user.userId, dto);
  }
}
