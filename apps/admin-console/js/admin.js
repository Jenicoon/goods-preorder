(function () {
  const adminAccessModal = document.getElementById("adminAccessModal");
  const adminAccessForm = document.getElementById("adminAccessForm");
  const adminAccessPasswordInput = document.getElementById("adminAccessPasswordInput");
  const adminLoginSection = document.getElementById("adminLoginSection");
  const adminDashboard = document.getElementById("adminDashboard");
  const adminLoginForm = document.getElementById("adminLoginForm");
  const adminPasswordInput = document.getElementById("adminPasswordInput");
  const adminLogoutButton = document.getElementById("adminLogoutButton");
  const adminStats = document.getElementById("adminStats");
  const pendingOrdersTableBody = document.getElementById("pendingOrdersTableBody");
  const ordersTableBody = document.getElementById("ordersTableBody");
  const inventoryTableBody = document.getElementById("inventoryTableBody");

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
    return request("/api/admin/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ password: password })
    });
  }

  async function checkSession() {
    return request("/api/admin/session", {
      method: "GET"
    });
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

  function setLoggedIn(isLoggedIn) {
    adminLoginSection.classList.toggle("is-hidden", isLoggedIn);
    adminDashboard.classList.toggle("is-hidden", !isLoggedIn);
  }

  function formatCurrency(value) {
    return new Intl.NumberFormat("ko-KR", {
      style: "currency",
      currency: "KRW",
      maximumFractionDigits: 0
    }).format(value);
  }

  function statCard(label, value) {
    return '<article class="stat-card"><span>' + label + "</span><strong>" + value + "</strong></article>";
  }

  function orderItemsHtml(items) {
    return (items || []).map(function (item) {
      return item.productName + " / " + item.size + " / " + item.quantity + "개";
    }).join("<br>");
  }

  function renderStats() {
    const revenue = GoodsData.calculateRevenue();
    adminStats.innerHTML = [
      statCard("확정 대기 주문", revenue.waitingOrders + "건"),
      statCard("총 주문 수", revenue.totalOrders + "건"),
      statCard("처리 대기 주문", revenue.pendingOrders + "건"),
      statCard("처리 완료 주문", revenue.completedOrders + "건"),
      statCard("총 판매 수량", revenue.totalQuantity + "개"),
      statCard("품절 상품 수", revenue.soldOutCount + "개")
    ].join("");
  }

  function renderPendingOrders() {
    const pendingOrders = GoodsData.getPendingOrders();
    pendingOrdersTableBody.innerHTML = pendingOrders.map(function (order) {
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
        "</div></td>",
        "</tr>"
      ].join("");
    }).join("");
  }

  function renderOrders() {
    const orders = GoodsData.getOrders();
    ordersTableBody.innerHTML = orders.map(function (order) {
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
          "</div></td>",
        "</tr>"
      ].join("");
    }).join("");
  }

  function renderInventory() {
    const products = GoodsData.getProducts();
    inventoryTableBody.innerHTML = products.map(function (product) {
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

  function refreshDashboard() {
    renderStats();
    renderPendingOrders();
    renderOrders();
    renderInventory();
  }

  async function handleLogin(password) {
    await loginWithPassword(password);
    closeModal(adminAccessModal);
    setLoggedIn(true);
    refreshDashboard();
  }

  async function initializeAdminAccess() {
    setLoggedIn(false);

    try {
      await checkSession();
      closeModal(adminAccessModal);
      setLoggedIn(true);
      refreshDashboard();
      return;
    } catch (error) {
      openModal(adminAccessModal);
    }
  }

  adminAccessForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    try {
      await handleLogin(adminAccessPasswordInput.value);
      adminAccessForm.reset();
    } catch (error) {
      alert(error.message || "관리자 입장 비밀번호가 올바르지 않습니다.");
      adminAccessPasswordInput.select();
    }
  });

  adminLoginForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    try {
      await handleLogin(adminPasswordInput.value);
      adminLoginForm.reset();
    } catch (error) {
      alert(error.message || "관리자 비밀번호가 올바르지 않습니다.");
      adminPasswordInput.select();
    }
  });

  adminLogoutButton.addEventListener("click", async function () {
    try {
      await logoutSession();
    } catch (error) {
      console.error(error);
    }

    adminLoginForm.reset();
    adminAccessForm.reset();
    setLoggedIn(false);
    openModal(adminAccessModal);
  });

  pendingOrdersTableBody.addEventListener("click", function (event) {
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
    }
  });

  ordersTableBody.addEventListener("click", function (event) {
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
      refreshDashboard();
    }
  });

  window.addEventListener("storage", refreshDashboard);

  initializeAdminAccess();
})();
