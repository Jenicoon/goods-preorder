(function () {
  const accessModal = document.getElementById("superAdminAccessModal");
  const accessForm = document.getElementById("superAdminAccessForm");
  const accessPasswordInput = document.getElementById("superAdminAccessPasswordInput");
  const loginSection = document.getElementById("superAdminLoginSection");
  const dashboard = document.getElementById("superAdminDashboard");
  const loginForm = document.getElementById("superAdminLoginForm");
  const passwordInput = document.getElementById("superAdminPasswordInput");
  const logoutButton = document.getElementById("superAdminLogoutButton");
  const systemSummaryStats = document.getElementById("systemSummaryStats");
  const adminPasswordChangeForm = document.getElementById("adminPasswordChangeForm");
  const superPasswordChangeForm = document.getElementById("superPasswordChangeForm");
  const newAdminPasswordInput = document.getElementById("newAdminPasswordInput");
  const newSuperPasswordInput = document.getElementById("newSuperPasswordInput");
  const superPendingOrdersTableBody = document.getElementById("superPendingOrdersTableBody");
  const superOrdersTableBody = document.getElementById("superOrdersTableBody");
  const deletedOrdersTableBody = document.getElementById("deletedOrdersTableBody");
  const superInventoryTableBody = document.getElementById("superInventoryTableBody");
  const superProductManagerList = document.getElementById("superProductManagerList");
  const productFilterSelect = document.getElementById("productFilterSelect");
  const deleteCompletedOrdersButton = document.getElementById("deleteCompletedOrdersButton");
  const deleteAllOrdersButton = document.getElementById("deleteAllOrdersButton");
  const resetInventoryButton = document.getElementById("resetInventoryButton");
  const resetProductsButton = document.getElementById("resetProductsButton");
  const resetRevenueButton = document.getElementById("resetRevenueButton");
  const resetAllDataButton = document.getElementById("resetAllDataButton");

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

  async function loginWithPassword(password) {
    return request("/api/super-admin/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ password: password })
    });
  }

  async function checkSession() {
    const session = await request("/api/admin/session", {
      method: "GET"
    });

    if (session.role !== "super_admin") {
      throw new Error("슈퍼 관리자 권한이 필요합니다.");
    }

    return session;
  }

  async function logoutSession() {
    return request("/api/auth/logout", {
      method: "POST"
    });
  }

  function openModal(modal) {
    modal.classList.remove("is-hidden");
    modal.setAttribute("aria-hidden", "false");
  }

  function closeModal(modal) {
    modal.classList.add("is-hidden");
    modal.setAttribute("aria-hidden", "true");
  }

  function formatCurrency(value) {
    return new Intl.NumberFormat("ko-KR", {
      style: "currency",
      currency: "KRW",
      maximumFractionDigits: 0
    }).format(value);
  }

  function setLoggedIn(isLoggedIn) {
    loginSection.classList.toggle("is-hidden", isLoggedIn);
    dashboard.classList.toggle("is-hidden", !isLoggedIn);
  }

  function statCard(label, value) {
    return '<article class="stat-card"><span>' + label + "</span><strong>" + value + "</strong></article>";
  }

  function orderItemsHtml(items) {
    return (items || []).map(function (item) {
      return item.productName + " / " + item.size + " / " + item.quantity + "개";
    }).join("<br>");
  }

  function askDangerConfirm(message, action) {
    if (!confirm(message)) {
      return;
    }

    action();
    refresh();
  }

  function renderSummary() {
    const summary = GoodsData.calculateRevenue();
    systemSummaryStats.innerHTML = [
      statCard("전체 상품 수", summary.productCount + "개"),
      statCard("전체 주문 수", summary.totalOrders + "건"),
      statCard("총 판매 수익", formatCurrency(summary.totalRevenue)),
      statCard("총 판매 수량", summary.totalQuantity + "개"),
      statCard("품절 상품 수", summary.soldOutCount + "개"),
      statCard("확정 대기 주문", summary.waitingOrders + "건"),
      statCard("처리 대기 주문", summary.pendingOrders + "건"),
      statCard("처리 완료 주문", summary.completedOrders + "건"),
      statCard("삭제 보관 주문", summary.deletedOrders + "건")
    ].join("");
  }

  function renderPendingOrders() {
    const pendingOrders = GoodsData.getPendingOrders();
    superPendingOrdersTableBody.innerHTML = pendingOrders.map(function (order) {
      return [
        "<tr>",
        "<td>" + new Date(order.createdAt).toLocaleString("ko-KR") + "</td>",
        "<td>" + order.buyerConfirmationCode + "</td>",
        "<td>" + order.randomCode + "</td>",
        "<td>" + orderItemsHtml(order.items) + "</td>",
        "<td>" + order.totalQuantity + "개</td>",
        "<td>" + formatCurrency(order.totalPrice) + "</td>",
        '<td><div class="table-actions">',
        '<button class="secondary-button" type="button" data-action="show-buyer-code" data-code="' + order.buyerConfirmationCode + '">구매 번호</button>',
        '<button class="secondary-button" type="button" data-action="show-code" data-code="' + order.randomCode + '">확인 번호</button>',
        '<button class="danger-button" type="button" data-action="delete-pending" data-id="' + order.id + '">삭제</button>',
        "</div></td>",
        "</tr>"
      ].join("");
    }).join("");
  }

  function renderOrders() {
    const orders = GoodsData.getOrders();
    superOrdersTableBody.innerHTML = orders.map(function (order) {
      const isCompleted = order.status === "처리 완료";

      return [
        '<tr class="order-row' + (isCompleted ? " completed" : "") + '">',
        "<td>" + new Date(order.createdAt).toLocaleString("ko-KR") + "</td>",
        "<td>" + order.buyerConfirmationCode + "</td>",
        "<td>" + orderItemsHtml(order.items) + "</td>",
        "<td>" + order.totalQuantity + "개</td>",
        "<td>" + formatCurrency(order.totalPrice) + "</td>",
        '<td><span class="status-chip ' + (isCompleted ? "completed" : "pending") + '">' + order.status + "</span></td>",
        '<td><div class="table-actions">' +
          '<button class="secondary-button" type="button" data-action="show-code" data-code="' + order.buyerConfirmationCode + '">구매 번호</button>' +
          (isCompleted
            ? '<button class="secondary-button" type="button" disabled>처리 완료</button>'
            : '<button class="primary-button" type="button" data-action="complete-order" data-id="' + order.id + '">처리 완료</button>') +
          '<button class="danger-button" type="button" data-action="delete-order" data-id="' + order.id + '">삭제</button>' +
          "</div></td>",
        "</tr>"
      ].join("");
    }).join("");
  }

  function renderDeletedOrders() {
    const deletedOrders = GoodsData.getDeletedOrders();
    deletedOrdersTableBody.innerHTML = deletedOrders.map(function (order) {
      return [
        "<tr>",
        "<td>" + new Date(order.deletedAt).toLocaleString("ko-KR") + "</td>",
        "<td>" + order.buyerConfirmationCode + "</td>",
        "<td>" + orderItemsHtml(order.items) + "</td>",
        "<td>" + order.totalQuantity + "개</td>",
        "<td>" + formatCurrency(order.totalPrice) + "</td>",
        '<td><div class="table-actions">',
        '<button class="secondary-button" type="button" data-action="show-code" data-code="' + order.buyerConfirmationCode + '">구매 번호</button>',
        '<button class="primary-button" type="button" data-action="restore-order" data-id="' + order.id + '">복구</button>',
        "</div></td>",
        "</tr>"
      ].join("");
    }).join("");
  }

  function renderInventory() {
    const products = GoodsData.getProducts();
    superInventoryTableBody.innerHTML = products.map(function (product) {
      return product.sizes.map(function (size) {
        const initial = Number(product.initialStock[size] || 0);
        const remaining = Number(product.remainingStock[size] || 0);
        const sold = initial - remaining;
        const soldOut = product.soldOut || remaining <= 0;

        return [
          "<tr>",
          "<td>" + product.name + "</td>",
          "<td>" + size + "</td>",
          "<td>" + initial + "</td>",
          "<td>" + sold + "</td>",
          "<td>" + remaining + "</td>",
          '<td><span class="badge' + (soldOut ? " sold-out" : "") + '">' + (soldOut ? "품절" : "판매중") + "</span></td>",
          "</tr>"
        ].join("");
      }).join("");
    }).join("");
  }

  function renderProductFilter(products) {
    const currentValue = productFilterSelect.value || "all";
    productFilterSelect.innerHTML = ['<option value="all">전체 품목</option>'].concat(
      products.map(function (product) {
        return '<option value="' + product.id + '">' + product.name + "</option>";
      })
    ).join("");

    const nextValue = products.some(function (product) {
      return product.id === currentValue;
    }) ? currentValue : "all";
    productFilterSelect.value = nextValue;
  }

  function renderProductManager() {
    const products = GoodsData.getProducts();
    renderProductFilter(products);

    const selectedProductId = productFilterSelect.value || "all";
    const visibleProducts = selectedProductId === "all"
      ? products
      : products.filter(function (product) {
          return product.id === selectedProductId;
        });

    superProductManagerList.innerHTML = visibleProducts.map(function (product) {
      const stockRows = product.sizes.map(function (size) {
        const initial = Number(product.initialStock[size] || 0);
        const remaining = Number(product.remainingStock[size] || 0);
        const sold = initial - remaining;

        return [
          '<div class="manager-stock-row">',
          '<div class="manager-stock-meta">',
          "<strong>" + size + "</strong>",
          "<span>초기 " + initial + " / 판매 " + sold + " / 잔여 " + remaining + "</span>",
          "</div>",
          '<div class="manager-stock-controls">',
          '<button class="stepper-button" type="button" data-action="decrease-stock" data-id="' + product.id + '" data-size="' + size + '">-</button>',
          '<input class="stock-count-input" type="number" min="0" value="' + remaining + '" data-role="stock-input" data-id="' + product.id + '" data-size="' + size + '">',
          '<button class="stepper-button" type="button" data-action="increase-stock" data-id="' + product.id + '" data-size="' + size + '">+</button>',
          '<button class="secondary-button manager-apply-button" type="button" data-action="apply-stock" data-id="' + product.id + '" data-size="' + size + '">적용</button>',
          "</div>",
          "</div>"
        ].join("");
      }).join("");

      return [
        '<article class="panel product-manager-card">',
        '<div class="product-manager-head">',
        '<img class="product-manager-image" src="' + product.imageUrl + '" alt="' + product.name + '">',
        '<div class="product-manager-info">',
        '<div class="product-manager-summary">',
        "<strong>" + product.name + "</strong>",
        "<span>" + formatCurrency(product.price) + "</span>",
        "</div>",
        '<div class="manager-stock-list">' + stockRows + "</div>",
        "</div>",
        "</div>",
        "</article>"
      ].join("");
    }).join("");
  }

  function refresh() {
    renderSummary();
    renderPendingOrders();
    renderOrders();
    renderDeletedOrders();
    renderInventory();
    renderProductManager();
  }

  function applyStockFromInput(productId, size) {
    const input = superProductManagerList.querySelector('[data-role="stock-input"][data-id="' + productId + '"][data-size="' + size + '"]');
    if (!input) {
      return;
    }

    GoodsData.setProductStock(productId, size, Number(input.value || 0));
    refresh();
  }

  async function handleLogin(password) {
    await loginWithPassword(password);
    closeModal(accessModal);
    setLoggedIn(true);
    refresh();
  }

  async function initializeSuperAdminAccess() {
    setLoggedIn(false);

    try {
      await checkSession();
      closeModal(accessModal);
      setLoggedIn(true);
      refresh();
      return;
    } catch (error) {
      openModal(accessModal);
    }
  }

  accessForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    try {
      await handleLogin(accessPasswordInput.value);
      accessForm.reset();
    } catch (error) {
      alert(error.message || "슈퍼 관리자 입장 비밀번호가 올바르지 않습니다.");
      accessPasswordInput.select();
    }
  });

  loginForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    try {
      await handleLogin(passwordInput.value);
      loginForm.reset();
    } catch (error) {
      alert(error.message || "슈퍼 관리자 비밀번호가 올바르지 않습니다.");
      passwordInput.select();
    }
  });

  logoutButton.addEventListener("click", async function () {
    try {
      await logoutSession();
    } catch (error) {
      console.error(error);
    }

    loginForm.reset();
    accessForm.reset();
    setLoggedIn(false);
    openModal(accessModal);
  });

  adminPasswordChangeForm.addEventListener("submit", function (event) {
    event.preventDefault();
    GoodsData.setAdminPassword(newAdminPasswordInput.value);
    adminPasswordChangeForm.reset();
    alert("관리자 비밀번호가 변경되었습니다.");
  });

  superPasswordChangeForm.addEventListener("submit", function (event) {
    event.preventDefault();
    GoodsData.setSuperAdminPassword(newSuperPasswordInput.value);
    superPasswordChangeForm.reset();
    alert("슈퍼 관리자 비밀번호가 변경되었습니다.");
  });

  productFilterSelect.addEventListener("change", renderProductManager);

  superPendingOrdersTableBody.addEventListener("click", function (event) {
    const target = event.target;
    if (!(target instanceof HTMLElement)) {
      return;
    }

    if (target.dataset.action === "show-buyer-code") {
      alert("구매 번호: " + target.dataset.code);
      return;
    }

    if (target.dataset.action === "show-code") {
      alert("주문 확인 번호: " + target.dataset.code);
      return;
    }

    if (target.dataset.action === "delete-pending") {
      askDangerConfirm("이 확정 대기 주문을 삭제할까요?", function () {
        GoodsData.deletePendingOrder(target.dataset.id);
      });
    }
  });

  superOrdersTableBody.addEventListener("click", function (event) {
    const target = event.target;
    if (!(target instanceof HTMLElement)) {
      return;
    }

    if (target.dataset.action === "show-code") {
      alert("구매 번호: " + target.dataset.code);
      return;
    }

    if (target.dataset.action === "complete-order") {
      GoodsData.updateOrderStatus(target.dataset.id, "처리 완료");
      refresh();
      return;
    }

    if (target.dataset.action === "delete-order") {
      askDangerConfirm("이 확정 주문을 삭제 보관함으로 이동할까요?", function () {
        GoodsData.deleteOrder(target.dataset.id);
      });
    }
  });

  deletedOrdersTableBody.addEventListener("click", function (event) {
    const target = event.target;
    if (!(target instanceof HTMLElement)) {
      return;
    }

    if (target.dataset.action === "show-code") {
      alert("구매 번호: " + target.dataset.code);
      return;
    }

    if (target.dataset.action === "restore-order") {
      askDangerConfirm("이 삭제 주문을 복구할까요?", function () {
        GoodsData.restoreDeletedOrder(target.dataset.id);
      });
    }
  });

  superProductManagerList.addEventListener("click", function (event) {
    const target = event.target;
    if (!(target instanceof HTMLElement)) {
      return;
    }

    const action = target.dataset.action;
    const productId = target.dataset.id;
    const size = target.dataset.size;

    if (!action || !productId || !size) {
      return;
    }

    if (action === "decrease-stock") {
      GoodsData.adjustProductStock(productId, size, -1);
      refresh();
      return;
    }

    if (action === "increase-stock") {
      GoodsData.adjustProductStock(productId, size, 1);
      refresh();
      return;
    }

    if (action === "apply-stock") {
      applyStockFromInput(productId, size);
    }
  });

  superProductManagerList.addEventListener("keydown", function (event) {
    const target = event.target;
    if (!(target instanceof HTMLInputElement)) {
      return;
    }

    if (event.key === "Enter" && target.dataset.role === "stock-input") {
      event.preventDefault();
      applyStockFromInput(target.dataset.id, target.dataset.size);
    }
  });

  deleteCompletedOrdersButton.addEventListener("click", function () {
    askDangerConfirm("처리 완료 주문을 모두 삭제 보관함으로 이동할까요?", function () {
      GoodsData.getOrders().forEach(function (order) {
        if (order.status === "처리 완료") {
          GoodsData.deleteOrder(order.id);
        }
      });
    });
  });

  deleteAllOrdersButton.addEventListener("click", function () {
    askDangerConfirm("전체 주문 내역과 확정 대기 내역을 삭제할까요?", function () {
      GoodsData.resetOrders();
    });
  });

  resetInventoryButton.addEventListener("click", function () {
    askDangerConfirm("전체 재고를 초기 수량으로 되돌릴까요?", function () {
      GoodsData.resetInventory();
    });
  });

  resetProductsButton.addEventListener("click", function () {
    askDangerConfirm("전체 상품 데이터를 기본 구성으로 초기화할까요?", function () {
      GoodsData.resetProducts();
    });
  });

  resetRevenueButton.addEventListener("click", function () {
    askDangerConfirm("판매 수익 통계를 초기화할까요? 주문, 확정 대기, 삭제 보관 데이터도 함께 비워집니다.", function () {
      GoodsData.clearRevenueStatistics();
    });
  });

  resetAllDataButton.addEventListener("click", function () {
    askDangerConfirm("전체 상품, 주문, 비밀번호 데이터를 기본값으로 초기화할까요?", function () {
      GoodsData.resetAllData();
    });
  });

  window.addEventListener("storage", refresh);

  initializeSuperAdminAccess();
})();
