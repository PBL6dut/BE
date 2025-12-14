const { StatusCodes } = require("http-status-codes");
const { PrismaClient } = require("../generated/client");
const { default: ApiError } = require("../utils/ApiError");
// const ApiError = require("../utils/ApiError");
const formatImageUrl = require("../utils/formatImageUrl");
const { deleteFile } = require("../utils/imageStorage");
const productRepository = require("../repositories/product.repository");

const countProducts = async () => {
  const count = await productRepository.countProducts();
  return count;
}

const getAllProducts = async (
  page = 1,
  limit = 10,
  query = {}
) => {  
  const result = await productRepository.getProducts(page, limit, query);
  const { products, count } = result;
  const totalPages = Math.ceil(count / limit);

  return { data: products, pagination: { currentPage: page, totalPages } };
};

const getProductById = async (id) => {
  if (isNaN(id)) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      "Get product failed",
      "Invalid product ID"
    );
  }

  const product = await productRepository.getProductById(id);

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
  return await productRepository.getAllCategories();
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
  countProducts,
};
