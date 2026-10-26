const getPagination = (page = 1, limit = 10) => {
  const currentPage = Math.max(1, parseInt(page, 10) || 1);
  const perPage = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
  const skip = (currentPage - 1) * perPage;

  return {
    page: currentPage,
    limit: perPage,
    skip
  };
};

const getPagingData = (data, totalItems, page, limit) => {
  const totalPages = Math.ceil(totalItems / limit);
  return {
    items: data,
    pagination: {
      totalItems,
      totalPages,
      currentPage: page,
      limit,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1
    }
  };
};

module.exports = {
  getPagination,
  getPagingData
};
