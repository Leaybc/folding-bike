import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@folding-bike/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatYuan, formatWeight, formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: true },
  });

  if (!order) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">配置单详情</h1>
        <Link href="/orders" className="text-sm text-muted-foreground hover:underline">
          ← 返回列表
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>客户信息</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
          <Field label="姓名" value={order.customerName} />
          <Field label="手机号" value={order.phone} />
          <Field label="微信号" value={order.wechat || "—"} />
          <Field
            label="提交时间"
            value={formatDateTime(order.createdAt)}
          />
          <Field
            label="订单编号"
            value={<span className="font-mono text-xs">{order.id}</span>}
          />
          {order.note && (
            <div className="sm:col-span-3">
              <div className="text-xs text-muted-foreground">备注</div>
              <div className="mt-1 whitespace-pre-wrap rounded-md border bg-secondary/50 p-3 text-sm">
                {order.note}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>配置明细</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs text-muted-foreground">
                <tr className="border-b">
                  <th className="py-2 font-normal">分类</th>
                  <th className="py-2 font-normal">品牌 · 型号</th>
                  <th className="py-2 font-normal">进价</th>
                  <th className="py-2 font-normal">售价</th>
                  <th className="py-2 font-normal">毛利</th>
                  <th className="py-2 font-normal">重量</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((it) => (
                  <tr key={it.id} className="border-b last:border-b-0">
                    <td className="py-2 pr-3 text-muted-foreground">
                      {it.categoryName}
                    </td>
                    <td className="py-2 pr-3 font-medium">
                      {it.brand}
                      <span className="ml-1 font-normal text-muted-foreground">
                        · {it.name}
                      </span>
                    </td>
                    <td className="py-2 pr-3">{formatYuan(it.costPrice)}</td>
                    <td className="py-2 pr-3">{formatYuan(it.sellPrice)}</td>
                    <td className="py-2 pr-3 text-emerald-600">
                      {formatYuan(it.sellPrice - it.costPrice)}
                    </td>
                    <td className="py-2 pr-3">{formatWeight(it.weight)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>合计</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
          <Stat label="件数" value={`${order.items.length}`} />
          <Stat label="总重量" value={formatWeight(order.totalWeight)} />
          <Stat label="销售总价" value={formatYuan(order.totalSell)} />
          <Stat label="成本总价" value={formatYuan(order.totalCost)} />
          <Stat
            label="盈利"
            value={formatYuan(order.profit)}
            valueClass="text-emerald-600"
          />
          <Stat
            label="毛利率"
            value={
              order.totalSell > 0
                ? `${((order.profit / order.totalSell) * 100).toFixed(1)}%`
                : "—"
            }
          />
        </CardContent>
      </Card>
    </div>
  );
}

function Field({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1">{value}</div>
    </div>
  );
}

function Stat({
  label,
  value,
  valueClass,
}: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`mt-1 text-lg font-semibold ${valueClass || ""}`}>
        {value}
      </div>
    </div>
  );
}
