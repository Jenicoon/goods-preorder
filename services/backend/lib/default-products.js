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

module.exports = {
  DEFAULT_PRODUCTS
};
