const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding data for My Bill...');

  // 1. Get a user (Sales)
  const user = await prisma.user.findFirst({
    where: { role: 'SALE' }
  }) || await prisma.user.findFirst();

  if (!user) {
    console.error('No user found to assign as Sales.');
    return;
  }

  // 2. Get or create a customer assigned to this sales person
  let customer = await prisma.customer.findFirst({
    where: { personInChargeId: user.id }
  });

  if (!customer) {
    customer = await prisma.customer.create({
      data: {
        name: 'Công ty Xuất Nhập Khẩu Toàn Cầu',
        email: 'info@toancau-logistics.vn',
        phone: '0901234567',
        taxCode: '0101234567',
        address: '123 Lê Lợi, Quận 1, TP. HCM',
        personInChargeId: user.id,
        status: 'ACTIVE'
      }
    });
  }

  // 3. Create sample delivered bookings
  const sampleBookings = [
    {
      reference: 'BK-DEL-001',
      awbNumber: '123-45678901',
      origin: 'SGN',
      destination: 'SIN',
      status: 'delivered', // lowercase as per API
      approvalStatus: 'APPROVED',
      paymentStatus: 'PAID',
      cargoType: 'General Cargo',
      service: 'Air Express',
      freightRevenue: 5000000,
      surcharge: 500000,
      otherFees: 200000,
      totalRevenue: 5700000,
      totalCost: 4000000,
      senderName: 'LOGICTIS COLLAB',
      senderPhone: '0988776655',
      senderCountry: 'VN',
      senderCity: 'Ho Chi Minh City',
      senderAddress: '456 Nguyễn Huệ, Q1',
      recipientName: 'Global Singapore Ltd',
      recipientPhone: '+65 91234567',
      recipientCountry: 'SG',
      recipientCity: 'Singapore',
      recipientAddress: '10 Collyer Quay',
      pieces: 2,
      weight: 25.5,
      chargeableWeight: 30.0,
      volume: 0.18,
      packages: {
        create: [
          { packagingType: 'Carton', weight: 12.5, length: 50, width: 40, height: 30 },
          { packagingType: 'Carton', weight: 13.0, length: 50, width: 40, height: 30 }
        ]
      }
    },
    {
      reference: 'BK-DEL-002',
      awbNumber: '123-98765432',
      origin: 'SGN',
      destination: 'BKK',
      status: 'delivered',
      approvalStatus: 'APPROVED',
      paymentStatus: 'UNPAID',
      cargoType: 'Electronics',
      service: 'Standard Carbon',
      freightRevenue: 8000000,
      surcharge: 1000000,
      otherFees: 0,
      totalRevenue: 9000000,
      totalCost: 6500000,
      senderName: 'LOGICTIS COLLAB',
      senderPhone: '0988776655',
      senderCountry: 'VN',
      senderCity: 'Ho Chi Minh City',
      senderAddress: '456 Nguyễn Huệ, Q1',
      recipientName: 'Thai Tech Corp',
      recipientPhone: '+66 21234567',
      recipientCountry: 'TH',
      recipientCity: 'Bangkok',
      recipientAddress: 'Sukhumvit Soi 21',
      pieces: 1,
      weight: 15.0,
      chargeableWeight: 15.0,
      volume: 0.05,
      packages: {
        create: [
          { packagingType: 'Pak', weight: 15.0, length: 40, width: 30, height: 20 }
        ]
      }
    }
  ];

  for (const b of sampleBookings) {
    const existing = await prisma.booking.findFirst({ where: { reference: b.reference } });
    if (!existing) {
      await prisma.booking.create({
        data: {
          ...b,
          customerId: customer.id,
          salesId: user.id
        }
      });
      console.log(`Created booking: ${b.reference}`);
    }
  }

  // 4. Create dummy settings if not exist
  await prisma.appSetting.upsert({
    where: { id: 'global' },
    update: {},
    create: {
      id: 'global',
      systemName: 'LOGICTIS CRM',
      companyName: 'CÔNG TY TNHH LOGICTIS VIỆT NAM',
      companyAddress: 'Tòa nhà Landmark 81, Vinhomes Central Park, Bình Thạnh, TP.HCM',
      companyPhone: '028 3824 1234',
      companyEmail: 'admin@logictis.com',
      companyTaxCode: '0312345678',
      companyBankInfo: '12345678 - Ngân hàng VCB - Chi nhánh HCM'
    }
  });

  console.log('Seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
