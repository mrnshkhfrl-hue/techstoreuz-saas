import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.product.deleteMany({});

  const products = [
    // --- SMARTPHONES ---
    {
      name: "iPhone 15 Pro",
      nameUz: "iPhone 15 Pro",
      price: 999,
      images: JSON.stringify(["/products/iphone15pro_1.webp", "/products/iphone15pro_2.jpg"]),
      description: "Титановый корпус, процессор A17 Pro. Лучшая камера в истории iPhone.",
      descriptionUz: "Titan korpus, A17 Pro protsessori. iPhone tarixidagi eng yaxshi kamera.",
      category: "phone",
      isPopular: true,
      attributes: JSON.stringify({ "АКБ": "100%", "Состояние": "New", "Регион": "LL/A" }),
      storage: JSON.stringify(["128 GB", "256 GB", "512 GB", "1 TB"]),
      colors: JSON.stringify([
        { name: "Natural Titanium", hex: "#bebbb4" },
        { name: "Blue Titanium", hex: "#4b535d" },
        { name: "White Titanium", hex: "#f2f1ed" }
      ]),
    },
    {
      name: "iPhone 14 (9/10)",
      nameUz: "iPhone 14 (9/10)",
      price: 620,
      images: JSON.stringify(["/products/iphone15pro_2.jpg"]), // Using as placeholder
      description: "Отличное состояние, мелкие царапины на рамке.",
      descriptionUz: "A'lo holatda, romida kichik tirnalishlar bor.",
      category: "phone",
      attributes: JSON.stringify({ "АКБ": "92%", "Циклы": "240" }),
      storage: JSON.stringify(["128 GB", "256 GB"]),
    },

    // --- AUDIO ---
    {
      name: "AirPods Pro 2 (Type-C)",
      nameUz: "AirPods Pro 2 (Type-C)",
      price: 245,
      images: JSON.stringify(["/products/airpods_pro2_1.webp"]),
      description: "Новые, запечатанные. Активное шумоподавление и адаптивный звук.",
      descriptionUz: "Yangi, qadoqlangan. Faol shovqinni bekor qilish va moslashuvchan ovoz.",
      category: "audio",
      isPopular: true,
      attributes: JSON.stringify({ "Гарантия": "1 год", "Разъем": "Type-C" }),
    },
    {
      name: "JBL Charge 5",
      nameUz: "JBL Charge 5",
      price: 160,
      images: JSON.stringify(["/products/jbl_charge5_1.jpg"]),
      description: "Портативная колонка с мощным звуком и защитой IP67.",
      descriptionUz: "Kuchli ovoz va IP67 himoyasiga ega portativ kalonka.",
      category: "audio",
      attributes: JSON.stringify({ "Мощность": "40Вт", "Защита": "IP67" }),
    },

    // --- GAMING ---
    {
      name: "Logitech G Pro X Superlight",
      nameUz: "Logitech G Pro X Superlight",
      price: 155,
      images: JSON.stringify(["/products/logitech_gpro_1.webp"]),
      description: "Ультралегкая игровая мышь. Выбор профессиональных киберспортсменов.",
      descriptionUz: "Ultra yengil o'yin sichqonchasi. Professional kiber sportchilar tanlovi.",
      category: "gaming",
      isPopular: true,
      attributes: JSON.stringify({ "Сенсор": "HERO 25K", "Вес": "63г" }),
    },

    // --- WATCH ---
    {
      name: "Apple Watch Ultra 2",
      nameUz: "Apple Watch Ultra 2",
      price: 850,
      images: JSON.stringify(["/products/aw_ultra2_1.jpg"]),
      description: "Самые прочные и функциональные Apple Watch. Титан, 49мм.",
      descriptionUz: "Eng bardoshli va funksional Apple Watch. Titan, 49mm.",
      category: "watch",
      isPopular: true,
      attributes: JSON.stringify({ "Размер": "49мм", "Корпус": "Титан", "Экран": "3000 нит" }),
    },

    // --- ACCESSORIES & POWER ---
    {
      name: "Silicone Case MagSafe",
      nameUz: "Silikon Case MagSafe",
      price: 25,
      images: JSON.stringify(["/products/case_1.jpg"]),
      description: "Оригинальные чехлы с MagSafe для iPhone 15/16 серии.",
      descriptionUz: "iPhone 15/16 seriyasi uchun MagSafe-li original g'iloflar.",
      category: "accessory",
      models: JSON.stringify(["iPhone 15 Pro", "15 Pro Max", "16 Pro", "16 Pro Max"]),
      colors: JSON.stringify([
        { name: "Black", hex: "#000000" },
        { name: "Storm Blue", hex: "#323e4d" },
        { name: "Guava", hex: "#e86a60" }
      ]),
    },
    {
      name: "Baseus Adaman 20000mAh",
      nameUz: "Baseus Adaman 20000mAh",
      price: 65,
      images: JSON.stringify(["/products/baseus_pb_1.jpg"]),
      description: "Быстрая зарядка 65W, металлический корпус, цифровой дисплей.",
      descriptionUz: "65W tezkor quvvatlash, metall korpus, raqamli displey.",
      category: "power",
      attributes: JSON.stringify({ "Емкость": "20000", "Порты": "USB/Type-C", "Мощность": "65W" }),
    }
  ];

  for (const product of products) {
    await prisma.product.create({
      data: product as any,
    });
  }

  console.log("Database seeded successfully with local images!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
