const { PrismaClient } = require("../generated/client");
const formatImageUrl = require("../utils/formatImageUrl");
const { deleteFile } = require("../utils/imageStorage");
const prisma = new PrismaClient();

const getAllProducts = async () => {
  const products = await prisma.product.findMany({
    include: {
      order_details: true,
      category: true,
      images: { select: { url: true } },
    },
  });
  products &&
    products.forEach((product) => {
      product.images = product.images.map((image) => formatImageUrl(image.url));
    });
  return products;
};

const getProductsPagination = async (page, pageSize) => {
  const skip = (page - 1) * pageSize;
  const take = pageSize;
  const pages = Math.ceil((await prisma.product.count()) / pageSize);
  if (page > pages) {
    return [];
  }
  const products = await prisma.product.findMany({
    skip,
    take,
    include: {
      category: {
        select: { name: true },
      },
      images: { select: { url: true } },
    },
  });
  products &&
    products.forEach((product) => {
      product.images = product.images.map((image) => formatImageUrl(image.url));
    });
  const result = { currentPage: page, totalPages: pages, products };
  return result;
};

const getProductById = async (id) => {
  const product =await prisma.product.findUnique({
    where: { id },
    include: {
      order_details: true,
      category: true,
      images: { select: { url: true } },
    },
  });
  product &&
    (product.images = product.images.map((image) => formatImageUrl(image.url)));
  return product;
};

const getAllCategories = async () => {
  return await prisma.category.findMany();
};

const SearchProducts = async (data) => {
  const keys = Object.keys(data);
  if (keys.length === 0) {
    return getAllProducts();
  }
  const products = await prisma.product.findMany({
    where: {
      OR: keys.map((key) => {
        // Nếu là số, dùng equals, nếu là chuỗi, dùng contains
        return typeof data[key] === "number"
          ? { [key]: { equals: data[key] } }
          : { [key]: { contains: data[key] } };
      }),
    },
    include: {
      images: { select: { url: true } },
      category: true,
    },
  });
  products &&
    products.forEach((product) => {
      product.images = product.images.map((image) => formatImageUrl(image.url));
    });
  return products
};

const createProduct = async (data) => {
  const { image_url, ...productData } = data;
  return await prisma.product.create({
    data: {
      ...productData,
      images: {
        create: image_url.map((url) => ({ url })),
      },
    },
  });
};

const updateProduct = async (id, data) => {
  const { image_url, ...productData } = data;

  // Xóa toàn bộ ảnh cũ
  if (image_url) {
    const oldImages = await prisma.product_Image.findMany({
      where: { product_id: id },
    });

    for (const image of oldImages) {
      await deleteFile(image.url.replace(/\\/g, "/"));
    }

    await prisma.product_Image.deleteMany({
      where: { product_id: id },
    });
  }

  // Update product và tạo lại ảnh mới
  return await prisma.product.update({
    where: { id },
    data: {
      ...productData,
      ...(image_url && {
        images: {
          create: image_url.map((url) => ({ url })),
        },
      }),
    },
  });
};

const deleteProduct = async (id) => {
  try {
    const images = await prisma.product_Image.findMany({
      where: { product_id: id },
    });

    for (const image of images) {
      await deleteFile(image.url.replace(/\\/g, "/"));
    }

    await prisma.product_Image.deleteMany({ where: { product_id: id } });
    await prisma.orderDetail.deleteMany({ where: { product_id: id } });

    return await prisma.product.delete({ where: { id } });
  } catch (error) {
    return error;
  }
};

module.exports = {
  getAllProducts,
  getProductsPagination,
  getProductById,
  getAllCategories,
  createProduct,
  updateProduct,
  deleteProduct,
  SearchProducts,
};
