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

  async function syncStorefrontData() {
    const result = await request("/api/products", {
      method: "GET"
    });
    state.products = result.products || [];
    return clone(state.products);
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

  async function createPendingOrder(orderInput) {
    const result = await request("/api/public/orders/pending", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(orderInput)
    });

    state.products = result.products || state.products;
    if (result.pendingOrder) {
      state.pendingOrders = [result.pendingOrder].concat(state.pendingOrders.filter(function (order) {
        return order.id !== result.pendingOrder.id;
      }));
    }

    return clone(result.pendingOrder);
  }

  async function confirmPendingOrder(pendingOrderId, adminCode) {
    const result = await request("/api/public/orders/confirm", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        pendingOrderId: pendingOrderId,
        adminCode: adminCode
      })
    });

    state.products = result.products || state.products;
    state.pendingOrders = state.pendingOrders.filter(function (order) {
      return order.id !== pendingOrderId;
    });

    if (result.order) {
      state.orders = [result.order].concat(state.orders.filter(function (order) {
        return order.id !== result.order.id;
      }));
    }

    return clone(result.order);
  }

  async function deletePendingOrder(orderId) {
    const result = await request("/api/public/orders/pending/" + encodeURIComponent(orderId), {
      method: "DELETE"
    });

    state.products = result.products || state.products;
    state.pendingOrders = state.pendingOrders.filter(function (order) {
      return order.id !== orderId;
    });

    return clone(state.pendingOrders);
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

  window.GoodsData = {
    syncStorefrontData: syncStorefrontData,
    getProducts: getProducts,
    getOrders: getOrders,
    getPendingOrders: getPendingOrders,
    getDeletedOrders: getDeletedOrders,
    createPendingOrder: createPendingOrder,
    confirmPendingOrder: confirmPendingOrder,
    deletePendingOrder: deletePendingOrder,
    calculateRevenue: calculateRevenue,
    isProductActuallySoldOut: isProductActuallySoldOut
  };
})();
