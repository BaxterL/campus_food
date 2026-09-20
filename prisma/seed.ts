import { hashPassword } from '@campus-food/domain';
import { PrismaClient, UserRole, MerchantStatus, FulfillmentType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const campus = await prisma.campus.upsert({
    where: { code: 'main' },
    update: {},
    create: { id: 'seed-campus-main', name: '主校区', code: 'main' },
  });

  const building = await prisma.building.upsert({
    where: { campusId_code: { campusId: campus.id, code: 'dorm-a' } },
    update: {},
    create: { id: 'seed-building-a', campusId: campus.id, name: '学生宿舍A栋', code: 'dorm-a' },
  });

  const admin = await prisma.user.upsert({
    where: { phone: '13800000001' },
    update: {},
    create: { id: 'seed-user-admin', phone: '13800000001', nickname: '平台管理员', role: UserRole.SUPER_ADMIN },
  });

  const student = await prisma.user.upsert({
    where: { phone: '13800000002' },
    update: {},
    create: { id: 'seed-user-student', phone: '13800000002', nickname: '测试学生', role: UserRole.STUDENT },
  });

  const merchantOwner = await prisma.user.upsert({
    where: { phone: '13800000003' },
    update: {},
    create: { id: 'seed-user-merchant', phone: '13800000003', nickname: '麻辣香锅老板', role: UserRole.MERCHANT_OWNER },
  });

  const riderUser = await prisma.user.upsert({
    where: { phone: '13800000004' },
    update: {},
    create: { id: 'seed-user-rider', phone: '13800000004', nickname: '测试骑手', role: UserRole.RIDER },
  });

  await prisma.rider.upsert({
    where: { userId: riderUser.id },
    update: { active: true, campusId: campus.id, name: riderUser.nickname, phone: riderUser.phone ?? '13800000004' },
    create: {
      userId: riderUser.id,
      campusId: campus.id,
      name: riderUser.nickname,
      phone: riderUser.phone ?? '13800000004',
      active: true,
    },
  });

  const dispatcher = await prisma.user.upsert({
    where: { phone: '13800000005' },
    update: {},
    create: { id: 'seed-user-ops', phone: '13800000005', nickname: '调度员', role: UserRole.OPS },
  });

  await prisma.address.upsert({
    where: { id: 'seed-address-1' },
    update: {},
    create: {
      id: 'seed-address-1',
      userId: student.id,
      buildingId: building.id,
      room: '301',
      contact: '张三',
      phone: '13800000002',
      isDefault: true,
    },
  });

  const merchant = await prisma.merchant.upsert({
    where: { id: 'seed-merchant-1' },
    update: {},
    create: {
      id: 'seed-merchant-1',
      campusId: campus.id,
      name: '一食堂·麻辣香锅',
      description: '校园人气麻辣香锅',
      status: MerchantStatus.ACTIVE,
      phone: '13800000003',
      address: '一食堂二楼',
      openHours: '10:00-21:00',
    },
  });

  await prisma.merchantStaff.upsert({
    where: { merchantId_userId: { merchantId: merchant.id, userId: merchantOwner.id } },
    update: {},
    create: { merchantId: merchant.id, userId: merchantOwner.id, role: UserRole.MERCHANT_OWNER },
  });

  await prisma.merchantQualification.upsert({
    where: { id: 'seed-qual-1' },
    update: {},
    create: {
      id: 'seed-qual-1',
      merchantId: merchant.id,
      docType: 'FOOD_LICENSE',
      docUrl: 'https://example.com/license.pdf',
      status: 'APPROVED',
      reviewedBy: admin.id,
      reviewedAt: new Date(),
    },
  });

  const category = await prisma.category.upsert({
    where: { id: 'seed-cat-1' },
    update: {},
    create: { id: 'seed-cat-1', merchantId: merchant.id, name: '香锅', sortOrder: 1 },
  });

  const product = await prisma.product.upsert({
    where: { id: 'seed-prod-1' },
    update: {},
    create: {
      id: 'seed-prod-1',
      merchantId: merchant.id,
      categoryId: category.id,
      name: '经典麻辣香锅',
      description: '招牌麻辣香锅',
    },
  });

  const sku = await prisma.sku.upsert({
    where: { id: 'seed-sku-1' },
    update: {},
    create: { id: 'seed-sku-1', productId: product.id, name: '中份', priceCents: 2800 },
  });

  await prisma.inventory.upsert({
    where: { skuId: sku.id },
    update: { totalQty: 100 },
    create: { skuId: sku.id, totalQty: 100, reservedQty: 0 },
  });

  await prisma.rider.upsert({
    where: { userId: riderUser.id },
    update: {},
    create: {
      userId: riderUser.id,
      campusId: campus.id,
      name: '测试骑手',
      phone: '13800000004',
      active: true,
    },
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const rider = await prisma.rider.findUnique({ where: { userId: riderUser.id } });
  if (rider) {
    await prisma.riderDuty.upsert({
      where: { riderId_date: { riderId: rider.id, date: today } },
      update: {},
      create: {
        riderId: rider.id,
        date: today,
        startTime: '10:00',
        endTime: '20:00',
      },
    });
  }

  const opsAccounts = [
    { username: 'admin', password: 'admin123', userId: admin.id },
    { username: 'ops', password: 'ops123', userId: dispatcher.id },
    { username: 'merchant', password: 'merchant123', userId: merchantOwner.id },
  ];

  for (const account of opsAccounts) {
    await prisma.opsAccount.upsert({
      where: { username: account.username },
      update: {
        passwordHash: hashPassword(account.password),
        userId: account.userId,
        active: true,
      },
      create: {
        username: account.username,
        passwordHash: hashPassword(account.password),
        userId: account.userId,
      },
    });
  }

  console.log('Seed completed:', {
    campus: campus.code,
    merchant: merchant.name,
    adminId: admin.id,
    studentId: student.id,
    merchantOwnerId: merchantOwner.id,
    riderUserId: riderUser.id,
    dispatcherId: dispatcher.id,
    ids: {
      admin: 'seed-user-admin',
      student: 'seed-user-student',
      merchant: 'seed-user-merchant',
      rider: 'seed-user-rider',
      ops: 'seed-user-ops',
      merchantId: 'seed-merchant-1',
    },
    opsAccounts: opsAccounts.map((item) => ({
      username: item.username,
      password: item.password,
    })),
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
