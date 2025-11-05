import { PrismaClient, Order_Status, Payment_Method, Payment_Status, Shipping_Method, Product_Status } from '@prisma/client'
// Import faker với locale tiếng Việt
import { faker } from '@faker-js/faker/locale/vi' 

const prisma = new PrismaClient()

// Chức năng để tạo một số ngẫu nhiên trong phạm vi
const getRandomNumber = (min: number, max: number) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Chức năng để chọn ngẫu nhiên một phần tử từ enum
const getRandomEnum = <T extends object>(anEnum: T): T[keyof T] => {
    const enumValues = Object.values(anEnum) as unknown as T[keyof T][];
    const randomIndex = getRandomNumber(0, enumValues.length - 1);
    return enumValues[randomIndex];
}

async function main() {
  console.log('Bắt đầu gieo hạt...')

  // --- 1. Tạo Category (Danh mục) ---
  const categories = []
  for (let i = 0; i < 10; i++) {
    const category = await prisma.category.create({
      data: {
        name: faker.commerce.department(),
        description: faker.lorem.sentences(2),
      },
    })
    categories.push(category)
  }
  console.log(`Đã tạo ${categories.length} danh mục.`)
  if (categories.length === 0) return;

  // --- 2. Tạo Customer (Khách hàng) ---
  const customers = []
  for (let i = 0; i < 10; i++) {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const rawPassword = faker.internet.password();
    
    const customer = await prisma.customer.create({
      data: {
        full_name: `${firstName} ${lastName}`,
        email: faker.internet.email({ firstName, lastName, provider: 'example.com' }),
        password: rawPassword, 
        // ĐÃ SỬA LỖI CUỐI CÙNG: Chỉ gọi faker.phone.number()
        phone: faker.phone.number(), 
        address: faker.location.streetAddress(true),
      },
    })
    customers.push(customer)
  }
  console.log(`Đã tạo ${customers.length} khách hàng.`)
  if (customers.length === 0) return;

  // --- 3. Tạo Product (Sản phẩm) ---
  const products = []
  for (let i = 0; i < 50; i++) {
    const price = faker.number.float({ min: 10, max: 500, fractionDigits: 2 });
    const salePrice = price * faker.number.float({ min: 0.7, max: 0.95, fractionDigits: 2 }); 
    
    const product = await prisma.product.create({
      data: {
        name: faker.commerce.productName(),
        description: faker.commerce.productDescription(),
        price: price,
        sale_price: salePrice,
        category_id: categories[getRandomNumber(0, categories.length - 1)].id,
        stock_quantity: getRandomNumber(10, 200),
        material: faker.commerce.productMaterial(),
        color: faker.color.human(),
        dimensions: `${getRandomNumber(10, 100)}x${getRandomNumber(10, 100)}x${getRandomNumber(10, 100)} cm`,
        status: getRandomEnum(Product_Status),
      },
    })
    products.push(product)
  }
  console.log(`Đã tạo ${products.length} sản phẩm.`)
  if (products.length === 0) return;

  // --- 4. Tạo Product_Image (Ảnh sản phẩm) ---
  for (const product of products) {
    for (let i = 0; i < getRandomNumber(1, 3); i++) { 
      await prisma.product_Image.create({
        data: {
          product_id: product.id,
          url: faker.image.urlLoremFlickr({ category: 'product', width: 640, height: 480 }),
        },
      })
    }
  }
  console.log('Đã tạo ảnh sản phẩm.')

  // --- 5. Tạo Order và OrderDetail (Đơn hàng và Chi tiết đơn hàng) ---
  const orders = []
  for (let i = 0; i < 20; i++) { 
    const customer = customers[getRandomNumber(0, customers.length - 1)]
    const status = getRandomEnum(Order_Status);
    let paid_at = null;
    let payment_status = getRandomEnum(Payment_Status);
    
    if (status === Order_Status.completed) {
        payment_status = Payment_Status.paid;
    }
    if (payment_status === Payment_Status.paid) {
        paid_at = faker.date.recent({ days: 30 });
    }

    const order = await prisma.order.create({
      data: {
        order_number: `ORD-${Date.now()}-${i}`,
        customer_id: customer.id,
        order_date: faker.date.past({ years: 1 }),
        status: status,
        payment_method: getRandomEnum(Payment_Method),
        payment_status: payment_status,
        paid_at: paid_at,
        shipping_method: getRandomEnum(Shipping_Method),
        shipping_address: customer.address || faker.location.streetAddress(true),
        // ĐÃ SỬA LỖI CUỐI CÙNG: Chỉ gọi faker.phone.number()
        phone: customer.phone || faker.phone.number(),
        expected_delivery_date: faker.date.future({ years: 1 }),
        notes: faker.lorem.sentences(1),
        total_amount: 0,
        shipping_fee: 30000,
      },
    })
    orders.push(order)

    // Tạo OrderDetail
    let totalAmount = 0;
    const productsInOrder = faker.helpers.arrayElements(products, { min: 1, max: 5 });

    for (const product of productsInOrder) {
      const quantity = getRandomNumber(1, 3);
      const unitPrice = product.sale_price || product.price;
      const totalPrice = Number(unitPrice) * quantity;
      
      await prisma.orderDetail.create({
        data: {
          order_id: order.id,
          product_id: product.id,
          quantity: quantity,
          unit_price: unitPrice,
          total_price: totalPrice,
        },
      })
      totalAmount += totalPrice;
    }

    // Cập nhật total_amount cho Order
    await prisma.order.update({
        where: { id: order.id },
        data: {
            total_amount: totalAmount + Number(order.shipping_fee)
        }
    })
  }
  console.log(`Đã tạo ${orders.length} đơn hàng và chi tiết đơn hàng.`)

  // --- 6. Tạo Admin ---
  const rawAdminPassword = faker.internet.password();
  await prisma.admin.create({
      data: {
          username: 'admin',
          full_name: 'Quản trị viên',
          email: 'admin@example.com',
          // KHÔNG BĂM MẬT KHẨU, CHỈ DÙNG TRONG MOCK DATA
          password: rawAdminPassword, 
      }
  });
  console.log(`Đã tạo tài khoản Admin: admin@example.com / ${rawAdminPassword} (Không băm, chỉ dùng cho local)`);
  console.log(`Vui lòng thay thế mật khẩu bằng mật khẩu đã được băm (hashed) trong môi trường phát triển thực tế!`);

}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect() 
  })