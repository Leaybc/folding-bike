import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type SeedPart = {
  brand: string;
  name: string;
  costPrice: number; // 元
  sellPrice: number; // 元
  weight: number; // 克
  note?: string;
};

type SeedCategory = {
  name: string;
  sortOrder: number;
  parts: SeedPart[];
};

// 折叠车配件参考数据。价格以国内零售行情为参考，毛利率约 30%–60% 视档位而定。
const data: SeedCategory[] = [
  {
    name: "车架",
    sortOrder: 1,
    parts: [
      {
        brand: "Litepro",
        name: "Aero 412 铝合金车架",
        costPrice: 1600,
        sellPrice: 2680,
        weight: 1850,
        note: "412 单折，AL7005 铝合金，前叉接口 1-1/8\"",
      },
      {
        brand: "Java",
        name: "Fit 451 铝合金车架",
        costPrice: 1850,
        sellPrice: 2980,
        weight: 1980,
        note: "451 单折，碟刹/V 刹兼容",
      },
      {
        brand: "Fnhon",
        name: "Gust 22\" 三折车架",
        costPrice: 2400,
        sellPrice: 3680,
        weight: 2400,
        note: "三折结构，便携性更好",
      },
      {
        brand: "Java",
        name: "TT 钛合金 451 车架",
        costPrice: 4800,
        sellPrice: 7280,
        weight: 1620,
        note: "钛合金，限量",
      },
      {
        brand: "Birdy",
        name: "Birdy 3 折叠车架",
        costPrice: 8800,
        sellPrice: 12800,
        weight: 3200,
        note: "前后避震经典款",
      },
    ],
  },
  {
    name: "前叉",
    sortOrder: 2,
    parts: [
      {
        brand: "Litepro",
        name: "412 铝合金直叉",
        costPrice: 240,
        sellPrice: 420,
        weight: 580,
        note: "1-1/8\" 直管，V 刹孔",
      },
      {
        brand: "Litepro",
        name: "Aero 451 铝合金锥叉",
        costPrice: 320,
        sellPrice: 520,
        weight: 540,
        note: "锥管 1-1/8\"–1.5\"",
      },
      {
        brand: "Fnhon",
        name: "钛合金 451 前叉",
        costPrice: 980,
        sellPrice: 1580,
        weight: 520,
        note: "整体钛合金锻造",
      },
      {
        brand: "Java",
        name: "22\" 碳纤维前叉",
        costPrice: 720,
        sellPrice: 1180,
        weight: 420,
        note: "T700 碳纤维，碟刹版",
      },
    ],
  },
  {
    name: "把立",
    sortOrder: 3,
    parts: [
      {
        brand: "UNO",
        name: "ASD-19 折叠把立 90mm",
        costPrice: 75,
        sellPrice: 138,
        weight: 220,
        note: "7° 铝合金，性价比之选",
      },
      {
        brand: "Fnhon",
        name: "Gust 一体折叠把立",
        costPrice: 280,
        sellPrice: 480,
        weight: 195,
        note: "整体锻造，刚性更好",
      },
      {
        brand: "Litepro",
        name: "钛合金一体折叠把立",
        costPrice: 480,
        sellPrice: 780,
        weight: 165,
        note: "钛合金，轻量",
      },
      {
        brand: "Litepro",
        name: "DA 折叠加高把立",
        costPrice: 180,
        sellPrice: 298,
        weight: 245,
        note: "可调高度",
      },
    ],
  },
  {
    name: "车把",
    sortOrder: 4,
    parts: [
      {
        brand: "Litepro",
        name: "580mm 铝合金燕把",
        costPrice: 60,
        sellPrice: 118,
        weight: 240,
        note: "弯把 25.4mm 接口",
      },
      {
        brand: "Fnhon",
        name: "540mm 钛合金平把",
        costPrice: 480,
        sellPrice: 780,
        weight: 130,
        note: "钛合金，6Al-4V",
      },
      {
        brand: "NEASTY",
        name: "T800 碳纤维燕把 580mm",
        costPrice: 240,
        sellPrice: 380,
        weight: 175,
        note: "碳纤维",
      },
      {
        brand: "Litepro",
        name: "M字小弯把 580mm",
        costPrice: 95,
        sellPrice: 168,
        weight: 260,
        note: "适合长距离骑行",
      },
    ],
  },
  {
    name: "座管",
    sortOrder: 5,
    parts: [
      {
        brand: "Litepro",
        name: "33.9*580mm 铝合金座管",
        costPrice: 80,
        sellPrice: 158,
        weight: 320,
        note: "标准 33.9 直径",
      },
      {
        brand: "Litepro",
        name: "33.9 钛合金座管",
        costPrice: 480,
        sellPrice: 780,
        weight: 240,
        note: "Ti 3Al-2.5V",
      },
      {
        brand: "Promend",
        name: "33.9 碳纤维座管",
        costPrice: 220,
        sellPrice: 360,
        weight: 195,
        note: "T700 碳纤维",
      },
      {
        brand: "KS",
        name: "LEV Si 33.9 升降座管",
        costPrice: 980,
        sellPrice: 1480,
        weight: 520,
        note: "75mm 行程",
      },
    ],
  },
  {
    name: "坐垫",
    sortOrder: 6,
    parts: [
      {
        brand: "Velo",
        name: "Plush 1396 坐垫",
        costPrice: 60,
        sellPrice: 128,
        weight: 290,
        note: "中长途舒适款",
      },
      {
        brand: "Selle Royal",
        name: "Lookin Athletic",
        costPrice: 180,
        sellPrice: 298,
        weight: 320,
        note: "记忆海绵",
      },
      {
        brand: "Fizik",
        name: "Antares R7",
        costPrice: 580,
        sellPrice: 880,
        weight: 220,
        note: "K:ium 弓",
      },
      {
        brand: "Brooks",
        name: "B17 经典真皮坐垫",
        costPrice: 980,
        sellPrice: 1380,
        weight: 540,
        note: "英国手工真皮",
      },
    ],
  },
  {
    name: "轮组",
    sortOrder: 7,
    parts: [
      {
        brand: "Litepro",
        name: "412 铝合金 V 刹轮组",
        costPrice: 420,
        sellPrice: 680,
        weight: 1280,
        note: "16\"，双层圈",
      },
      {
        brand: "Java",
        name: "22\" 451 碟刹轮组",
        costPrice: 880,
        sellPrice: 1380,
        weight: 1620,
        note: "碟刹，桶轴 12mm",
      },
      {
        brand: "Novatec",
        name: "D791/D792SB 22\" 451",
        costPrice: 1280,
        sellPrice: 1880,
        weight: 1480,
        note: "Novatec 花鼓 + 自编",
      },
      {
        brand: "Fnhon",
        name: "20\" 451 碳纤维轮组",
        costPrice: 2480,
        sellPrice: 3680,
        weight: 1080,
        note: "T800 碳纤维框",
      },
      {
        brand: "Litepro",
        name: "16\" 305 钛轴轮组",
        costPrice: 680,
        sellPrice: 1080,
        weight: 1180,
        note: "Brompton 兼容",
      },
    ],
  },
  {
    name: "外胎",
    sortOrder: 8,
    parts: [
      {
        brand: "Kenda",
        name: "K1029 16x1.35",
        costPrice: 32,
        sellPrice: 65,
        weight: 200,
        note: "通勤入门，单条价",
      },
      {
        brand: "Maxxis",
        name: "DTR-1 20x1.25",
        costPrice: 180,
        sellPrice: 280,
        weight: 240,
        note: "451 防刺，单条价",
      },
      {
        brand: "Schwalbe",
        name: "One 20x1.10 451",
        costPrice: 280,
        sellPrice: 420,
        weight: 220,
        note: "竞速款，单条价",
      },
      {
        brand: "Continental",
        name: "Grand Prix 5000 20x1.25",
        costPrice: 380,
        sellPrice: 560,
        weight: 240,
        note: "BlackChili 胎质，单条价",
      },
      {
        brand: "Schwalbe",
        name: "Marathon Plus 20x1.35",
        costPrice: 220,
        sellPrice: 358,
        weight: 480,
        note: "长寿耐磨，单条价",
      },
    ],
  },
  {
    name: "牙盘",
    sortOrder: 9,
    parts: [
      {
        brand: "Litepro",
        name: "一体式 53T 折叠车牙盘",
        costPrice: 260,
        sellPrice: 428,
        weight: 620,
        note: "170mm 曲柄，BCD 130",
      },
      {
        brand: "Stone",
        name: "椭圆盘 56T BCD130",
        costPrice: 380,
        sellPrice: 620,
        weight: 580,
        note: "需配中轴",
      },
      {
        brand: "Shimano",
        name: "105 R7000 50-34T 170mm",
        costPrice: 880,
        sellPrice: 1280,
        weight: 720,
        note: "Hollowtech II",
      },
      {
        brand: "Shimano",
        name: "Ultegra R8000 52-36T",
        costPrice: 1480,
        sellPrice: 2180,
        weight: 690,
        note: "高端竞赛",
      },
    ],
  },
  {
    name: "后变速",
    sortOrder: 10,
    parts: [
      {
        brand: "microSHIFT",
        name: "R10 10 速短腿",
        costPrice: 160,
        sellPrice: 268,
        weight: 240,
        note: "性价比之选",
      },
      {
        brand: "Shimano",
        name: "Sora R3000 9 速",
        costPrice: 240,
        sellPrice: 398,
        weight: 250,
        note: "9 速公路",
      },
      {
        brand: "Shimano",
        name: "Tiagra R4700 10 速",
        costPrice: 460,
        sellPrice: 720,
        weight: 200,
        note: "10 速公路",
      },
      {
        brand: "Shimano",
        name: "105 R7000 11 速",
        costPrice: 780,
        sellPrice: 1180,
        weight: 233,
        note: "11 速 SS 短腿",
      },
      {
        brand: "Shimano",
        name: "Ultegra R8000 11 速",
        costPrice: 1280,
        sellPrice: 1880,
        weight: 210,
        note: "高端 11 速",
      },
    ],
  },
  {
    name: "飞轮",
    sortOrder: 11,
    parts: [
      {
        brand: "SunRace",
        name: "CSM990 9 速 11-32T",
        costPrice: 95,
        sellPrice: 168,
        weight: 340,
        note: "9 速通勤",
      },
      {
        brand: "Shimano",
        name: "CS-HG50 9 速 11-32T",
        costPrice: 160,
        sellPrice: 258,
        weight: 360,
        note: "9 速",
      },
      {
        brand: "Shimano",
        name: "CS-HG500 10 速 11-34T",
        costPrice: 260,
        sellPrice: 398,
        weight: 380,
        note: "10 速",
      },
      {
        brand: "Shimano",
        name: "CS-R7000 11 速 11-30T",
        costPrice: 460,
        sellPrice: 680,
        weight: 284,
        note: "105 等级 11 速",
      },
    ],
  },
  {
    name: "刹车",
    sortOrder: 12,
    parts: [
      {
        brand: "Litepro",
        name: "长腿 V 刹一对",
        costPrice: 85,
        sellPrice: 158,
        weight: 280,
        note: "前后一对，铝合金",
      },
      {
        brand: "Tektro",
        name: "R359 长腿夹器一对",
        costPrice: 180,
        sellPrice: 298,
        weight: 320,
        note: "451 长行程夹器",
      },
      {
        brand: "Avid",
        name: "BB7 机械碟刹一对",
        costPrice: 380,
        sellPrice: 580,
        weight: 340,
        note: "前后一对，含油管",
      },
      {
        brand: "Shimano",
        name: "BR-R7000 公路夹器一对",
        costPrice: 580,
        sellPrice: 880,
        weight: 342,
        note: "105 等级直拉",
      },
    ],
  },
];

async function main() {
  for (const c of data) {
    const cat = await prisma.category.upsert({
      where: { name: c.name },
      update: { sortOrder: c.sortOrder },
      create: { name: c.name, sortOrder: c.sortOrder },
    });

    for (const p of c.parts) {
      // 没有 (categoryId, brand, name) 唯一约束，所以手动 find-then-create 保证幂等
      const existing = await prisma.part.findFirst({
        where: { categoryId: cat.id, brand: p.brand, name: p.name },
        select: { id: true },
      });
      if (existing) continue;
      await prisma.part.create({
        data: {
          categoryId: cat.id,
          brand: p.brand,
          name: p.name,
          costPrice: p.costPrice,
          sellPrice: p.sellPrice,
          weight: p.weight,
          note: p.note ?? null,
          active: true,
        },
      });
    }
  }

  const [cats, parts] = await Promise.all([
    prisma.category.count(),
    prisma.part.count(),
  ]);
  console.log(`Seed done: ${cats} categories, ${parts} parts.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
