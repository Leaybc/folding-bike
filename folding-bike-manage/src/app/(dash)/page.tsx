import Link from "next/link";
import { prisma } from "@folding-bike/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatYuan } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function DashHome() {
  const [partCount, categoryCount, orderCount, sums] = await Promise.all([
    prisma.part.count({ where: { active: true } }),
    prisma.category.count(),
    prisma.order.count(),
    prisma.order.aggregate({
      _sum: { totalSell: true, totalCost: true, profit: true },
    }),
  ]);

  const stats = [
    { label: "配件分类", value: categoryCount.toString() },
    { label: "在售配件", value: partCount.toString() },
    { label: "配置单总数", value: orderCount.toString() },
    {
      label: "累计销售额",
      value: formatYuan(sums._sum.totalSell ?? 0),
    },
    {
      label: "累计成本",
      value: formatYuan(sums._sum.totalCost ?? 0),
    },
    {
      label: "累计盈利",
      value: formatYuan(sums._sum.profit ?? 0),
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">概览</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-normal text-muted-foreground">
                {s.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">{s.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex gap-3">
        <Link
          href="/parts"
          className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90"
        >
          管理配件
        </Link>
        <Link
          href="/orders"
          className="rounded-md border px-4 py-2 text-sm hover:bg-accent"
        >
          查看配置单
        </Link>
      </div>
    </div>
  );
}
