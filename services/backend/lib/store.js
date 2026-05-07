const {
  getAdminPassword,
  getShopAccessPassword,
  getSuperAdminPassword
} = require("./config");
const { getFirestore } = require("./firebase-admin");
const { DEFAULT_PRODUCTS } = require("./default-products");

const AUTH_SETTINGS_DOC_ID = "auth";

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function generateId(prefix) {
  return prefix + "-" + Date.now() + "-" + Math.random().toString(36).slice(2, 8);
}

function generateRandomCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function normalizePaymentMethod(value) {
  if (value === "cash") {
    return "cash";
  }

  return "bank_transfer";
}

function isProductActuallySoldOut(product) {
  if (product.soldOut) {
    return true;
  }

  return (product.sizes || []).every(function (size) {
    return Number(product.remainingStock[size] || 0) <= 0;
  });
}

function sortByDefaultProducts(products) {
  const orderMap = DEFAULT_PRODUCTS.reduce(function (map, product, index) {
    map[product.id] = index;
    return map;
  }, {});

  return products.slice().sort(function (left, right) {
    const leftIndex = orderMap[left.id];
    const rightIndex = orderMap[right.id];

    if (leftIndex === undefined && rightIndex === undefined) {
      return left.name.localeCompare(right.name, "ko-KR");
    }

    if (leftIndex === undefined) {
      return 1;
    }

    if (rightIndex === undefined) {
      return -1;
    }

    return leftIndex - rightIndex;
  });
}

async function ensureProductsSeeded() {
  const db = getFirestore();
  const snapshot = await db.collection("products").limit(1).get();

  if (!snapshot.empty) {
    return;
  }

  const batch = db.batch();
  DEFAULT_PRODUCTS.forEach(function (product) {
    batch.set(db.collection("products").doc(product.id), clone(product));
  });
  await batch.commit();
}

function getDefaultAuthSettings() {
  return {
    adminPassword: getAdminPassword(),
    superAdminPassword: getSuperAdminPassword(),
    shopAccessPassword: getShopAccessPassword(),
    updatedAt: new Date().toISOString()
  };
}

async function ensureAuthSettingsSeeded() {
  const db = getFirestore();
  const settingsRef = db.collection("settings").doc(AUTH_SETTINGS_DOC_ID);
  const snapshot = await settingsRef.get();

  if (snapshot.exists) {
    return;
  }

  await settingsRef.set(getDefaultAuthSettings());
}

async function getAuthSettings() {
  await ensureAuthSettingsSeeded();
  const db = getFirestore();
  const snapshot = await db.collection("settings").doc(AUTH_SETTINGS_DOC_ID).get();
  const data = snapshot.exists ? snapshot.data() : {};
  const defaults = getDefaultAuthSettings();

  return {
    adminPassword: data.adminPassword || defaults.adminPassword,
    superAdminPassword: data.superAdminPassword || defaults.superAdminPassword,
    shopAccessPassword: data.shopAccessPassword || defaults.shopAccessPassword,
    updatedAt: data.updatedAt || defaults.updatedAt
  };
}

async function updateAuthSettings(nextValues) {
  const current = await getAuthSettings();
  const db = getFirestore();
  const settingsRef = db.collection("settings").doc(AUTH_SETTINGS_DOC_ID);

  const updated = {
    adminPassword: typeof nextValues.adminPassword === "string" && nextValues.adminPassword.trim()
      ? nextValues.adminPassword.trim()
      : current.adminPassword,
    superAdminPassword: typeof nextValues.superAdminPassword === "string" && nextValues.superAdminPassword.trim()
      ? nextValues.superAdminPassword.trim()
      : current.superAdminPassword,
    shopAccessPassword: typeof nextValues.shopAccessPassword === "string" && nextValues.shopAccessPassword.trim()
      ? nextValues.shopAccessPassword.trim()
      : current.shopAccessPassword,
    updatedAt: new Date().toISOString()
  };

  await settingsRef.set(updated, { merge: true });
  return updated;
}

async function getProducts() {
  await ensureProductsSeeded();
  const db = getFirestore();
  const snapshot = await db.collection("products").get();
  return sortByDefaultProducts(snapshot.docs.map(function (doc) {
    return doc.data();
  }));
}

async function getOrders() {
  const db = getFirestore();
  const snapshot = await db.collection("orders").orderBy("createdAt", "desc").get();
  return snapshot.docs.map(function (doc) {
    return doc.data();
  });
}

async function getPendingOrders() {
  const db = getFirestore();
  const snapshot = await db.collection("pendingOrders").orderBy("createdAt", "desc").get();
  return snapshot.docs.map(function (doc) {
    return doc.data();
  });
}

async function getDeletedOrders() {
  const db = getFirestore();
  const snapshot = await db.collection("deletedOrders").orderBy("deletedAt", "desc").get();
  return snapshot.docs.map(function (doc) {
    return doc.data();
  });
}

async function getDashboardData() {
  await ensureProductsSeeded();
  const [products, pendingOrders, orders, deletedOrders] = await Promise.all([
    getProducts(),
    getPendingOrders(),
    getOrders(),
    getDeletedOrders()
  ]);

  return {
    products,
    pendingOrders,
    orders,
    deletedOrders
  };
}

