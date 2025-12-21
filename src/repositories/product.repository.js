const prisma = require("../utils/prisma-client");

const getMostProductsByCategory = async () => {
  const result =
    await prisma.$queryRaw`SELECT c.name, COUNT(p.id) AS total_products
FROM Category c
JOIN Product p ON c.id = p.category_id
GROUP BY c.id, c.name
ORDER BY total_products DESC
LIMIT 5;
`;
  return result.map((row) => ({
    ...row,
    total_products: Number(row.total_products),
  }));
};

const countProducts = async () => {
  const count = await prisma.product.count();
  return count;
};

const getProducts = async (page = 1, limit = 10, query = {}) => {
  const queryArgs = {
    take: limit,
    skip: (page - 1) * limit,
    include: {
      images: { select: { url: true } },
      category: { select: { id: true, name: true } },
      order_details: {
        include: {
          order: true,
        },
      },
      // category_id: false, // Prisma có thể báo lỗi dòng này nếu version cũ, nếu chạy ổn thì giữ nguyên
    },
    orderBy: {
      created_at: "desc",
    },
    where: {}, // Khởi tạo where rỗng trước
  };

  if (Object.keys(query).length > 0) {
    // Xử lý tìm kiếm chung (Tên sản phẩm HOẶC Tên danh mục)
    if (query.name) {
      queryArgs.where.OR = [
        { name: { contains: query.name } },
        { category: { name: { contains: query.name } } },
      ];
    }

    // Các điều kiện bên dưới sẽ hoạt động như AND với khối OR ở trên
    if (query.category_id) {
      queryArgs.where.category_id = parseInt(query.category_id);
    }

    // Đoạn code cũ xử lý query.name ở đây đã được gộp vào khối OR ở trên rồi, nên bỏ đi.

    if (query.min_price) {
      queryArgs.where.price = {
        ...queryArgs.where.price, // Giữ lại các điều kiện price khác nếu có
        gte: parseFloat(query.min_price),
      };
    }
    if (query.max_price) {
      queryArgs.where.price = {
        ...queryArgs.where.price,
        lte: parseFloat(query.max_price),
      };
    }
    if (query.tags) {
      const tagsArray = query.tags.split(",").map((tag) => tag.trim());
      queryArgs.where.tags = {
        hasSome: tagsArray,
      };
    }
    if (query.sort) {
      const dashIndex = query.sort.indexOf("_");
      // Sửa lỗi logic substring: tham số đầu tiên không được âm
      if (dashIndex !== -1) {
        const sortField = query.sort.substring(0, dashIndex);
        const sortOrder = query.sort.substring(dashIndex + 1);
        queryArgs.orderBy = {
          [sortField]: sortOrder,
        };
      }
    }
  }

  const products = await prisma.product.findMany(queryArgs);
  const count = await countProducts(); // Lưu ý: count này đang đếm all, nếu muốn count theo filter thì phải truyền where vào countProducts
  return { products, count };
};

const getProductsByIds = async (productIds) => {
  const products = await prisma.product.findMany({
    where: {
      id: { in: productIds },
    },
  });
  return products;
};

const getProductById = async (id) => {
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      order_details: false,
      category: { select: { id: true, name: true } },
      images: { select: { url: true } },
      created_at: false,
      updated_at: false,
      category_id: false,
    },
  });
  return product;
};

const getAllCategories = async () => {
  return await prisma.category.findMany({
    select: { id: true, name: true },
  });
};

const countActiveProducts = async () => {
  const count = await prisma.product.count({
    where: { status: "active" },
  });
  return count;
};

const countAlmostOutOfStockProducts = async () => {
  const threshold = 5;
  const count = await prisma.product.count({
    where: {
      stock_quantity: {
        lte: threshold,
      },
    },
  });
  return count;
};

const countOutOfStockProducts = async () => {
  const count = await prisma.product.count({
    where: {
      stock_quantity: 0,
    },
  });
  return count;
};

module.exports = {
  countProducts,
  getProducts,
  getAllCategories,
  getProductById,
  getProductsByIds,
  getMostProductsByCategory,
  countActiveProducts,
  countAlmostOutOfStockProducts,
  countOutOfStockProducts,
};
