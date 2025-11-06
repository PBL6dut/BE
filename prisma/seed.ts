import { PrismaClient } from '../src/generated/client/index.js'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting seed...')

  // Clear existing data (optional)
  await prisma.orderDetail.deleteMany()
  await prisma.order.deleteMany()
  await prisma.product_Image.deleteMany()
  await prisma.product.deleteMany()
  await prisma.category.deleteMany()
  await prisma.customer.deleteMany()
  await prisma.admin.deleteMany()

  // 1. Create Categories
  console.log('📁 Creating categories...')
  const categories = await Promise.all([
    prisma.category.create({
      data: {
        name: 'Sofa & Ghế',
        description: 'Bộ sofa, ghế thư giãn, ghế làm việc các loại',
      }
    }),
    prisma.category.create({
      data: {
        name: 'Bàn',
        description: 'Bàn ăn, bàn làm việc, bàn trang điểm',
      }
    }),
    prisma.category.create({
      data: {
        name: 'Giường & Tủ',
        description: 'Giường ngủ, tủ quần áo, tủ đầu giường',
      }
    }),
    prisma.category.create({
      data: {
        name: 'Tủ Kệ',
        description: 'Tủ tivi, kệ sách, tủ giày dép',
      }
    }),
    prisma.category.create({
      data: {
        name: 'Đèn & Decor',
        description: 'Đèn trang trí, đồ decor, tranh ảnh',
      }
    }),
  ])

  // 2. Create Products
  console.log('🛋️ Creating products...')
  const products = await Promise.all([
    // Sofa & Ghế
    prisma.product.create({
      data: {
        name: 'Sofa Băng 3 Chỗ Hiện Đại',
        description: 'Sofa băng 3 chỗ ngồi với thiết kế hiện đại, chất liệu vải cao cấp, đệm êm ái. Phù hợp cho phòng khách gia đình.',
        price: 12500000,
        sale_price: 9990000,
        category_id: categories[0].id,
        stock_quantity: 15,
        weight: 85.5,
        length: 210,
        width: 90,
        height: 85,
        material: 'Khung gỗ tự nhiên, vải bọc cao cấp, đệm mút',
        color: 'Xám Nhạt',
        status: 'active',
        images: {
          create: [
            { url: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800' },
            { url: 'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=800' },
          ]
        }
      }
    }),
    prisma.product.create({
      data: {
        name: 'Ghế Làm Việc Ergonomic',
        description: 'Ghế văn phòng thiết kế ergonomic hỗ trợ lưng, có thể điều chỉnh độ cao và tựa lưng.',
        price: 3500000,
        sale_price: 2990000,
        category_id: categories[0].id,
        stock_quantity: 30,
        weight: 15.2,
        length: 65,
        width: 65,
        height: 120,
        material: 'Khung kim loại, lưới thoáng khí, đệm êm',
        color: 'Đen',
        status: 'active',
        images: {
          create: [
            { url: 'https://images.unsplash.com/photo-1580480055273-228ff5388ef8?w=800' },
          ]
        }
      }
    }),
    prisma.product.create({
      data: {
        name: 'Ghế Thư Giãn Da Bò',
        description: 'Ghế armchair bọc da bò thật, sang trọng và thoải mái cho không gian đọc sách.',
        price: 8500000,
        category_id: categories[0].id,
        stock_quantity: 8,
        weight: 32.0,
        length: 85,
        width: 90,
        height: 95,
        material: 'Da bò thật, khung gỗ sồi',
        color: 'Nâu Cognac',
        status: 'active',
        images: {
          create: [
            { url: 'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=800' },
          ]
        }
      }
    }),

    // Bàn
    prisma.product.create({
      data: {
        name: 'Bàn Ăn Gỗ Sồi 6 Chỗ',
        description: 'Bàn ăn gỗ sồi tự nhiên cho 6 người, thiết kế chắc chắn và sang trọng.',
        price: 15000000,
        sale_price: 12500000,
        category_id: categories[1].id,
        stock_quantity: 12,
        weight: 65.0,
        length: 180,
        width: 90,
        height: 75,
        material: 'Gỗ sồi tự nhiên',
        color: 'Vân gỗ tự nhiên',
        status: 'active',
        images: {
          create: [
            { url: 'https://images.unsplash.com/photo-1617806118233-18e1de247200?w=800' },
          ]
        }
      }
    }),
    prisma.product.create({
      data: {
        name: 'Bàn Làm Việc Minimalist',
        description: 'Bàn làm việc phong cách tối giản, có ngăn kéo tiện lợi.',
        price: 4200000,
        sale_price: 3490000,
        category_id: categories[1].id,
        stock_quantity: 25,
        weight: 28.5,
        length: 120,
        width: 60,
        height: 75,
        material: 'MDF phủ melamine, chân kim loại',
        color: 'Trắng',
        status: 'active',
        images: {
          create: [
            { url: 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=800' },
          ]
        }
      }
    }),

    // Giường & Tủ
    prisma.product.create({
      data: {
        name: 'Giường Ngủ Queen Size 1m6',
        description: 'Giường ngủ bọc vải cao cấp, có đầu giường êm ái, kích thước 1m6 x 2m.',
        price: 11000000,
        sale_price: 8990000,
        category_id: categories[2].id,
        stock_quantity: 10,
        weight: 55.0,
        length: 200,
        width: 160,
        height: 120,
        material: 'Khung gỗ, vải bọc cao cấp',
        color: 'Xám Đậm',
        status: 'active',
        images: {
          create: [
            { url: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=800' },
          ]
        }
      }
    }),
    prisma.product.create({
      data: {
        name: 'Tủ Quần Áo 3 Cánh',
        description: 'Tủ quần áo 3 cánh rộng rãi với gương lớn, nhiều ngăn chia tiện lợi.',
        price: 9500000,
        category_id: categories[2].id,
        stock_quantity: 7,
        weight: 95.0,
        length: 180,
        width: 60,
        height: 220,
        material: 'MDF phủ melamine chống ẩm',
        color: 'Nâu Walnut',
        status: 'active',
        images: {
          create: [
            { url: 'https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=800' },
          ]
        }
      }
    }),

    // Tủ Kệ
    prisma.product.create({
      data: {
        name: 'Kệ Tivi Hiện Đại 1m8',
        description: 'Kệ tivi với thiết kế hiện đại, có ngăn kéo và kệ mở để đồ.',
        price: 5500000,
        sale_price: 4490000,
        category_id: categories[3].id,
        stock_quantity: 18,
        weight: 42.0,
        length: 180,
        width: 40,
        height: 50,
        material: 'Gỗ công nghiệp, chân kim loại',
        color: 'Đen kết hợp gỗ',
        status: 'active',
        images: {
          create: [
            { url: 'https://images.unsplash.com/photo-1594026112284-02bb6f3352fe?w=800' },
          ]
        }
      }
    }),
    prisma.product.create({
      data: {
        name: 'Kệ Sách 5 Tầng',
        description: 'Kệ sách kim loại 5 tầng, chắc chắn và dễ lắp ráp.',
        price: 2800000,
        category_id: categories[3].id,
        stock_quantity: 22,
        weight: 18.5,
        length: 80,
        width: 30,
        height: 180,
        material: 'Khung sắt sơn tĩnh điện, mặt gỗ MDF',
        color: 'Đen',
        status: 'active',
        images: {
          create: [
            { url: 'https://images.unsplash.com/photo-1594620302200-9a762244a156?w=800' },
          ]
        }
      }
    }),

    // Đèn & Decor
    prisma.product.create({
      data: {
        name: 'Đèn Chùm Hiện Đại',
        description: 'Đèn chùm phong cách Bắc Âu với 6 bóng LED, ánh sáng vàng ấm.',
        price: 4500000,
        sale_price: 3690000,
        category_id: categories[4].id,
        stock_quantity: 15,
        weight: 5.2,
        length: 80,
        width: 80,
        height: 60,
        material: 'Kim loại sơn tĩnh điện, bóng LED',
        color: 'Vàng Đồng',
        status: 'active',
        images: {
          create: [
            { url: 'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?w=800' },
          ]
        }
      }
    }),
    prisma.product.create({
      data: {
        name: 'Đèn Bàn Đọc Sách LED',
        description: 'Đèn bàn LED có thể điều chỉnh độ sáng và góc chiếu, bảo vệ mắt.',
        price: 890000,
        sale_price: 690000,
        category_id: categories[4].id,
        stock_quantity: 50,
        weight: 1.2,
        length: 15,
        width: 15,
        height: 45,
        material: 'Nhựa ABS, LED',
        color: 'Trắng',
        status: 'active',
        images: {
          create: [
            { url: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800' },
          ]
        }
      }
    }),
    prisma.product.create({
      data: {
        name: 'Bộ Tranh Canvas 3 Tấm',
        description: 'Bộ 3 tranh canvas trừu tượng hiện đại, tạo điểm nhấn cho không gian.',
        price: 1500000,
        category_id: categories[4].id,
        stock_quantity: 30,
        weight: 2.5,
        length: 40,
        width: 3,
        height: 60,
        material: 'Canvas in UV, khung gỗ',
        color: 'Đa màu',
        status: 'active',
        images: {
          create: [
            { url: 'https://images.unsplash.com/photo-1561214115-f2f134cc4912?w=800' },
          ]
        }
      }
    }),
  ])

  // 3. Create Customers
  console.log('👥 Creating customers...')
  const hashedPassword = await bcrypt.hash('Customer@123', 10)
  
  const customers = await Promise.all([
    prisma.customer.create({
      data: {
        full_name: 'Nguyễn Văn An',
        email: 'nguyenvanan@gmail.com',
        password: hashedPassword,
        phone: '0901234567',
        address: '123 Đường Lê Lợi, Quận 1, TP.HCM',
      }
    }),
    prisma.customer.create({
      data: {
        full_name: 'Trần Thị Bình',
        email: 'tranthibinh@gmail.com',
        password: hashedPassword,
        phone: '0912345678',
        address: '456 Đường Nguyễn Huệ, Quận 1, TP.HCM',
      }
    }),
    prisma.customer.create({
      data: {
        full_name: 'Lê Minh Cường',
        email: 'leminhcuong@gmail.com',
        password: hashedPassword,
        phone: '0923456789',
        address: '789 Đường Trần Hưng Đạo, Quận 5, TP.HCM',
      }
    }),
    prisma.customer.create({
      data: {
        full_name: 'Phạm Thị Dung',
        email: 'phamthidung@gmail.com',
        google_id: 'google_123456',
        password: hashedPassword,
        phone: '0934567890',
        address: '321 Đường Hai Bà Trưng, Quận 3, TP.HCM',
      }
    }),
    prisma.customer.create({
      data: {
        full_name: 'Hoàng Văn Em',
        email: 'hoangvanem@gmail.com',
        facebook_id: 'fb_789012',
        password: hashedPassword,
        phone: '0945678901',
        address: '654 Đường Võ Văn Tần, Quận 3, TP.HCM',
      }
    }),
  ])

  // 4. Create Orders
  console.log('🛒 Creating orders...')
  
  // Order 1 - Completed
  await prisma.order.create({
    data: {
      order_number: 'ORD-2024-00001',
      customer_id: customers[0].id,
      order_date: new Date('2024-10-15'),
      total_amount: 10680000,
      shipping_fee: 200000,
      status: 'completed',
      payment_method: 'bank_transfer',
      payment_status: 'paid',
      paid_at: new Date('2024-10-15T10:30:00'),
      shipping_method: 'standard_delivery',
      shipping_address: '123 Đường Lê Lợi, Quận 1, TP.HCM',
      phone: '0901234567',
      expected_delivery_date: new Date('2024-10-20'),
      notes: 'Giao hàng giờ hành chính',
      order_details: {
        create: [
          {
            product_id: products[0].id, // Sofa
            quantity: 1,
            unit_price: 9990000,
            total_price: 9990000,
          },
          {
            product_id: products[10].id, // Đèn bàn
            quantity: 1,
            unit_price: 690000,
            total_price: 690000,
          },
        ]
      }
    }
  })

  // Order 2 - Shipping
  await prisma.order.create({
    data: {
      order_number: 'ORD-2024-00002',
      customer_id: customers[1].id,
      order_date: new Date('2024-10-25'),
      total_amount: 13180000,
      shipping_fee: 300000,
      status: 'shipping',
      payment_method: 'cash_on_delivery',
      payment_status: 'pending',
      shipping_method: 'express_delivery',
      shipping_address: '456 Đường Nguyễn Huệ, Quận 1, TP.HCM',
      phone: '0912345678',
      expected_delivery_date: new Date('2024-10-28'),
      notes: 'Gọi trước 30 phút khi giao',
      order_details: {
        create: [
          {
            product_id: products[3].id, // Bàn ăn
            quantity: 1,
            unit_price: 12500000,
            total_price: 12500000,
          },
          {
            product_id: products[1].id, // Ghế làm việc
            quantity: 1,
            unit_price: 2990000,
            total_price: 2990000,
          },
        ]
      }
    }
  })

  // Order 3 - Confirmed
  await prisma.order.create({
    data: {
      order_number: 'ORD-2024-00003',
      customer_id: customers[2].id,
      order_date: new Date('2024-10-28'),
      total_amount: 9240000,
      shipping_fee: 250000,
      status: 'confirmed',
      payment_method: 'e_wallet',
      payment_status: 'paid',
      paid_at: new Date('2024-10-28T14:20:00'),
      shipping_method: 'standard_delivery',
      shipping_address: '789 Đường Trần Hưng Đạo, Quận 5, TP.HCM',
      phone: '0923456789',
      expected_delivery_date: new Date('2024-11-02'),
      order_details: {
        create: [
          {
            product_id: products[5].id, // Giường ngủ
            quantity: 1,
            unit_price: 8990000,
            total_price: 8990000,
          },
        ]
      }
    }
  })

  // Order 4 - Pending
  await prisma.order.create({
    data: {
      order_number: 'ORD-2024-00004',
      customer_id: customers[3].id,
      order_date: new Date('2024-10-30'),
      total_amount: 8380000,
      shipping_fee: 200000,
      status: 'pending',
      payment_method: 'credit_card',
      payment_status: 'pending',
      shipping_method: 'standard_delivery',
      shipping_address: '321 Đường Hai Bà Trưng, Quận 3, TP.HCM',
      phone: '0934567890',
      expected_delivery_date: new Date('2024-11-05'),
      notes: 'Thanh toán khi nhận hàng',
      order_details: {
        create: [
          {
            product_id: products[2].id, // Ghế thư giãn
            quantity: 1,
            unit_price: 8500000,
            total_price: 8500000,
          },
        ]
      }
    }
  })

  // Order 5 - Completed (Multiple items)
  await prisma.order.create({
    data: {
      order_number: 'ORD-2024-00005',
      customer_id: customers[4].id,
      order_date: new Date('2024-10-20'),
      total_amount: 8870000,
      shipping_fee: 250000,
      status: 'completed',
      payment_method: 'bank_transfer',
      payment_status: 'paid',
      paid_at: new Date('2024-10-20T09:15:00'),
      shipping_method: 'installation_service',
      shipping_address: '654 Đường Võ Văn Tần, Quận 3, TP.HCM',
      phone: '0945678901',
      expected_delivery_date: new Date('2024-10-25'),
      notes: 'Yêu cầu lắp đặt và hướng dẫn sử dụng',
      order_details: {
        create: [
          {
            product_id: products[4].id, // Bàn làm việc
            quantity: 1,
            unit_price: 3490000,
            total_price: 3490000,
          },
          {
            product_id: products[7].id, // Kệ tivi
            quantity: 1,
            unit_price: 4490000,
            total_price: 4490000,
          },
          {
            product_id: products[9].id, // Đèn chùm
            quantity: 1,
            unit_price: 3690000,
            total_price: 3690000,
          },
        ]
      }
    }
  })

  // 5. Create Admins
  console.log('👨‍💼 Creating admins...')
  const adminPassword = await bcrypt.hash('Admin@123', 10)
  
  await Promise.all([
    prisma.admin.create({
      data: {
        username: 'admin',
        password: adminPassword,
        full_name: 'Quản Trị Viên',
        email: 'admin@furniture.vn',
      }
    }),
    prisma.admin.create({
      data: {
        username: 'manager',
        password: adminPassword,
        full_name: 'Nguyễn Văn Quản Lý',
        email: 'manager@furniture.vn',
      }
    }),
  ])

  console.log('✅ Seed completed successfully!')
  console.log(`
  📊 Summary:
  - Categories: ${categories.length}
  - Products: ${products.length}
  - Customers: ${customers.length}
  - Orders: 5
  - Admins: 2
  
  🔑 Login credentials:
  Customer: nguyenvanan@gmail.com / Customer@123
  Admin: admin@furniture.vn / Admin@123
  `)
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })