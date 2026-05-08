import Link from "next/link";
import { prisma } from "@folding-bike/db";
import { Card, CardContent } from "@/components/ui/card";
import { formatYuan, formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function OrdersListPage() {
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    select: {
      id: true,
      customerName: true,
      phone: true,
      wechat: true,
      totalSell: true,
      totalCost: true,
      profit: true,
      createdAt: true,
      _count: { select: { items: true } },
    },
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">配置单</h1>
      {orders.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            还没有任何配置单
          </CardContent>
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs text-muted-foreground">
                <tr className="border-b">
                  <th className="px-4 py-3 font-normal">提交时间</th>
                  <th className="px-4 py-3 font-normal">客户</th>
                  <th className="px-4 py-3 font-normal">联系方式</th>
                  <th className="px-4 py-3 font-normal">件数</th>
                  <th className="px-4 py-3 font-normal">售价</th>
                  <th className="px-4 py-3 font-normal">成本</th>
                  <th className="px-4 py-3 font-normal">盈利</th>
                  <th className="px-4 py-3 font-normal text-right">操作</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id} className="border-b last:border-b-0">
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatDateTime(o.createdAt)}
                    </td>
                    <td className="px-4 py-3 font-medium">{o.customerName}</td>
                    <td className="px-4 py-3">
                      <div>{o.phone}</div>
                      {o.wechat && (
                        <div className="text-xs text-muted-foreground">
                          微信：{o.wechat}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">{o._count.items}</td>
                    <td className="px-4 py-3">{formatYuan(o.totalSell)}</td>
                    <td className="px-4 py-3">{formatYuan(o.totalCost)}</td>
                    <td className="px-4 py-3 text-emerald-600">
                      {formatYuan(o.profit)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/orders/${o.id}`}
                        className="text-primary hover:underline"
                      >
                        详情
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
