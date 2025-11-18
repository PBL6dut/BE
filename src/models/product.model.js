const { StatusCodes } = require("http-status-codes");
const { PrismaClient } = require("../generated/client");
const { default: ApiError } = require("../utils/ApiError");
// const ApiError = require("../utils/ApiError");
const formatImageUrl = require("../utils/formatImageUrl");
const { deleteFile } = require("../utils/imageStorage");
const prisma = new PrismaClient();

const getAllProducts = async (
  role = "customer",
  page = 1,
  limit = 10,
  query = {}
) => {
  const queryArgs = {
    take: limit,
    skip: (page - 1) * limit,
    include: {
      images: { select: { url: true } },
      category: { select: { id: true, name: true } },
      order_details: role === "admin",
      category_id: false,
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

  const totalProducts = await prisma.product.count({ where: queryArgs.where });
  const totalPages = Math.ceil(totalProducts / limit);

  const products = await prisma.product.findMany(queryArgs);
  products &&
    products.forEach((product) => {
      product.images = product.images.map((image) => formatImageUrl(image.url));
    });

  return { products, currentPage: page, totalPages };
};

const getProductById = async (id) => {
  if (isNaN(id)) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      "Get product failed",
      "Invalid product ID"
    );
  }

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

  if (product) {
    product.images = product.images.map((image) => formatImageUrl(image.url));
  }

  if (!product) {
    throw new ApiError(
      StatusCodes.NOT_FOUND,
      "Get product failed",
      "Product not found"
    );
  }

  return product;
};

const getAllCategories = async () => {
  return await prisma.category.findMany({
    select: { id: true, name: true },
  });
};

const SearchProducts = async (data) => {
  const keys = Object.keys(data);
  if (keys.length === 0) {
    return getAllProducts();
  }

  const products = await prisma.product.findMany({
    take: 20,
    where: {
      // OR: keys.map((key) => {
      //   // Nếu là số, dùng equals, nếu là chuỗi, dùng contains
      //   return typeof data[key] === "number"
      //     ? { [key]: { equals: data[key] } }
      //     : { [key]: { contains: data[key] } };
      // }),

      name: { contains: data || "" },
    },
    include: {
      images: { select: { url: true } },
      category: { select: { id: true, name: true } },
      category_id: false,
    },
  });

  products &&
    products.forEach((product) => {
      product.images = product.images.map((image) => formatImageUrl(image.url));
    });
  return products;
};

const createProduct = async (data) => {
  const { image_url, ...productData } = data;

  const { category_id } = productData;
  const categoryExists = await prisma.category.findUnique({
    where: { id: category_id },
  });

  if (!categoryExists) {
    throw new ApiError(
      StatusCodes.UNPROCESSABLE_ENTITY,
      "Create product failed",
      "Category does not exist"
    );
  }

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
  const productExists = await prisma.product.findUnique({
    where: { id },
  });

  if (!productExists) {
    throw new ApiError(
      StatusCodes.UNPROCESSABLE_ENTITY,
      "Update product failed",
      "Product does not exist"
    );
  }

  const { image_url, ...productData } = data;
  console.log(image_url);

  const { category_id } = productData;
  if (category_id) {
    const categoryExists = await prisma.category.findUnique({
      where: { id: category_id },
    });

    if (!categoryExists) {
      throw new ApiError(
        StatusCodes.UNPROCESSABLE_ENTITY,
        "Update product failed",
        "Category does not exist"
      );
    }
  }

  // Xóa toàn bộ ảnh cũ
  if (image_url) {
    const oldImages = await prisma.product_Image.findMany({
      where: { product_id: id },
    });

    if (oldImages.length > 0) {
      for (const image of oldImages) {
        await deleteFile(image.url.replace(/\\/g, "/"));
      }

      await prisma.product_Image.deleteMany({
        where: { product_id: id },
      });
    }
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
  const productExists = await prisma.product.findUnique({
    where: { id },
  });

  if (!productExists) {
    throw new ApiError(
      StatusCodes.UNPROCESSABLE_ENTITY,
      "Delete product failed",
      "Product does not exist"
    );
  }

  // Bọc các thao tác xóa trong một transaction để đảm bảo toàn vẹn dữ liệu
  return await prisma.$transaction(async (tx) => {
    try {
      const images = await tx.product_Image.findMany({
        where: { product_id: id },
      });

      // Xóa file ảnh trên cloud
      for (const image of images) {
        await deleteFile(image.url.replace(/\\/g, "/"));
      }

      // Xóa các bản ghi liên quan trong database
      await tx.product_Image.deleteMany({ where: { product_id: id } });
      await tx.orderDetail.deleteMany({ where: { product_id: id } });

      // Cuối cùng, xóa sản phẩm
      return await tx.product.delete({ where: { id } });
    } catch (error) {
      // Nếu có lỗi, transaction sẽ tự động rollback
      throw new ApiError(
        StatusCodes.INTERNAL_SERVER_ERROR,
        "Delete product failed during transaction",
        error.message
      );
    }
  });
};

const checkProductId = async (id) => {
  const product = await prisma.product.findUnique({
    where: { id },
  });
  return !!product;
};

module.exports = {
  getAllProducts,
  getProductById,
  getAllCategories,
  createProduct,
  updateProduct,
  deleteProduct,
  SearchProducts,
  checkProductId,
};
