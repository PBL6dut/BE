const prisma = require("../utils/prisma-client");

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
      category_id: false,
    },
    orderBy: {
      created_at: "desc",
    },
  };

  if (Object.keys(query).length > 0) {
    if (query.name) {
      queryArgs.where = { name: { contains: query.name } };
    }
    if (query.category_id) {
      queryArgs.where = {
        ...queryArgs.where,
        category_id: parseInt(query.category_id),
      };
    }
    if (query.min_price) {
      queryArgs.where = {
        ...queryArgs.where,
        price: { gte: parseFloat(query.min_price) },
      };
    }
    if (query.max_price) {
      queryArgs.where = {
        ...queryArgs.where,
        price: { ...queryArgs.where.price, lte: parseFloat(query.max_price) },
      };
    }
    if (query.tags) {
      const tagsArray = query.tags.split(",").map((tag) => tag.trim());
      queryArgs.where = {
        ...queryArgs.where,
        tags: {
          hasSome: tagsArray,
        },
      };
    }
    if (query.sort) {
      const dashIndex = query.sort.indexOf("_");
      const sortField = query.sort.substring(-1, dashIndex);
      const sortOrder = query.sort.substring(dashIndex + 1, query.sort.length);
      queryArgs.orderBy = {
        [sortField]: sortOrder,
      };
    }
  }

  const products = await prisma.product.findMany(queryArgs);
  console.log(products);
  const count = products.length;
  return { products, count };
};

const getProductsByIds = async (ids) => {
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

module.exports = {
  countProducts,
  getProducts,
  getAllCategories,
  getProductById,
  getProductsByIds,
};
