(function () {
  const state = {
    products: [],
    orders: [],
    pendingOrders: [],
    deletedOrders: []
  };

  function clone(data) {
    return JSON.parse(JSON.stringify(data));
  }

  function getApiBaseUrl() {
    const configuredBaseUrl = window.APP_CONFIG && window.APP_CONFIG.API_BASE_URL;
    return configuredBaseUrl ? configuredBaseUrl.replace(/\/+$/, "") : window.location.origin;
  }

  async function request(path, options) {
    const response = await fetch(getApiBaseUrl() + path, Object.assign({
      credentials: "include"
    }, options || {}));

    const data = await response.json().catch(function () {
      return {};
    });

    if (!response.ok) {
      const message = data && data.error && data.error.message
        ? data.error.message
        : "요청 처리에 실패했습니다.";
      throw new Error(message);
    }

    return data;
  }

  function isProductActuallySoldOut(product) {
    if (product.soldOut) {
      return true;
    }

    return (product.sizes || []).every(function (size) {
      return Number(product.remainingStock[size] || 0) <= 0;
    });
  }

  async function syncDashboardData() {
    const result = await request("/api/admin/dashboard", {
      method: "GET"
    });

    state.products = result.products || [];
    state.pendingOrders = result.pendingOrders || [];
    state.orders = result.orders || [];
    state.deletedOrders = result.deletedOrders || [];

    return clone(state);
  }

  function getProducts() {
    return clone(state.products);
  }

  function getOrders() {
    return clone(state.orders);
  }

  function getPendingOrders() {
    return clone(state.pendingOrders);
  }

  function getDeletedOrders() {
    return clone(state.deletedOrders);
  }

  async function updateOrderStatus(orderId, nextStatus) {
    const result = await request("/api/admin/orders/" + encodeURIComponent(orderId) + "/status", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        status: nextStatus
      })
    });

    if (result.order) {
      state.orders = state.orders.map(function (order) {
        return order.id === result.order.id ? result.order : order;
      });
    }

    return clone(result.order);
  }

  async function deleteOrder(orderId) {
    await request("/api/super-admin/orders/" + encodeURIComponent(orderId), {
      method: "DELETE"
    });

    const targetOrder = state.orders.find(function (order) {
      return order.id === orderId;
    });

    state.orders = state.orders.filter(function (order) {
      return order.id !== orderId;
    });

    if (targetOrder) {
      state.deletedOrders.unshift(Object.assign({}, clone(targetOrder), {
        deletedAt: new Date().toISOString()
      }));
    }

    return clone(state.orders);
  }

  async function restoreDeletedOrder(orderId) {
    await request("/api/super-admin/orders/" + encodeURIComponent(orderId) + "/restore", {
      method: "POST"
    });

    const targetOrder = state.deletedOrders.find(function (order) {
      return order.id === orderId;
    });

    state.deletedOrders = state.deletedOrders.filter(function (order) {
      return order.id !== orderId;
    });

    if (targetOrder) {
      const restoredOrder = clone(targetOrder);
      delete restoredOrder.deletedAt;
      state.orders.unshift(restoredOrder);
      return restoredOrder;
    }

    return null;
  }

  async function deletePendingOrder(orderId) {
    await request("/api/super-admin/pending-orders/" + encodeURIComponent(orderId), {
      method: "DELETE"
    });

    state.pendingOrders = state.pendingOrders.filter(function (order) {
      return order.id !== orderId;
    });

    await syncDashboardData();
    return clone(state.pendingOrders);
  }

  async function setProductStock(productId, size, nextRemainingStock) {
    const result = await request("/api/super-admin/products/" + encodeURIComponent(productId) + "/stock", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        size: size,
        remainingStock: nextRemainingStock
      })
    });

    if (result.product) {
      state.products = state.products.map(function (product) {
        return product.id === result.product.id ? result.product : product;
      });
    }

    return clone(result.product);
  }

  async function adjustProductStock(productId, size, delta) {
    const product = state.products.find(function (item) {
      return item.id === productId;
    });

    if (!product) {
      throw new Error("상품을 찾을 수 없습니다.");
    }

    const currentRemaining = Number(product.remainingStock[size] || 0);
    return setProductStock(productId, size, currentRemaining + Number(delta || 0));
  }

  async function resetOrders() {
    await request("/api/super-admin/reset-orders", {
      method: "POST"
    });

    state.orders = [];
    state.pendingOrders = [];
    state.deletedOrders = [];
  }

  async function resetProducts() {
    const result = await request("/api/super-admin/reset-products", {
      method: "POST"
    });
    state.products = result.products || [];
    return clone(state.products);
  }

  async function resetInventory() {
    const result = await request("/api/super-admin/reset-inventory", {
      method: "POST"
    });
    state.products = result.products || [];
    return clone(state.products);
  }

  async function resetAllData() {
    await request("/api/super-admin/reset-all-data", {
      method: "POST"
    });

    state.products = [];
    state.orders = [];
    state.pendingOrders = [];
    state.deletedOrders = [];

    await syncDashboardData();
  }

  async function clearRevenueStatistics() {
    await resetOrders();
  }

  function calculateRevenue() {
    const orders = getOrders();
    const pendingOrders = getPendingOrders();
    const products = getProducts();
    const revenueByProduct = {};
    const quantityByProduct = {};
    let totalRevenue = 0;
    let totalQuantity = 0;
    let pendingCount = 0;
    let completedCount = 0;

    orders.forEach(function (order) {
      totalRevenue += Number(order.totalPrice || 0);
      totalQuantity += Number(order.totalQuantity || 0);

      (order.items || []).forEach(function (item) {
        revenueByProduct[item.productName] = (revenueByProduct[item.productName] || 0) + Number(item.totalPrice || 0);
        quantityByProduct[item.productName] = (quantityByProduct[item.productName] || 0) + Number(item.quantity || 0);
      });

      if (order.status === "처리 완료") {
        completedCount += 1;
      } else {
        pendingCount += 1;
      }
    });

    return {
      totalOrders: orders.length,
      waitingOrders: pendingOrders.length,
      pendingOrders: pendingCount,
      completedOrders: completedCount,
      totalRevenue: totalRevenue,
      totalQuantity: totalQuantity,
      revenueByProduct: revenueByProduct,
      quantityByProduct: quantityByProduct,
      soldOutCount: products.filter(isProductActuallySoldOut).length,
      productCount: products.length,
      deletedOrders: getDeletedOrders().length
    };
  }

  function getAdminPassword() {
    return "";
  }

  function setAdminPassword() {
    return "";
  }

  function getSuperAdminPassword() {
    return "";
  }

  function setSuperAdminPassword() {
    return "";
  }

  function getShopPassword() {
    return "";
  }

  function setShopPassword() {
    return "";
  }

  window.GoodsData = {
    syncDashboardData: syncDashboardData,
    getProducts: getProducts,
    getOrders: getOrders,
    getPendingOrders: getPendingOrders,
    getDeletedOrders: getDeletedOrders,
    updateOrderStatus: updateOrderStatus,
    deleteOrder: deleteOrder,
    restoreDeletedOrder: restoreDeletedOrder,
    deletePendingOrder: deletePendingOrder,
    setProductStock: setProductStock,
    adjustProductStock: adjustProductStock,
    resetOrders: resetOrders,
    resetProducts: resetProducts,
    resetInventory: resetInventory,
    resetAllData: resetAllData,
    clearRevenueStatistics: clearRevenueStatistics,
    calculateRevenue: calculateRevenue,
    isProductActuallySoldOut: isProductActuallySoldOut,
    getAdminPassword: getAdminPassword,
    setAdminPassword: setAdminPassword,
    getSuperAdminPassword: getSuperAdminPassword,
    setSuperAdminPassword: setSuperAdminPassword,
    getShopPassword: getShopPassword,
    setShopPassword: setShopPassword
  };
})();
