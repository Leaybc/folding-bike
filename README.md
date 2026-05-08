# 折叠车 DIY 配件配置 (monorepo)

Next.js 15 monorepo,两个 app 共用一份 Prisma schema:

```
folding-bike/
├── folding-bike-ui/       # 用户端 (手机访问、选配件、生成配置单)
├── folding-bike-manage/   # 管理端 (登录、管理配件、查看配置单)
└── packages/db/           # 共享 Prisma schema + Postgres client
```

金额存 `Int`(单位:元),重量存 `Int`(单位:克)。

## 部署模型

**一个 GitHub 仓库 → 在 Vercel 中 import 两次**(每次设不同的 Root Directory)。
两次 import 形成两个独立的 Vercel project,各自独立部署、独立域名,但共享同一个 Neon 数据库。

```
   GitHub: <your-account>/folding-bike   (这一个仓库)
      ├── 在 Vercel import → project A (Root Directory = folding-bike-ui)
      └── 在 Vercel import → project B (Root Directory = folding-bike-manage)
                              └── 都连到同一个 Neon Storage
```

## 部署步骤

### 1. 推到 GitHub

```bash
cd d:/project/siqi/bicycle/folding-bike
git init
git add .
git commit -m "init"
git branch -M main
git remote add origin https://github.com/<you>/folding-bike.git
git push -u origin main
```

### 2. 创建 Neon 数据库 (Vercel 内一次完成)

1. Vercel Dashboard → **Storage** → **Create Database** → **Neon (Serverless Postgres)**
2. 选好区域,创建即可。**先不要急着连项目**,等下面两个 project 建好后一起连。

### 3. Import 第一个 project — `folding-bike-ui`

1. Vercel → **Add New** → **Project** → 从 GitHub 选 `folding-bike`
2. 配置:
   | 字段 | 值 |
   | --- | --- |
   | **Root Directory** | `folding-bike-ui` |
   | Framework | Next.js (自动识别) |
   | Build / Install Command | 留空(由 `vercel.json` 提供) |
3. **Environment Variables**:暂时留空,先点 Deploy(会失败,正常)。
4. Deploy 后:Storage → 选刚才那个 Neon DB → **Connect Project** → 选 `folding-bike-ui`。
   集成会自动注入 `DATABASE_URL` / `DATABASE_URL_UNPOOLED` 等变量。
5. 触发一次 Redeploy。

### 4. Import 第二个 project — `folding-bike-manage`

跟上面一样,只是:
- **Root Directory** = `folding-bike-manage`
- 同样把 Neon Storage **Connect** 到这个 project
- 额外加两个环境变量:
  - `ADMIN_PASSWORD` — 管理员密码(生产建议用 bcrypt 哈希,见下文)
  - `AUTH_SECRET` — 32 字节随机串(`node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`)

### 5. 第一次建表

用本地连生产 Neon 数据库执行 `db push`(单次操作):

```bash
# 在仓库根目录
vercel link              # 关联到任一 Vercel project (随便选一个)
vercel env pull .env     # 把 DATABASE_URL / DATABASE_URL_UNPOOLED 拉到本地
npm install
npm run db:push          # 创建表
npm run db:seed          # 可选:插入 12 个空白分类
```

> 之后改 schema 改用 `npm run db:migrate -- --name xxx` 生成迁移,提交到 Git,
> 部署时由你手动执行 `npm run db:push` 或 `prisma migrate deploy`(写到部署脚本里也行)。

## 本地开发

```bash
cp .env.example .env
# 填好 4 个变量,或者直接 vercel env pull .env

npm install
npm run db:generate
npm run db:push          # 同步 schema(本地或开发库)

npm run dev:ui           # http://localhost:3001
npm run dev:manage       # http://localhost:3002  (登录密码 = ADMIN_PASSWORD)
```

### 生成 bcrypt 密码

```bash
node -e "console.log(require('bcryptjs').hashSync(process.argv[1], 10))" 'YourPassword'
```

把输出的 `$2a$…` 字符串作为 `ADMIN_PASSWORD` 的值。`auth.ts` 通过 `$2` 前缀自动识别哈希。

## 路由速查

### folding-bike-ui

| 路径 | 说明 |
| --- | --- |
| `/` | 配置器主页 |
| `POST /api/orders` | 提交配置单 |

### folding-bike-manage

| 路径 | 说明 |
| --- | --- |
| `/login` | 登录 |
| `/` | 概览(累计销售/成本/盈利) |
| `/parts` | 分类与配件 CRUD |
| `/orders`, `/orders/[id]` | 配置单列表与详情 |
| `POST /api/auth/{login,logout}` | 登录/退出 |
| `* /api/categories...` `* /api/parts...` | 管理 API |

中间件保护除 `/login` 外的所有路径。

## 常见问题

**Q: Neon pooled 连接报 "prepared statement does not exist"?**
在 `DATABASE_URL` 末尾加 `&pgbouncer=true&connect_timeout=15`(pooled 必须;`DATABASE_URL_UNPOOLED` 不用加)。

**Q: Vercel 构建失败说找不到 `@folding-bike/db`?**
检查 `vercel.json` 是否存在;`installCommand` 必须是 `cd .. && npm install`,确保 npm workspaces 在 monorepo 根目录安装。

**Q: 两个 Vercel project 公用 Neon 用哪种连接?**
两个 project 都各自被 connect 一遍即可,集成会给每个 project 注入相同的 URL,共用同一个数据库实例。
