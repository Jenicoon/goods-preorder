(function () {
  const shopAccessModal = document.getElementById("shopAccessModal");
  const shopAccessForm = document.getElementById("shopAccessForm");
  const shopAccessPasswordInput = document.getElementById("shopAccessPasswordInput");
  const productList = document.getElementById("productList");
  const orderForm = document.getElementById("orderForm");
  const stockStatus = document.getElementById("stockStatus");
  const orderSummary = document.getElementById("orderSummary");
  const paymentModal = document.getElementById("paymentModal");
  const paymentSummary = document.getElementById("paymentSummary");
  const adminConfirmSection = document.getElementById("adminConfirmSection");
  const adminCodeInput = document.getElementById("adminCodeInput");
  const closePaymentModalButton = document.getElementById("closePaymentModalButton");
  const cancelPaymentModalButton = document.getElementById("cancelPaymentModalButton");
  const showAdminConfirmButton = document.getElementById("showAdminConfirmButton");
  const confirmPaymentButton = document.getElementById("confirmPaymentButton");
  const copyAccountButton = document.getElementById("copyAccountButton");
  const accountNumber = document.getElementById("accountNumber");
  const accountQrImage = document.getElementById("accountQrImage");
  const qrFallbackTitle = document.getElementById("qrFallbackTitle");
  const qrFallbackDescription = document.getElementById("qrFallbackDescription");
  const buyerCodeModal = document.getElementById("buyerCodeModal");
  const buyerCodeBox = document.getElementById("buyerCodeBox");
  const finishBuyerFlowButton = document.getElementById("finishBuyerFlowButton");

  const selectionState = {};
  let stagedItems = [];
  let pendingOrderId = "";

  async function verifyShopAccess(password) {
    const response = await fetch((window.APP_CONFIG && window.APP_CONFIG.API_BASE_URL ? window.APP_CONFIG.API_BASE_URL.replace(/\/+$/, "") : window.location.origin) + "/api/public/shop-access", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ password: password })
    });

    const data = await response.json().catch(function () {
      return {};
    });

    if (!response.ok) {
      throw new Error(data && data.error && data.error.message ? data.error.message : "입장 비밀번호 확인에 실패했습니다.");
    }
  }

  function formatCurrency(value) {
    return new Intl.NumberFormat("ko-KR", {
      style: "currency",
      currency: "KRW",
      maximumFractionDigits: 0
    }).format(value);
  }

  function openModal(modal) {
    modal.classList.remove("is-hidden");
    modal.setAttribute("aria-hidden", "false");
  }

  function closeModal(modal) {
    modal.classList.add("is-hidden");
    modal.setAttribute("aria-hidden", "true");
  }

  function legacyCopyText(text) {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();

    try {
      return document.execCommand("copy");
    } catch (error) {
      return false;
    } finally {
      document.body.removeChild(textarea);
    }
  }

  async function handleCopyAccount() {
    const accountText = accountNumber ? accountNumber.textContent.trim() : "";
    if (!accountText) {
      alert("계좌번호를 찾지 못했습니다.");
      return;
    }

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(accountText);
      } else if (!legacyCopyText(accountText)) {
        throw new Error("Clipboard copy failed");
      }

      alert("계좌번호가 복사되었습니다.\n" + accountText);
    } catch (error) {
      alert("자동 복사가 차단되었어요. 아래 계좌번호를 직접 복사해 주세요.\n" + accountText);
    }
  }

  function renderAccountQr() {
    const accountText = accountNumber ? accountNumber.textContent.trim() : "";
    if (!accountText || !accountQrImage) {
      return;
    }

    const qrUrl = "https://api.qrserver.com/v1/create-qr-code/?size=240x240&format=png&data=" + encodeURIComponent(accountText);

    accountQrImage.addEventListener("load", function () {
      accountQrImage.classList.remove("is-hidden");
      if (qrFallbackTitle) {
        qrFallbackTitle.textContent = "QR 스캔으로 계좌 확인";
      }
      if (qrFallbackDescription) {
        qrFallbackDescription.textContent = "앱에서 인식이 안 되면 아래 계좌번호를 직접 복사해 주세요.";
      }
    }, { once: true });

    accountQrImage.addEventListener("error", function () {
      accountQrImage.classList.add("is-hidden");
      if (qrFallbackTitle) {
        qrFallbackTitle.textContent = "QR 이미지를 불러오지 못했습니다";
      }
      if (qrFallbackDescription) {
        qrFallbackDescription.textContent = "아래 계좌번호를 직접 복사해서 입금해 주세요.";
      }
    }, { once: true });

    accountQrImage.src = qrUrl;
  }

  function getSelectionKey(productId, size) {
    return productId + "::" + size;
  }

  function getSelectedItems() {
    const products = GoodsData.getProducts();
    const items = [];

    products.forEach(function (product) {
      product.sizes.forEach(function (size) {
        const quantity = Number(selectionState[getSelectionKey(product.id, size)] || 0);
        if (quantity > 0) {
          items.push({
            productId: product.id,
            productName: product.name,
            size: size,
            quantity: quantity,
            unitPrice: product.price,
            totalPrice: product.price * quantity,
            stock: Number(product.remainingStock[size] || 0),
            soldOut: product.soldOut || Number(product.remainingStock[size] || 0) <= 0
          });
        }
      });
    });

    return items;
  }

  function renderProducts() {
    const products = GoodsData.getProducts();

    productList.innerHTML = products.map(function (product) {
      const soldOut = GoodsData.isProductActuallySoldOut(product);

      const sizeControls = product.sizes.map(function (size) {
        const stock = Number(product.remainingStock[size] || 0);
        const quantity = Number(selectionState[getSelectionKey(product.id, size)] || 0);
        const disabled = product.soldOut || stock <= 0;

        return [
          '<div class="size-control-row' + (disabled ? " is-disabled" : "") + '">',
          '<div class="size-control-meta">',
          "<strong>" + size + "</strong>",
          "<span>남은 재고 " + stock + "개</span>",
          "</div>",
          '<div class="quantity-stepper">',
          '<button type="button" class="stepper-button" data-action="decrease" data-product-id="' + product.id + '" data-size="' + size + '"' + (quantity <= 0 ? " disabled" : "") + ">-</button>",
          '<span class="stepper-count">' + quantity + "</span>",
          '<button type="button" class="stepper-button" data-action="increase" data-product-id="' + product.id + '" data-size="' + size + '"' + (disabled || quantity >= stock ? " disabled" : "") + ">+</button>",
          "</div>",
          "</div>"
        ].join("");
      }).join("");

      return [
        '<article class="product-card product-card-shop' + (soldOut ? " is-sold-out" : "") + '">',
        '<img class="product-image" src="' + product.imageUrl + '" alt="' + product.name + '">',
        '<div class="product-body">',
        '<div class="product-topline">',
        "<h3>" + product.name + "</h3>",
        '<span class="badge' + (soldOut ? " sold-out" : "") + '">' + (soldOut ? "품절" : "판매중") + "</span>",
        "</div>",
        '<p class="price">' + formatCurrency(product.price) + "</p>",
        '<div class="size-control-list">' + sizeControls + "</div>",
        "</div>",
        "</article>"
      ].join("");
    }).join("");
  }

  function renderSummaryContent(items) {
    const totalQuantity = items.reduce(function (sum, item) {
      return sum + item.quantity;
    }, 0);
    const totalPrice = items.reduce(function (sum, item) {
      return sum + item.totalPrice;
    }, 0);

    return [
      '<div class="summary-list">',
      items.map(function (item) {
        return [
          '<div class="summary-item">',
          '<div class="summary-item-main">',
          "<strong>" + item.productName + "</strong>",
          "<span>" + item.size + " / " + item.quantity + "개</span>",
          "</div>",
          '<strong class="summary-price">' + formatCurrency(item.totalPrice) + "</strong>",
          "</div>"
        ].join("");
      }).join(""),
      "</div>",
      '<div class="summary-total">',
      "<span>총 " + totalQuantity + "개</span>",
      "<strong>" + formatCurrency(totalPrice) + "</strong>",
      "</div>"
    ].join("");
  }

  function updateSummary() {
    const items = getSelectedItems();
    const totalQuantity = items.reduce(function (sum, item) {
      return sum + item.quantity;
    }, 0);
    const invalidItem = items.find(function (item) {
      return item.soldOut || item.quantity > item.stock;
    });

    if (!items.length) {
      stockStatus.textContent = "상품 카드에서 옵션별 수량을 선택해주세요.";
      stockStatus.className = "stock-status";
      orderSummary.innerHTML = '<div class="summary-empty"><strong>선택한 굿즈가 없습니다.</strong><p>왼쪽 상품 카드에서 + 버튼으로 수량을 담아주세요.</p></div>';
      return;
    }

    orderSummary.innerHTML = renderSummaryContent(items);

    if (invalidItem) {
      stockStatus.textContent = "일부 선택 수량이 현재 재고와 맞지 않습니다. 수량을 다시 확인해주세요.";
      stockStatus.className = "stock-status danger";
    } else {
      stockStatus.textContent = "총 " + totalQuantity + "개 상품을 선택했습니다. 구매 진행이 가능합니다.";
      stockStatus.className = "stock-status";
    }
  }

  function changeQuantity(productId, size, delta) {
    const products = GoodsData.getProducts();
    const product = products.find(function (item) {
      return item.id === productId;
    });

    if (!product) {
      return;
    }

    const stock = Number(product.remainingStock[size] || 0);
    const key = getSelectionKey(productId, size);
    const current = Number(selectionState[key] || 0);
    const next = Math.max(0, Math.min(stock, current + delta));

    selectionState[key] = next;
    if (next === 0) {
      delete selectionState[key];
    }

    renderProducts();
    updateSummary();
  }

  function resetSelections() {
    Object.keys(selectionState).forEach(function (key) {
      delete selectionState[key];
    });
  }

  function setAdminConfirmStepVisible(isVisible) {
    adminConfirmSection.classList.toggle("is-hidden", !isVisible);
    confirmPaymentButton.classList.toggle("is-hidden", !isVisible);
    showAdminConfirmButton.classList.toggle("is-hidden", isVisible);
    cancelPaymentModalButton.textContent = "이전";
  }

  function resetFlow() {
    resetSelections();
    stagedItems = [];
    pendingOrderId = "";
    adminCodeInput.value = "";
    setAdminConfirmStepVisible(false);
    closeModal(paymentModal);
    closeModal(buyerCodeModal);
    renderProducts();
    updateSummary();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function validateSelectedItems() {
    const selectedItems = getSelectedItems();
    if (!selectedItems.length) {
      alert("최소 1개 이상 굿즈를 선택해주세요.");
      return null;
    }

    const invalidItem = selectedItems.find(function (item) {
      return item.soldOut || item.quantity > item.stock;
    });

    if (invalidItem) {
      alert("재고가 부족하거나 품절된 상품이 포함되어 있습니다.");
      renderProducts();
      updateSummary();
      return null;
    }

    return selectedItems;
  }

  function handleOrderSubmit(event) {
    event.preventDefault();
    const selectedItems = validateSelectedItems();
    if (!selectedItems) {
      return;
    }

    stagedItems = selectedItems;
    paymentSummary.innerHTML = renderSummaryContent(selectedItems);
    adminCodeInput.value = "";
    setAdminConfirmStepVisible(false);
    openModal(paymentModal);
  }

  async function handleShowAdminConfirm() {
    if (!stagedItems.length) {
      closeModal(paymentModal);
      return;
    }

    try {
      if (!pendingOrderId) {
        const pendingOrder = await GoodsData.createPendingOrder({
          items: stagedItems.map(function (item) {
            return {
              productId: item.productId,
              size: item.size,
              quantity: item.quantity
            };
          })
        });
        pendingOrderId = pendingOrder.id;
      }

      await GoodsData.syncStorefrontData();
      setAdminConfirmStepVisible(true);
      renderProducts();
      updateSummary();
      alert("구매 번호가 생성되었습니다. 관리자 페이지의 확정 대기에서 바로 확인할 수 있습니다.");
    } catch (error) {
      alert(error.message);
      closeModal(paymentModal);
      renderProducts();
      updateSummary();
    }
  }

  async function handleConfirmPayment() {
    if (!pendingOrderId) {
      return;
    }

    try {
      const confirmedOrder = await GoodsData.confirmPendingOrder(pendingOrderId, adminCodeInput.value.trim());
      pendingOrderId = "";
      closeModal(paymentModal);
      buyerCodeBox.textContent = confirmedOrder.buyerConfirmationCode;
      openModal(buyerCodeModal);
      await GoodsData.syncStorefrontData();
      renderProducts();
      updateSummary();
    } catch (error) {
      alert(error.message);
    }
  }

  function handlePreviousStep() {
    if (!pendingOrderId) {
      closeModal(paymentModal);
      return;
    }

    adminCodeInput.value = "";
    setAdminConfirmStepVisible(false);
  }

  async function closePaymentFlow() {
    if (pendingOrderId) {
      await GoodsData.deletePendingOrder(pendingOrderId);
      pendingOrderId = "";
    }

    stagedItems = [];
    adminCodeInput.value = "";
    setAdminConfirmStepVisible(false);
    closeModal(paymentModal);
    await GoodsData.syncStorefrontData();
    renderProducts();
    updateSummary();
  }

  function initializeShopAccess() {
    if (sessionStorage.getItem("goods-shop-shop-auth") === "true") {
      closeModal(shopAccessModal);
      return;
    }

    openModal(shopAccessModal);
  }

  shopAccessForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    try {
      await verifyShopAccess(shopAccessPasswordInput.value);
      sessionStorage.setItem("goods-shop-shop-auth", "true");
      shopAccessForm.reset();
      closeModal(shopAccessModal);
    } catch (error) {
      alert(error.message || "입장 비밀번호가 올바르지 않습니다.");
      shopAccessPasswordInput.select();
    }
  });

  productList.addEventListener("click", function (event) {
    const target = event.target;
    if (!(target instanceof HTMLElement) || !target.dataset.action) {
      return;
    }

    const delta = target.dataset.action === "increase" ? 1 : -1;
    changeQuantity(target.dataset.productId, target.dataset.size, delta);
  });

  orderForm.addEventListener("submit", handleOrderSubmit);
  showAdminConfirmButton.addEventListener("click", handleShowAdminConfirm);
  confirmPaymentButton.addEventListener("click", handleConfirmPayment);
  closePaymentModalButton.addEventListener("click", closePaymentFlow);
  cancelPaymentModalButton.addEventListener("click", handlePreviousStep);
  finishBuyerFlowButton.addEventListener("click", resetFlow);
  copyAccountButton.addEventListener("click", function () {
    void handleCopyAccount();
  });

  (async function initializePage() {
    try {
      await GoodsData.syncStorefrontData();
      renderProducts();
      updateSummary();
    } catch (error) {
      stockStatus.textContent = error.message || "상품 정보를 불러오지 못했습니다.";
      stockStatus.className = "stock-status danger";
    }

    initializeShopAccess();
    renderAccountQr();
  })();
})();