async function createPendingOrder(orderInput) {
  const items = Array.isArray(orderInput.items) ? orderInput.items : [];
  const paymentMethod = normalizePaymentMethod(orderInput.paymentMethod);

  if (!items.length) {
    throw new Error("주문할 상품이 없습니다.");
  }

  await ensureProductsSeeded();
  const db = getFirestore();
  const orderId = generateId("order");
  const now = new Date().toISOString();

  const pendingOrder = await db.runTransaction(async function (transaction) {
    const productRefs = Array.from(new Set(items.map(function (item) {
      return item.productId;
    }))).map(function (productId) {
      return db.collection("products").doc(productId);
    });

    const productDocs = await Promise.all(productRefs.map(function (ref) {
      return transaction.get(ref);
    }));

    const productMap = productDocs.reduce(function (map, doc) {
      if (doc.exists) {
        map[doc.id] = doc.data();
      }
      return map;
    }, {});

    const normalizedItems = items.map(function (item) {
      const product = productMap[item.productId];

      if (!product) {
        throw new Error("주문 상품을 찾을 수 없습니다.");
      }

      const size = String(item.size || "").trim();
      const quantity = Math.max(1, Number(item.quantity || 1));
      const available = Number(product.remainingStock[size] || 0);

      if (!product.sizes.includes(size)) {
        throw new Error("선택한 옵션이 유효하지 않습니다.");
      }

      if (isProductActuallySoldOut(product)) {
        throw new Error("품절된 상품은 주문할 수 없습니다.");
      }

      if (available < quantity) {
        throw new Error("주문 수량보다 재고가 부족합니다.");
      }

      product.remainingStock[size] = available - quantity;
      product.soldOut = isProductActuallySoldOut(product);

      return {
        productId: product.id,
        productName: product.name,
        size: size,
        quantity: quantity,
        unitPrice: Number(product.price || 0),
        totalPrice: Number(product.price || 0) * quantity
      };
    });

    Object.keys(productMap).forEach(function (productId) {
      transaction.set(db.collection("products").doc(productId), productMap[productId]);
    });

    const nextPendingOrder = {
      id: orderId,
      items: normalizedItems,
      paymentMethod: paymentMethod,
      totalQuantity: normalizedItems.reduce(function (sum, item) {
        return sum + item.quantity;
      }, 0),
      totalPrice: normalizedItems.reduce(function (sum, item) {
        return sum + item.totalPrice;
      }, 0),
      status: "확정 대기",
      randomCode: generateRandomCode(),
      buyerConfirmationCode: generateRandomCode(),
      createdAt: now
    };

    transaction.set(db.collection("pendingOrders").doc(orderId), nextPendingOrder);
    return nextPendingOrder;
  });

  return {
    pendingOrder,
    products: await getProducts()
  };
}

async function confirmPendingOrder(orderId, adminCode) {
  const db = getFirestore();

  const approvedOrder = await db.runTransaction(async function (transaction) {
    const pendingOrderRef = db.collection("pendingOrders").doc(orderId);
    const pendingOrderDoc = await transaction.get(pendingOrderRef);

    if (!pendingOrderDoc.exists) {
      throw new Error("확정 대기 주문을 찾을 수 없습니다.");
    }

    const pendingOrder = pendingOrderDoc.data();

    if (String(adminCode || "").trim() !== pendingOrder.randomCode) {
      throw new Error("관리자 확인 번호가 일치하지 않습니다.");
    }

    const order = {
      id: pendingOrder.id,
      items: clone(pendingOrder.items),
      paymentMethod: normalizePaymentMethod(pendingOrder.paymentMethod),
      totalQuantity: pendingOrder.totalQuantity,
      totalPrice: pendingOrder.totalPrice,
      status: "처리 대기",
      randomCode: pendingOrder.randomCode,
      buyerConfirmationCode: pendingOrder.buyerConfirmationCode,
      createdAt: pendingOrder.createdAt
    };

    transaction.set(db.collection("orders").doc(orderId), order);
    transaction.delete(pendingOrderRef);
    return order;
  });

  return {
    order: approvedOrder,
    products: await getProducts()
  };
}

async function deletePendingOrder(orderId) {
  const db = getFirestore();

  await db.runTransaction(async function (transaction) {
    const pendingOrderRef = db.collection("pendingOrders").doc(orderId);
    const pendingOrderDoc = await transaction.get(pendingOrderRef);

    if (!pendingOrderDoc.exists) {
      return;
    }

    const pendingOrder = pendingOrderDoc.data();
    const productRefs = Array.from(new Set((pendingOrder.items || []).map(function (item) {
      return item.productId;
    }))).map(function (productId) {
      return db.collection("products").doc(productId);
    });

    const productDocs = await Promise.all(productRefs.map(function (ref) {
      return transaction.get(ref);
    }));

    const productMap = productDocs.reduce(function (map, doc) {
      if (doc.exists) {
        map[doc.id] = doc.data();
      }
      return map;
    }, {});

    (pendingOrder.items || []).forEach(function (item) {
      const product = productMap[item.productId];
      if (!product) {
        return;
      }

      product.remainingStock[item.size] = Number(product.remainingStock[item.size] || 0) + Number(item.quantity || 0);
      product.soldOut = isProductActuallySoldOut(product);
    });

    Object.keys(productMap).forEach(function (productId) {
      transaction.set(db.collection("products").doc(productId), productMap[productId]);
    });

    transaction.delete(pendingOrderRef);
  });

  return {
    products: await getProducts()
  };
}

async function updateOrderStatus(orderId, nextStatus) {
  const db = getFirestore();
  const orderRef = db.collection("orders").doc(orderId);
  const orderDoc = await orderRef.get();

  if (!orderDoc.exists) {
    throw new Error("주문을 찾을 수 없습니다.");
  }

  await orderRef.update({
    status: nextStatus
  });

  return Object.assign({}, orderDoc.data(), {
    status: nextStatus
  });
}

async function deleteOrder(orderId) {
  const db = getFirestore();

  await db.runTransaction(async function (transaction) {
    const orderRef = db.collection("orders").doc(orderId);
    const orderDoc = await transaction.get(orderRef);

    if (!orderDoc.exists) {
      throw new Error("주문을 찾을 수 없습니다.");
    }

    const order = orderDoc.data();
    transaction.set(db.collection("deletedOrders").doc(orderId), Object.assign({}, order, {
      deletedAt: new Date().toISOString()
    }));
    transaction.delete(orderRef);
  });

  return true;
}

async function restoreDeletedOrder(orderId) {
  const db = getFirestore();

  await db.runTransaction(async function (transaction) {
    const deletedOrderRef = db.collection("deletedOrders").doc(orderId);
    const deletedOrderDoc = await transaction.get(deletedOrderRef);

    if (!deletedOrderDoc.exists) {
      throw new Error("삭제된 주문을 찾을 수 없습니다.");
    }

    const deletedOrder = clone(deletedOrderDoc.data());
    delete deletedOrder.deletedAt;

    transaction.set(db.collection("orders").doc(orderId), deletedOrder);
    transaction.delete(deletedOrderRef);
  });

  return true;
}

async function setProductStock(productId, size, nextRemainingStock) {
  const db = getFirestore();

  const updatedProduct = await db.runTransaction(async function (transaction) {
    const productRef = db.collection("products").doc(productId);
    const productDoc = await transaction.get(productRef);

    if (!productDoc.exists) {
      throw new Error("상품을 찾을 수 없습니다.");
    }

    const product = productDoc.data();

    if (!(product.sizes || []).includes(size)) {
      throw new Error("선택한 옵션이 유효하지 않습니다.");
    }

    const currentRemaining = Number(product.remainingStock[size] || 0);
    const currentInitial = Number(product.initialStock[size] || 0);
    const safeNextRemaining = Math.max(0, Number(nextRemainingStock || 0));
    const delta = safeNextRemaining - currentRemaining;

    product.remainingStock[size] = safeNextRemaining;
    product.initialStock[size] = Math.max(0, currentInitial + delta);
    product.soldOut = isProductActuallySoldOut(product);

    transaction.set(productRef, product);
    return product;
  });

  return updatedProduct;
}

async function resetInventory() {
  const db = getFirestore();
  const products = await getProducts();
  const batch = db.batch();

  products.forEach(function (product) {
    batch.set(db.collection("products").doc(product.id), Object.assign({}, product, {
      remainingStock: clone(product.initialStock),
      soldOut: false
    }));
  });

  await batch.commit();
  return getProducts();
}

async function clearCollection(collectionName) {
  const db = getFirestore();
  const snapshot = await db.collection(collectionName).get();

  if (snapshot.empty) {
    return;
  }

  const batch = db.batch();
  snapshot.docs.forEach(function (doc) {
    batch.delete(doc.ref);
  });
  await batch.commit();
}

async function resetOrders() {
  await Promise.all([
    clearCollection("orders"),
    clearCollection("pendingOrders"),
    clearCollection("deletedOrders")
  ]);
  return true;
}

async function resetProducts() {
  const db = getFirestore();
  await clearCollection("products");
  const batch = db.batch();
  DEFAULT_PRODUCTS.forEach(function (product) {
    batch.set(db.collection("products").doc(product.id), clone(product));
  });
  await batch.commit();
  return getProducts();
}

async function resetAllData() {
  await resetOrders();
  await resetProducts();
  const db = getFirestore();
  await db.collection("settings").doc(AUTH_SETTINGS_DOC_ID).set(getDefaultAuthSettings());
  return true;
}

module.exports = {
  getAuthSettings,
  createPendingOrder,
  confirmPendingOrder,
  deleteOrder,
  deletePendingOrder,
  generateRandomCode,
  getDashboardData,
  getDeletedOrders,
  getOrders,
  getPendingOrders,
  getProducts,
  isProductActuallySoldOut,
  resetAllData,
  resetInventory,
  resetOrders,
  resetProducts,
  restoreDeletedOrder,
  setProductStock,
  updateAuthSettings,
  updateOrderStatus
};
