const { PrismaClient } = require("../generated/client");
const { deleteFile } = require("../utils/imageStorage");
const prisma = new PrismaClient();

const getAllProducts = async () => {
  return prisma.product.findMany({
    include: {
      order_details: true,
      category: true,
      images: true,
    },
  });
};

const getProductById = async (id) => {
  return prisma.product.findUnique({
    where: { id },
    include: {
      order_details: true,
      category: true,
      images: true,
    },
  });
};

const getAllCategories = async () => {
  return prisma.category.findMany();
};

const SearchProducts = async (data) => {
  const keys = Object.keys(data);
  if (keys.length === 0) {
    return getAllProducts();
  }
  return prisma.product.findMany({
    where: {
      OR: keys.map((key) => {
        // Nếu là số, dùng equals, nếu là chuỗi, dùng contains
        return typeof data[key] === "number"
          ? { [key]: { equals: data[key] } }
          : { [key]: { contains: data[key] } };
      }),
    },
    include: {
      images: true,
      category: true,
    },
  });
};

const createProduct = async (data) => {
  const { image_url, ...productData } = data;
  return prisma.product.create({
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
  return prisma.product.update({
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

    return prisma.product.delete({ where: { id } });
  } catch (error) {
    return error;
  }
};

module.exports = {
  getAllProducts,
  getProductById,
  getAllCategories,
  createProduct,
  updateProduct,
  deleteProduct,
  SearchProducts,
};
