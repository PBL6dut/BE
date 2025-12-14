const axios = require("axios");
const { StatusCodes } = require("http-status-codes");
const GHN_API_URL = process.env.GHN_API_URL;
const GHN_TOKEN_SANDBOX = process.env.GHN_TOKEN_SANDBOX;
const GHN_SHOP_ID_SANDBOX = process.env.GHN_SHOP_ID_SANDBOX;
const GHN_API_PROVINCES = process.env.GHN_API_PROVINCES;
const GHN_API_DISTRICTS = process.env.GHN_API_DISTRICTS;
const GHN_API_WARDS = process.env.GHN_API_WARDS;
const GHN_API_EXPECTED_DELIVERY_DATE = process.env.GHN_API_EXPECTED_DELIVERY_DATE;
const { default: ApiError } = require("../utils/ApiError");
const from_district_id = process.env.FROM_DISTRICT_ID;
const service_id = process.env.SERVICE_ID;
const GHN_API_SHIPPING_SERVICES = process.env.GHN_API_SHIPPING_SERVICES;
const GHN_API_SHIPPING_FEE = process.env.GHN_API_SHIPPING_FEE;

// Helper function để gọi API của GHN, tránh lặp code
const callGhnApi = async (url, errorMessage) => {
  try {
    const response = await axios.get(url, {
      headers: {
        Token: GHN_TOKEN_SANDBOX,
        "Content-Type": "application/json",
      },
    });
    // API của GHN trả về dữ liệu trong response.data.data
    if (response.data && response.data.code === 200) {
      return response.data.data;
    }
    // Ném lỗi nếu GHN API trả về lỗi
    throw new Error(response.data.message || "Failed to fetch data from GHN");
  } catch (error) {
    throw new ApiError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      errorMessage,
      error.response?.data?.message || error.message
    );
  }
};

const getProvinces = async () => {
  const data = await callGhnApi(GHN_API_PROVINCES, "Get Provinces Failed");
  const provinces = data.slice(4, data.length);
  return provinces.map((province) => ({
    province_id: province.ProvinceID,
    province_name: province.ProvinceName,
  }));
};

const getDistricts = async (province_id) => {
  if (!province_id) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      "Get Districts Failed",
      "Province ID is required"
    );
  }

  const url = `${GHN_API_DISTRICTS}?province_id=${province_id}`;
  const data = await callGhnApi(url, "Get Districts Failed");
  console.log(data);

  return data.map((district) => ({
    district_id: district.DistrictID,
    district_name: district.DistrictName,
  }));
};

const getWards = async (district_id) => {
  if (!district_id) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      "Get Wards Failed",
      "District ID is required"
    );
  }

  const url = `${GHN_API_WARDS}?district_id=${district_id}`;
  const data = await callGhnApi(url, "Get Wards Failed");

  return data.map((ward) => ({
    ward_id: ward.WardCode,
    ward_name: ward.WardName,
  }));
};

const getShippingServices = async (to_district_id) => {
  if (!to_district_id) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      "Get Shipping Services Failed",
      "To District ID is required"
    );
  }

  const url = `${GHN_API_SHIPPING_SERVICES}?shop_id=${GHN_SHOP_ID_SANDBOX}&from_district=${from_district_id}&to_district=${to_district_id}`;
  const data = await callGhnApi(url, "Get Shipping Services Failed");

  return data;
};

const calculateShippingFee = async (
  price,
  to_district_id,
  to_ward_code,
  height,
  length,
  width,
  weight
) => {
  if (!to_district_id) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      "Calculate Shipping Fee Failed",
      "To District ID is required"
    );
  } else {
    to_district_id = parseInt(to_district_id);
  }

  if (!to_ward_code) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      "Calculate Shipping Fee Failed",
      "To Ward Code is required"
    );
  } else {
    to_ward_code = to_ward_code.toString();
  }

  if (!weight) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      "Calculate Shipping Fee Failed",
      "Weight is required"
    );
  } else {
    weight = parseInt(weight) * 1000;
  }

  if (!length) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      "Calculate Shipping Fee Failed",
      "Length is required"
    );
  } else {
    length = parseInt(length);
  }

  if (!width) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      "Calculate Shipping Fee Failed",
      "Width is required"
    );
  } else {
    width = parseInt(width);
  }

  if (!height) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      "Calculate Shipping Fee Failed",
      "Height is required"
    );
  } else {
    height = parseInt(height);
  }

  const shippingServices = await getShippingServices(to_district_id);
  const service_id = shippingServices.filter(
    (service) => service.service_type_id === 2
  )[0]?.service_id;

  const url = `${GHN_API_SHIPPING_FEE}`;
  try {
    const response = await axios.post(
      url,
      {
        service_id: parseInt(service_id),
        insurance_value: price,
        from_district_id: parseInt(from_district_id),
        to_district_id: to_district_id,
        to_ward_code: to_ward_code,
        height: height,
        length: length,
        width: width,
        weight: weight,
      },
      {
        headers: {
          Token: GHN_TOKEN_SANDBOX,
          ShopId: GHN_SHOP_ID_SANDBOX,
          "Content-Type": "application/json",
        },
      }
    );
    if (response.data && response.data.code === 200) {
      const fee = response.data.data.total;
      return fee;
    }
  } catch (error) {
    throw new ApiError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      "Calculate Shipping Fee Failed",
      error.message
    );
  }
};

const getExpectedDeliveryDate = async (
  to_district_id,
  to_ward_code,
) => {
  if (!to_district_id || !to_ward_code) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      "Get Expected Delivery Date Failed",
      "To District ID, To Ward Code, and Service ID are required"
    );
  }

  const shippingServices = await getShippingServices(to_district_id);
  const service_id = await shippingServices.filter(
    (service) => service.service_type_id === 2
  )[0]?.service_id;

  const url = `${GHN_API_EXPECTED_DELIVERY_DATE}`;
  try {
    const response = await axios.post(
      url,
      {
        service_id: parseInt(service_id),
        from_district_id: parseInt(from_district_id),
        to_district_id: to_district_id,
        to_ward_code: to_ward_code,
      },
      {
        headers: {
          Token: GHN_TOKEN_SANDBOX,
          ShopId: GHN_SHOP_ID_SANDBOX,
          "Content-Type": "application/json",
        },
      }
    );
    if (response.data && response.data.code === 200) {
      const leadtimeSeconds = response.data.data.leadtime;
      const leadtimeMilliseconds = leadtimeSeconds * 1000;
      const expected_delivery_date = new Date(leadtimeMilliseconds);
      return expected_delivery_date;
    }
  } catch (error) {
    throw new ApiError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      "Get Expected Delivery Date Failed",
      error.message
    );
  }
};

module.exports = {
  getProvinces,
  getDistricts,
  getWards,
  getShippingServices,
  calculateShippingFee,
  getExpectedDeliveryDate,
};
