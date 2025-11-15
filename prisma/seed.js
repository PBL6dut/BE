const { PrismaClient } = require('../src/generated/client')
const bcrypt = require('bcrypt')
const fs = require('fs')
const path = require('path')

const prisma = new PrismaClient()

// Helper function để đọc file JSON
function readJsonFile(fileName) {
  const filePath = path.join(__dirname, 'data', fileName)
  const fileContent = fs.readFileSync(filePath, 'utf-8')
  return JSON.parse(fileContent)
}

async function main() {
  console.log('🌱 Bắt đầu seed database...')

  try {
    // 1. Seed Categories từ file JSON
    console.log('📦 Seeding Categories from JSON...')
    const categoriesData = readJsonFile('categories.json')
    for (const category of categoriesData) {
      await prisma.category.upsert({
        where: { id: category.id },
        update: category,
        create: category
      })
    }
    console.log(`✅ Created/Updated ${categoriesData.length} categories`)

    // 2. Seed Products từ file JSON
    console.log('🛋️ Seeding Products from JSON...')
    const productsData = readJsonFile('products.json')
    for (const product of productsData) {
      await prisma.product.upsert({
        where: { id: product.id },
        update: product,
        create: product
      })
    }
    console.log(`✅ Created/Updated ${productsData.length} products`)

    // 3. Seed Product Images từ file JSON
    console.log('🖼️ Seeding Product Images from JSON...')
    const productImagesData = readJsonFile('product_images.json')
    // Xóa ảnh cũ trước
    await prisma.product_Image.deleteMany({})
    for (const image of productImagesData) {
      await prisma.product_Image.create({
        data: image
      })
    }
    console.log(`✅ Created ${productImagesData.length} product images`)

    // 4. Seed Tags
    console.log('🏷️ Seeding Tags...')
    const tags = await prisma.tag.createMany({
      data: [
        { id: 1, name: "Hot" },
        { id: 2, name: "Sale" },
        { id: 3, name: "New Arrival" },
        { id: 4, name: "Best Seller" },
        { id: 5, name: "Limited Edition" },
        { id: 6, name: "Premium" },
        { id: 7, name: "Eco-Friendly" },
        { id: 8, name: "Trending" }
      ],
      skipDuplicates: true
    })
    console.log(`✅ Created ${tags.count} tags`)

    // 5. Connect Products with Tags (ví dụ)
    console.log('🔗 Connecting Products with Tags...')
    const firstProducts = await prisma.product.findMany({ take: 5 })
    if (firstProducts.length > 0) {
      await prisma.product.update({
        where: { id: firstProducts[0].id },
        data: { tags: { connect: [{ id: 1 }, { id: 2 }] } }
      })
      if (firstProducts.length > 1) {
        await prisma.product.update({
          where: { id: firstProducts[1].id },
          data: { tags: { connect: [{ id: 2 }, { id: 4 }] } }
        })
      }
    }
    console.log('✅ Connected products with tags')

    // 6. Seed Customers
    console.log('👥 Seeding Customers...')
    const hashedPassword = await bcrypt.hash('password123', 10)
    const customers = await prisma.customer.createMany({
      data: [
        {
          id: 1,
          full_name: "Nguyễn Văn An",
          email: "nguyenvanan@gmail.com",
          password: hashedPassword,
          phone: "0901234567",
          address: "123 Đường Lê Lợi, Quận 1, TP.HCM"
        },
        {
          id: 2,
          full_name: "Trần Thị Bình",
          email: "tranthib@gmail.com",
          password: hashedPassword,
          phone: "0912345678",
          address: "456 Đường Nguyễn Huệ, Quận Hải Châu, Đà Nẵng"
        },
        {
          id: 3,
          full_name: "Lê Minh Cường",
          email: "leminhcuong@gmail.com",
          google_id: "google_123456",
          password: hashedPassword,
          phone: "0923456789",
          address: "789 Đường Hoàng Diệu, Quận Ba Đình, Hà Nội"
        },
        {
          id: 4,
          full_name: "Phạm Thu Dung",
          email: "phamthudung@gmail.com",
          facebook_id: "fb_789012",
          password: hashedPassword,
          phone: "0934567890",
          address: "321 Đường Trần Phú, TP Nha Trang, Khánh Hòa"
        },
        {
          id: 5,
          full_name: "Hoàng Văn Em",
          email: "hoangvanem@gmail.com",
          password: hashedPassword,
          phone: "0945678901",
          address: "654 Đường Phan Châu Trinh, Quận Ninh Kiều, Cần Thơ"
        }
      ],
      skipDuplicates: true
    })
    console.log(`✅ Created ${customers.count} customers`)

    // 7. Seed Orders
    console.log('📋 Seeding Orders...')
    const orders = await prisma.order.createMany({
      data: [
        {
          id: 1,
          order_number: "ORD20250001",
          customer_id: 1,
          total_amount: 52400000,
          shipping_fee: 0,
          status: "completed",
          payment_method: "bank_transfer",
          payment_status: "paid",
          paid_at: new Date("2025-01-15T10:30:00"),
          shipping_method: "standard_delivery",
          shipping_address: "123 Đường Lê Lợi, Quận 1, TP.HCM",
          phone: "0901234567",
          expected_delivery_date: new Date("2025-01-20"),
          notes: "Giao hàng giờ hành chính"
        },
        {
          id: 2,
          order_number: "ORD20250002",
          customer_id: 2,
          total_amount: 16400000,
          shipping_fee: 0,
          status: "shipping",
          payment_method: "cash_on_delivery",
          payment_status: "pending",
          shipping_method: "express_delivery",
          shipping_address: "456 Đường Nguyễn Huệ, Quận Hải Châu, Đà Nẵng",
          phone: "0912345678",
          expected_delivery_date: new Date("2025-11-17"),
          notes: "Gọi trước khi giao"
        },
        {
          id: 3,
          order_number: "ORD20250003",
          customer_id: 3,
          total_amount: 68800000,
          shipping_fee: 0,
          status: "confirmed",
          payment_method: "credit_card",
          payment_status: "paid",
          paid_at: new Date("2025-11-14T14:20:00"),
          shipping_method: "installation_service",
          shipping_address: "789 Đường Hoàng Diệu, Quận Ba Đình, Hà Nội",
          phone: "0923456789",
          expected_delivery_date: new Date("2025-11-22"),
          notes: "Yêu cầu lắp đặt tại nhà"
        },
        {
          id: 4,
          order_number: "ORD20250004",
          customer_id: 4,
          total_amount: 52400000,
          shipping_fee: 500000,
          status: "pending",
          payment_method: "e_wallet",
          payment_status: "pending",
          shipping_method: "same_day_delivery",
          shipping_address: "321 Đường Trần Phú, TP Nha Trang, Khánh Hòa",
          phone: "0934567890",
          expected_delivery_date: new Date("2025-11-15")
        },
        {
          id: 5,
          order_number: "ORD20250005",
          customer_id: 5,
          total_amount: 16400000,
          shipping_fee: 0,
          status: "cancelled",
          payment_method: "installment",
          payment_status: "refunded",
          shipping_method: "pickup_at_store",
          shipping_address: "654 Đường Phan Châu Trinh, Quận Ninh Kiều, Cần Thơ",
          phone: "0945678901",
          notes: "Khách hàng hủy đơn, đã hoàn tiền"
        }
      ],
      skipDuplicates: true
    })
    console.log(`✅ Created ${orders.count} orders`)

    // 8. Seed Order Details
    console.log('📦 Seeding Order Details...')
    const products = await prisma.product.findMany({ take: 2 })
    
    if (products.length >= 2) {
      const orderDetails = await prisma.orderDetail.createMany({
        data: [
          {
            order_id: 1,
            product_id: products[0].id,
            quantity: 1,
            unit_price: 52400000,
            total_price: 52400000
          },
          {
            order_id: 2,
            product_id: products[1].id,
            quantity: 1,
            unit_price: 16400000,
            total_price: 16400000
          },
          {
            order_id: 3,
            product_id: products[0].id,
            quantity: 1,
            unit_price: 52400000,
            total_price: 52400000
          },
          {
            order_id: 3,
            product_id: products[1].id,
            quantity: 1,
            unit_price: 16400000,
            total_price: 16400000
          },
          {
            order_id: 4,
            product_id: products[0].id,
            quantity: 1,
            unit_price: 52400000,
            total_price: 52400000
          },
          {
            order_id: 5,
            product_id: products[1].id,
            quantity: 1,
            unit_price: 16400000,
            total_price: 16400000
          }
        ],
        skipDuplicates: true
      })
      console.log(`✅ Created ${orderDetails.count} order details`)
    }

    // 9. Seed Admins
    console.log('👨‍💼 Seeding Admins...')
    const hashedAdminPassword = await bcrypt.hash('admin123456', 10)
    const admins = await prisma.admin.createMany({
      data: [
        {
          id: 1,
          username: "admin",
          password: hashedAdminPassword,
          full_name: "Quản Trị Viên",
          email: "admin@furniture.com"
        },
        {
          id: 2,
          username: "manager",
          password: hashedAdminPassword,
          full_name: "Nguyễn Văn Quản Lý",
          email: "manager@furniture.com"
        },
        {
          id: 3,
          username: "staff01",
          google_id: "google_admin_123",
          password: hashedAdminPassword,
          full_name: "Trần Thị Nhân Viên",
          email: "staff01@furniture.com"
        }
      ],
      skipDuplicates: true
    })
    console.log(`✅ Created ${admins.count} admins`)

    console.log('🎉 Seed hoàn tất!')
  } catch (error) {
    console.error('❌ Lỗi chi tiết:', error)
    throw error
  }
}

main()
  .catch((e) => {
    console.error('❌ Lỗi khi seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })