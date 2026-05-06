/*
  데이터 관리 전용 파일
  - 현재는 localStorage를 사용합니다.
  - 추후 Supabase, Firebase, MySQL, MongoDB 등으로 교체할 때는
    이 파일의 조회/저장 함수만 DB 호출로 바꾸면 됩니다.
*/

(function () {
  const STORAGE_KEYS = {
    products: "goods-shop-products",
    orders: "goods-shop-orders",
    pendingOrders: "goods-shop-pending-orders",
    deletedOrders: "goods-shop-deleted-orders",
    adminPassword: "goods-shop-admin-password",
    superAdminPassword: "goods-shop-super-admin-password",
    shopPassword: "goods-shop-shop-password",
    orderSchemaVersion: "goods-shop-order-schema-version",
    productSchemaVersion: "goods-shop-product-schema-version"
  };

  const DEFAULT_ADMIN_PASSWORD = "admin1234";
  const DEFAULT_SUPER_ADMIN_PASSWORD = "super1234";
  const DEFAULT_SHOP_PASSWORD = "festival2026";
  const ORDER_SCHEMA_VERSION = "5";
  const PRODUCT_SCHEMA_VERSION = "5";

  function clone(data) {
    return JSON.parse(JSON.stringify(data));
  }

  function buildStockMap(sizes, quantity) {
    return sizes.reduce(function (stockMap, size) {
      stockMap[size] = quantity;
      return stockMap;
    }, {});
  }

  const DEFAULT_PRODUCTS = [
    {
      id: "product-basketball",
      name: "농구 유니폼",
      price: 38000,
      imageUrl: "pic/농구.png",
      sizes: ["XS", "S", "M", "L", "XL", "2XL", "3XL"],
      initialStock: buildStockMap(["XS", "S", "M", "L", "XL", "2XL", "3XL"], 10),
      remainingStock: buildStockMap(["XS", "S", "M", "L", "XL", "2XL", "3XL"], 10),
      soldOut: false
    },
    {
      id: "product-baseball-white",
      name: "야구 유니폼 (WHITE)",
      price: 40000,
      imageUrl: "pic/야구화이트.png",
      sizes: ["S", "M", "L", "XL", "2XL", "3XL"],
      initialStock: buildStockMap(["S", "M", "L", "XL", "2XL", "3XL"], 10),
      remainingStock: buildStockMap(["S", "M", "L", "XL", "2XL", "3XL"], 10),
      soldOut: false
    },
    {
      id: "product-baseball-blue",
      name: "야구 유니폼 (BLUE)",
      price: 40000,
      imageUrl: "pic/야구블루.png",
      sizes: ["S", "M", "L", "XL", "2XL", "3XL"],
      initialStock: buildStockMap(["S", "M", "L", "XL", "2XL", "3XL"], 10),
      remainingStock: buildStockMap(["S", "M", "L", "XL", "2XL", "3XL"], 10),
      soldOut: false
    },
    {
      id: "product-hockey",
      name: "하키 유니폼",
      price: 42000,
      imageUrl: "pic/하키.png",
      sizes: ["XS", "S", "M", "L", "XL", "2XL", "3XL"],
      initialStock: buildStockMap(["XS", "S", "M", "L", "XL", "2XL", "3XL"], 10),
      remainingStock: buildStockMap(["XS", "S", "M", "L", "XL", "2XL", "3XL"], 10),
      soldOut: false
    },
    {
      id: "product-tshirt-1",
      name: "티셔츠 1",
      price: 20000,
      imageUrl: "pic/티셔츠1.png",
      sizes: ["S", "M", "L", "XL", "2XL", "3XL"],
      initialStock: buildStockMap(["S", "M", "L", "XL", "2XL", "3XL"], 12),
      remainingStock: buildStockMap(["S", "M", "L", "XL", "2XL", "3XL"], 12),
      soldOut: false
    },
    {
      id: "product-tshirt-2",
      name: "티셔츠 2",
      price: 26000,
      imageUrl: "pic/티셔츠2.png",
      sizes: ["XS", "S", "M", "L", "XL", "2XL", "3XL", "4XL"],
      initialStock: buildStockMap(["XS", "S", "M", "L", "XL", "2XL", "3XL", "4XL"], 12),
      remainingStock: buildStockMap(["XS", "S", "M", "L", "XL", "2XL", "3XL", "4XL"], 12),
      soldOut: false
    },
    {
      id: "product-denim-bag",
      name: "데님백",
      price: 20000,
      imageUrl: "pic/데님백.png",
      sizes: ["FREE"],
      initialStock: { FREE: 30 },
      remainingStock: { FREE: 30 },
      soldOut: false
    },
    {
      id: "product-bandana",
      name: "반다나",
      price: 6000,
      imageUrl: "pic/반다나.png",
      sizes: ["FREE"],
      initialStock: { FREE: 35 },
      remainingStock: { FREE: 35 },
      soldOut: false
    },
    {
      id: "product-slogan",
      name: "슬로건",
      price: 7000,
      imageUrl: "pic/슬로건.png",
      sizes: ["FREE"],
      initialStock: { FREE: 40 },
      remainingStock: { FREE: 40 },
      soldOut: false
    },
    {
      id: "product-carabiner",
      name: "카라비너",
      price: 9000,
      imageUrl: "pic/카라비너.png",
      sizes: ["별", "사자(남색)", "사자(회색)", "사자(하늘색)"],
      initialStock: buildStockMap(["별", "사자(남색)", "사자(회색)", "사자(하늘색)"], 30),
      remainingStock: buildStockMap(["별", "사자(남색)", "사자(회색)", "사자(하늘색)"], 30),
      soldOut: false
    },
    {
      id: "product-tattoo-sticker",
      name: "타투 스티커",
      price: 4000,
      imageUrl: "pic/타투스티커.png",
      sizes: ["왼쪽", "오른쪽"],
      initialStock: buildStockMap(["왼쪽", "오른쪽"], 30),
      remainingStock: buildStockMap(["왼쪽", "오른쪽"], 30),
      soldOut: false
    },
    {
      id: "product-pan-sticker",
      name: "판 스티커",
      price: 3000,
      imageUrl: "pic/판스티커.png",
      sizes: ["왼쪽", "오른쪽"],
      initialStock: buildStockMap(["왼쪽", "오른쪽"], 30),
      remainingStock: buildStockMap(["왼쪽", "오른쪽"], 30),
      soldOut: false
    }
  ];

  function readJSON(key, fallbackValue) {
    const raw = localStorage.getItem(key);
    if (!raw) {
      return clone(fallbackValue);
    }

    try {
      return JSON.parse(raw);
    } catch (error) {
      console.error("localStorage 데이터를 읽는 중 오류가 발생했습니다.", error);
      return clone(fallbackValue);
    }
  }

  function writeJSON(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function mergeCatalogWithDefaults(storedProducts) {
    const nextProducts = DEFAULT_PRODUCTS.map(function (defaultProduct) {
      const existingProduct = (storedProducts || []).find(function (product) {
        return product.id === defaultProduct.id;
      });

      if (!existingProduct) {
        return clone(defaultProduct);
      }

      const initialStock = {};
      const remainingStock = {};

      defaultProduct.sizes.forEach(function (size) {
        initialStock[size] = Number(
          existingProduct.initialStock && existingProduct.initialStock[size] !== undefined
            ? existingProduct.initialStock[size]
            : defaultProduct.initialStock[size] || 0
        );

        remainingStock[size] = Number(
          existingProduct.remainingStock && existingProduct.remainingStock[size] !== undefined
            ? existingProduct.remainingStock[size]
            : defaultProduct.remainingStock[size] || 0
        );
      });

      return {
        id: defaultProduct.id,
        name: defaultProduct.name,
        price: defaultProduct.price,
        imageUrl: defaultProduct.imageUrl,
        sizes: clone(defaultProduct.sizes),
        initialStock: initialStock,
        remainingStock: remainingStock,
        soldOut: Boolean(existingProduct.soldOut)
      };
    });

    const customProducts = (storedProducts || []).filter(function (storedProduct) {
      return !DEFAULT_PRODUCTS.some(function (defaultProduct) {
        return defaultProduct.id === storedProduct.id;
      });
    });

    return nextProducts.concat(customProducts);
  }

  function ensureDefaults() {
    if (!localStorage.getItem(STORAGE_KEYS.products)) {
      writeJSON(STORAGE_KEYS.products, DEFAULT_PRODUCTS);
    } else {
      const storedProducts = readJSON(STORAGE_KEYS.products, DEFAULT_PRODUCTS);
      writeJSON(STORAGE_KEYS.products, mergeCatalogWithDefaults(storedProducts));
    }

    if (!localStorage.getItem(STORAGE_KEYS.orders)) {
      writeJSON(STORAGE_KEYS.orders, []);
    }

    if (!localStorage.getItem(STORAGE_KEYS.pendingOrders)) {
      writeJSON(STORAGE_KEYS.pendingOrders, []);
    }

    if (!localStorage.getItem(STORAGE_KEYS.deletedOrders)) {
      writeJSON(STORAGE_KEYS.deletedOrders, []);
    }

    if (!localStorage.getItem(STORAGE_KEYS.adminPassword)) {
      localStorage.setItem(STORAGE_KEYS.adminPassword, DEFAULT_ADMIN_PASSWORD);
    }

    if (!localStorage.getItem(STORAGE_KEYS.superAdminPassword)) {
      localStorage.setItem(STORAGE_KEYS.superAdminPassword, DEFAULT_SUPER_ADMIN_PASSWORD);
    }

    if (!localStorage.getItem(STORAGE_KEYS.shopPassword)) {
      localStorage.setItem(STORAGE_KEYS.shopPassword, DEFAULT_SHOP_PASSWORD);
    }

    if (localStorage.getItem(STORAGE_KEYS.orderSchemaVersion) !== ORDER_SCHEMA_VERSION) {
      writeJSON(STORAGE_KEYS.orders, []);
      writeJSON(STORAGE_KEYS.pendingOrders, []);
      writeJSON(STORAGE_KEYS.deletedOrders, []);
      localStorage.setItem(STORAGE_KEYS.orderSchemaVersion, ORDER_SCHEMA_VERSION);
    }

    if (localStorage.getItem(STORAGE_KEYS.productSchemaVersion) !== PRODUCT_SCHEMA_VERSION) {
      writeJSON(STORAGE_KEYS.products, DEFAULT_PRODUCTS);
      localStorage.setItem(STORAGE_KEYS.productSchemaVersion, PRODUCT_SCHEMA_VERSION);
    }
  }

  function generateId(prefix) {
    return prefix + "-" + Date.now() + "-" + Math.random().toString(36).slice(2, 8);
  }

  function generateRandomCode() {
    return String(Math.floor(100000 + Math.random() * 900000));
  }

  function getProducts() {
    ensureDefaults();
    return readJSON(STORAGE_KEYS.products, DEFAULT_PRODUCTS);
  }

  function saveProducts(products) {
    // DB 연결 지점 예시:
    // await db.products.upsert(products)
    writeJSON(STORAGE_KEYS.products, products);
  }

  function getOrders() {
    ensureDefaults();
    return readJSON(STORAGE_KEYS.orders, []);
  }

  function saveOrders(orders) {
    // DB 연결 지점 예시:
    // await db.orders.upsert(orders)
    writeJSON(STORAGE_KEYS.orders, orders);
  }

  function getPendingOrders() {
    ensureDefaults();
    return readJSON(STORAGE_KEYS.pendingOrders, []);
  }

  function savePendingOrders(pendingOrders) {
    // DB 연결 지점 예시:
    // await db.pendingOrders.upsert(pendingOrders)
    writeJSON(STORAGE_KEYS.pendingOrders, pendingOrders);
  }

  function getDeletedOrders() {
    ensureDefaults();
    return readJSON(STORAGE_KEYS.deletedOrders, []);
  }

  function saveDeletedOrders(deletedOrders) {
    // DB 연결 지점 예시:
    // await db.deletedOrders.upsert(deletedOrders)
    writeJSON(STORAGE_KEYS.deletedOrders, deletedOrders);
  }

  function isProductActuallySoldOut(product) {
    if (product.soldOut) {
      return true;
    }

    return (product.sizes || []).every(function (size) {
      return Number(product.remainingStock[size] || 0) <= 0;
    });
  }

  function normalizeStockBySizes(sourceStock, sizes) {
    return sizes.reduce(function (stockMap, size) {
      stockMap[size] = Math.max(0, Number(sourceStock[size] || 0));
      return stockMap;
    }, {});
  }

  function normalizeProduct(productInput) {
    const sizes = Array.from(new Set(
      (productInput.sizes || []).map(function (size) {
        return String(size).trim();
      }).filter(Boolean)
    ));

    const initialStockSource = productInput.initialStock || {};
    const remainingStockSource = productInput.remainingStock || initialStockSource;

    return {
      id: productInput.id || generateId("product"),
      name: String(productInput.name || "").trim(),
      price: Math.max(0, Number(productInput.price || 0)),
      imageUrl: String(productInput.imageUrl || "").trim(),
      sizes: sizes,
      initialStock: normalizeStockBySizes(initialStockSource, sizes),
      remainingStock: normalizeStockBySizes(remainingStockSource, sizes),
      soldOut: Boolean(productInput.soldOut)
    };
  }

  function buildOrderRecord(items, orderInput, status) {
    return {
      id: generateId("order"),
      items: items,
      totalQuantity: items.reduce(function (sum, item) {
        return sum + item.quantity;
      }, 0),
      totalPrice: items.reduce(function (sum, item) {
        return sum + item.totalPrice;
      }, 0),
      status: status,
      randomCode: orderInput.randomCode || generateRandomCode(),
      buyerConfirmationCode: orderInput.buyerConfirmationCode || generateRandomCode(),
      createdAt: orderInput.createdAt || new Date().toISOString()
    };
  }

  function reserveOrderItems(items) {
    const products = clone(getProducts());

    const normalizedItems = items.map(function (item) {
      const product = products.find(function (candidate) {
        return candidate.id === item.productId;
      });

      if (!product) {
        throw new Error("주문할 상품을 찾을 수 없습니다.");
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

      return {
        productId: product.id,
        productName: product.name,
        size: size,
        quantity: quantity,
        unitPrice: product.price,
        totalPrice: product.price * quantity
      };
    });

    saveProducts(products);
    return normalizedItems;
  }

  function restoreOrderItems(items) {
    const products = clone(getProducts());

    (items || []).forEach(function (item) {
      const product = products.find(function (candidate) {
        return candidate.id === item.productId;
      });

      if (!product || !product.sizes.includes(item.size)) {
        return;
      }

      product.remainingStock[item.size] = Number(product.remainingStock[item.size] || 0) + Number(item.quantity || 0);
    });

    saveProducts(products);
    return products;
  }

  function createPendingOrder(orderInput) {
    const items = Array.isArray(orderInput.items) ? orderInput.items : [];
    if (!items.length) {
      throw new Error("주문할 상품이 없습니다.");
    }

    const reservedItems = reserveOrderItems(items);
    const pendingOrder = buildOrderRecord(reservedItems, orderInput, "확정 대기");
    const pendingOrders = getPendingOrders();
    pendingOrders.unshift(pendingOrder);
    savePendingOrders(pendingOrders);
    return pendingOrder;
  }

  function confirmPendingOrder(pendingOrderId, adminCode) {
    const pendingOrders = getPendingOrders();
    const index = pendingOrders.findIndex(function (order) {
      return order.id === pendingOrderId;
    });

    if (index === -1) {
      throw new Error("확정 대기 주문을 찾을 수 없습니다.");
    }

    const pendingOrder = pendingOrders[index];
    if (String(adminCode).trim() !== pendingOrder.randomCode) {
      throw new Error("관리자 확인 번호가 일치하지 않습니다.");
    }

    const approvedOrder = {
      id: pendingOrder.id,
      items: clone(pendingOrder.items),
      totalQuantity: pendingOrder.totalQuantity,
      totalPrice: pendingOrder.totalPrice,
      status: "처리 대기",
      randomCode: pendingOrder.randomCode,
      buyerConfirmationCode: pendingOrder.buyerConfirmationCode,
      createdAt: pendingOrder.createdAt
    };

    pendingOrders.splice(index, 1);
    savePendingOrders(pendingOrders);

    const orders = getOrders();
    orders.unshift(approvedOrder);
    saveOrders(orders);

    return approvedOrder;
  }

  function createOrder(orderInput) {
    return createPendingOrder(orderInput);
  }

  function updateInventory(productId, size, quantity) {
    const products = clone(getProducts());
    const product = products.find(function (item) {
      return item.id === productId;
    });

    if (!product) {
      throw new Error("상품을 찾을 수 없습니다.");
    }

    if (!product.sizes.includes(size)) {
      throw new Error("선택한 옵션이 유효하지 않습니다.");
    }

    if (product.soldOut) {
      throw new Error("현재 품절 처리된 상품입니다.");
    }

    const nextStock = Number(product.remainingStock[size] || 0) - Math.max(1, Number(quantity || 1));
    if (nextStock < 0) {
      throw new Error("재고가 부족합니다.");
    }

    product.remainingStock[size] = nextStock;
    saveProducts(products);
    return product;
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

  function addProduct(productInput) {
    const products = getProducts();
    const normalized = normalizeProduct(productInput);
    products.push(normalized);
    saveProducts(products);
    return normalized;
  }

  function updateProduct(productId, updates) {
    const products = getProducts();
    const index = products.findIndex(function (product) {
      return product.id === productId;
    });

    if (index === -1) {
      throw new Error("수정할 상품을 찾을 수 없습니다.");
    }

    const current = products[index];
    const normalized = normalizeProduct({
      id: current.id,
      name: updates.name !== undefined ? updates.name : current.name,
      price: updates.price !== undefined ? updates.price : current.price,
      imageUrl: updates.imageUrl !== undefined ? updates.imageUrl : current.imageUrl,
      sizes: updates.sizes !== undefined ? updates.sizes : current.sizes,
      initialStock: updates.initialStock !== undefined ? updates.initialStock : current.initialStock,
      remainingStock: updates.remainingStock !== undefined ? updates.remainingStock : current.remainingStock,
      soldOut: updates.soldOut !== undefined ? updates.soldOut : current.soldOut
    });

    products[index] = normalized;
    saveProducts(products);
    return normalized;
  }

  function deleteProduct(productId) {
    const nextProducts = getProducts().filter(function (product) {
      return product.id !== productId;
    });
    saveProducts(nextProducts);
    return nextProducts;
  }

  function updateOrderStatus(orderId, nextStatus) {
    const orders = getOrders();
    const order = orders.find(function (item) {
      return item.id === orderId;
    });

    if (!order) {
      throw new Error("주문을 찾을 수 없습니다.");
    }

    order.status = nextStatus;
    saveOrders(orders);
    return order;
  }

  function deleteOrder(orderId) {
    const orders = getOrders();
    const targetOrder = orders.find(function (order) {
      return order.id === orderId;
    });
    const nextOrders = orders.filter(function (order) {
      return order.id !== orderId;
    });

    if (targetOrder) {
      const deletedOrders = getDeletedOrders();
      deletedOrders.unshift(Object.assign({}, clone(targetOrder), {
        deletedAt: new Date().toISOString()
      }));
      saveDeletedOrders(deletedOrders);
    }

    saveOrders(nextOrders);
    return nextOrders;
  }

  function restoreDeletedOrder(orderId) {
    const deletedOrders = getDeletedOrders();
    const targetOrder = deletedOrders.find(function (order) {
      return order.id === orderId;
    });

    if (!targetOrder) {
      throw new Error("삭제된 주문을 찾을 수 없습니다.");
    }

    const nextDeletedOrders = deletedOrders.filter(function (order) {
      return order.id !== orderId;
    });
    saveDeletedOrders(nextDeletedOrders);

    const restoredOrder = clone(targetOrder);
    delete restoredOrder.deletedAt;

    const orders = getOrders();
    orders.unshift(restoredOrder);
    saveOrders(orders);
    return restoredOrder;
  }

  function deletePendingOrder(orderId) {
    const pendingOrders = getPendingOrders();
    const targetOrder = pendingOrders.find(function (order) {
      return order.id === orderId;
    });

    if (targetOrder) {
      restoreOrderItems(targetOrder.items);
    }

    const nextPendingOrders = pendingOrders.filter(function (order) {
      return order.id !== orderId;
    });
    savePendingOrders(nextPendingOrders);
    return nextPendingOrders;
  }

  function setProductStock(productId, size, nextRemainingStock) {
    const products = clone(getProducts());
    const product = products.find(function (item) {
      return item.id === productId;
    });

    if (!product) {
      throw new Error("상품을 찾을 수 없습니다.");
    }

    if (!product.sizes.includes(size)) {
      throw new Error("선택한 옵션이 유효하지 않습니다.");
    }

    const currentRemaining = Number(product.remainingStock[size] || 0);
    const currentInitial = Number(product.initialStock[size] || 0);
    const safeNextRemaining = Math.max(0, Number(nextRemainingStock || 0));
    const delta = safeNextRemaining - currentRemaining;

    product.remainingStock[size] = safeNextRemaining;
    product.initialStock[size] = Math.max(0, currentInitial + delta);
    saveProducts(products);
    return product;
  }

  function adjustProductStock(productId, size, delta) {
    const products = getProducts();
    const product = products.find(function (item) {
      return item.id === productId;
    });

    if (!product) {
      throw new Error("상품을 찾을 수 없습니다.");
    }

    const currentRemaining = Number(product.remainingStock[size] || 0);
    return setProductStock(productId, size, currentRemaining + Number(delta || 0));
  }

  function resetOrders() {
    saveOrders([]);
    savePendingOrders([]);
    saveDeletedOrders([]);
  }

  function resetProducts() {
    saveProducts(clone(DEFAULT_PRODUCTS));
    localStorage.setItem(STORAGE_KEYS.productSchemaVersion, PRODUCT_SCHEMA_VERSION);
  }

  function resetInventory() {
    const products = getProducts().map(function (product) {
      return {
        id: product.id,
        name: product.name,
        price: product.price,
        imageUrl: product.imageUrl,
        sizes: clone(product.sizes),
        initialStock: clone(product.initialStock),
        remainingStock: clone(product.initialStock),
        soldOut: false
      };
    });

    saveProducts(products);
    return products;
  }

  function resetAllData() {
    resetProducts();
    resetOrders();
    localStorage.setItem(STORAGE_KEYS.adminPassword, DEFAULT_ADMIN_PASSWORD);
    localStorage.setItem(STORAGE_KEYS.superAdminPassword, DEFAULT_SUPER_ADMIN_PASSWORD);
    localStorage.setItem(STORAGE_KEYS.shopPassword, DEFAULT_SHOP_PASSWORD);
    localStorage.setItem(STORAGE_KEYS.orderSchemaVersion, ORDER_SCHEMA_VERSION);
    localStorage.setItem(STORAGE_KEYS.productSchemaVersion, PRODUCT_SCHEMA_VERSION);
  }

  function getAdminPassword() {
    ensureDefaults();
    return localStorage.getItem(STORAGE_KEYS.adminPassword) || DEFAULT_ADMIN_PASSWORD;
  }

  function setAdminPassword(password) {
    localStorage.setItem(STORAGE_KEYS.adminPassword, String(password));
  }

  function getSuperAdminPassword() {
    ensureDefaults();
    return localStorage.getItem(STORAGE_KEYS.superAdminPassword) || DEFAULT_SUPER_ADMIN_PASSWORD;
  }

  function setSuperAdminPassword(password) {
    localStorage.setItem(STORAGE_KEYS.superAdminPassword, String(password));
  }

  function getShopPassword() {
    ensureDefaults();
    return localStorage.getItem(STORAGE_KEYS.shopPassword) || DEFAULT_SHOP_PASSWORD;
  }

  function setShopPassword(password) {
    localStorage.setItem(STORAGE_KEYS.shopPassword, String(password));
  }

  function clearRevenueStatistics() {
    saveOrders([]);
    savePendingOrders([]);
    saveDeletedOrders([]);
  }

  ensureDefaults();

  window.GoodsData = {
    getProducts: getProducts,
    saveProducts: saveProducts,
    getOrders: getOrders,
    saveOrders: saveOrders,
    getPendingOrders: getPendingOrders,
    savePendingOrders: savePendingOrders,
    getDeletedOrders: getDeletedOrders,
    saveDeletedOrders: saveDeletedOrders,
    createOrder: createOrder,
    createPendingOrder: createPendingOrder,
    confirmPendingOrder: confirmPendingOrder,
    updateInventory: updateInventory,
    generateRandomCode: generateRandomCode,
    calculateRevenue: calculateRevenue,
    addProduct: addProduct,
    updateProduct: updateProduct,
    deleteProduct: deleteProduct,
    updateOrderStatus: updateOrderStatus,
    deleteOrder: deleteOrder,
    restoreDeletedOrder: restoreDeletedOrder,
    deletePendingOrder: deletePendingOrder,
    resetOrders: resetOrders,
    resetProducts: resetProducts,
    resetAllData: resetAllData,
    getAdminPassword: getAdminPassword,
    setAdminPassword: setAdminPassword,
    getSuperAdminPassword: getSuperAdminPassword,
    setSuperAdminPassword: setSuperAdminPassword,
    getShopPassword: getShopPassword,
    setShopPassword: setShopPassword,
    resetInventory: resetInventory,
    clearRevenueStatistics: clearRevenueStatistics,
    isProductActuallySoldOut: isProductActuallySoldOut,
    setProductStock: setProductStock,
    adjustProductStock: adjustProductStock
  };
})();
