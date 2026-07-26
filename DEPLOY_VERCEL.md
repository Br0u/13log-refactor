# 13log 部署说明

## 1. 部署方式

当前项目推荐的部署流程是：

1. 本地完成开发并推送到 GitHub
2. 在 Vercel 中导入 GitHub 仓库
3. 在 Vercel 中配置环境变量
4. 让 Vercel 自动构建和部署
5. 首次部署后执行数据库初始化与文章导入

这条流程适合你现在的个人博客项目。

## 2. 部署前准备

你需要准备好以下内容：

- GitHub 仓库
- Vercel 账号
- Neon PostgreSQL 数据库
- 本项目的环境变量

管理员用户名和密码必须由部署者自行设置。不要把真实凭据写入仓库或部署文档。

## 3. 推送到 GitHub

在本地完成修改后，执行：

```bash
git status
git add .
git commit -m "feat: backend admin and database support"
git push origin <your-branch>
```

如果你要直接部署主分支：

```bash
git checkout main
git merge <your-branch>
git push origin main
```

## 4. 在 Vercel 导入项目

1. 打开 Vercel
2. 点击 `Add New...`
3. 选择 `Project`
4. 选择你的 GitHub 仓库
5. 让 Vercel 自动识别为 Next.js 项目

一般不需要额外修改 Build Command 和 Output 设置，保持默认即可。

## 5. 配置环境变量

在 Vercel 项目设置中，进入：

`Settings -> Environment Variables`

添加以下变量：

```bash
DATABASE_URL=你的 Neon 运行时连接串
DIRECT_URL=你的 Neon 直连连接串
SESSION_SECRET=
RISK_INTERNAL_SECRET=
BLOB_READ_WRITE_TOKEN=你的 Vercel Blob 读写 Token
NEXT_PUBLIC_SITE_URL=https://你的正式域名
```

说明如下：

- `DATABASE_URL`：应用运行时使用
- `DIRECT_URL`：Prisma migration 使用
- `SESSION_SECRET`：用于后台登录 session 签名，必填，必须是至少 32 字符的随机值
- `RISK_INTERNAL_SECRET`：用于内部风险评估请求签名，必填，必须是至少 32 字符的随机值，并且必须与 `SESSION_SECRET` 不同
- `BLOB_READ_WRITE_TOKEN`：用于后台粘贴图片时把文件上传到 Vercel Blob
- `NEXT_PUBLIC_SITE_URL`：用于 RSS、index.json、站点链接输出

分别执行两次以下命令生成两个不同的 secret，不要复用同一次输出：

```bash
openssl rand -base64 48
openssl rand -base64 48
```

上方两个空值故意保持无效，直接复制会 fail closed。必须把第一次命令输出
粘贴为 `SESSION_SECRET`，把第二次独立生成的输出粘贴为
`RISK_INTERNAL_SECRET`，不能把空值部署到任何环境。

在 Vercel 中按实际发布范围为 Preview 和 Production 环境分别配置以上
变量；生产值不要复制到不受同等保护的环境。缺失、过短或相同的 secret
会导致后台 session 创建或内部风险请求签名失败。风险中间件在内部评估或
配置不可用时会 fail open，但这是安全能力降级：访问日志、黑名单执行、
机器人阻止和 API 限流评估都会被禁用，绝不能作为可接受的发布配置。

此文档不表示当前 Vercel 项目已经完成配置。发布前必须在 Vercel 中落实
上述环境变量并重新部署。若更换 `SESSION_SECRET`，现有管理员 session 会
立即失效，管理员需要重新登录；将其作为密钥轮换和发布验证的一部分。

## 6. 首次数据库初始化

如果这是第一次部署，需要先把数据库结构建好。

在本地项目目录执行：

```bash
npm run db:generate
npx prisma migrate dev --name init_backend --skip-generate
```

如果你希望数据库完全由线上环境管理，也可以在本地先把 migration 跑完，再让 Vercel 只负责应用部署。

`ADMIN_USERNAME` 和 `ADMIN_PASSWORD` 不是 Vercel 运行时变量，只是
`npm run db:seed` 从本地 `.env` 读取的一次性 seed 输入。创建管理员或轮换
管理员密码时，必须执行以下流程：

1. 在受保护的本地 `.env` 中设置目标数据库的 `DATABASE_URL`、
   `ADMIN_USERNAME` 和高强度、唯一的 `ADMIN_PASSWORD`
2. 确认 `DATABASE_URL` 指向预期数据库，然后执行 `npm run db:seed`
3. seed 成功后，从本地环境中移除这些管理员凭据，或继续按敏感凭据保护
   `.env`，禁止提交到仓库

对同一 `ADMIN_USERNAME` 再次运行 seed 会更新其密码哈希。仅修改 Vercel
环境变量或重新部署不会创建管理员，也不会更新数据库中的管理员密码。

## 7. 导入真实文章

当前博客的真实文章来自 `content/posts`。

首次部署时，需要执行：

```bash
node --env-file=.env scripts/migrate-markdown-to-db.mjs
```

执行完成后，真实文章会进入数据库，前台和后台都能读取到。

如果后续你已经完全切换到后台写作，就不必重复导入旧文章。

## 8. 本地验证

部署前建议先本地验证：

```bash
npm install
npm run dev
npm test
npm run build
```

然后检查：

- `/admin/login`
- `/admin/posts`
- `/admin/categories`
- `/admin/tags`
- `/admin/comments`
- `/posts`
- `/posts/<slug>`

## 9. 上线后验证

部署完成后，建议检查以下内容：

1. 首页和文章页能正常打开
2. 后台可以登录
3. 可以创建一篇新文章
4. 在文章或 micro post 编辑页粘贴图片可以成功上传并插入 Markdown
5. 新文章能在前台看到
6. 点赞功能正常
7. 评论功能正常

## 10. 常用命令

安装依赖：

```bash
npm install
```

启动开发环境：

```bash
npm run dev
```

运行测试：

```bash
npm test
```

构建生产版本：

```bash
npm run build
```

重新 seed 管理员账号：

```bash
npm run db:seed
```

导入 Markdown 文章：

```bash
node --env-file=.env scripts/migrate-markdown-to-db.mjs
```

清理测试数据：

```bash
npm run db:cleanup:test-data
```

## 11. 建议

上线前必须完成以下事项：

1. 分别生成至少 32 字符且互不相同的 `SESSION_SECRET` 与 `RISK_INTERNAL_SECRET`，替换 Vercel 中的空值
2. 在目标 Preview/Production 环境中配置所需运行时变量并重新部署
3. 使用受保护的本地 `.env` 和 `npm run db:seed` 创建管理员或轮换密码，然后移除或妥善保护本地管理员凭据
4. 确认风险评估已启用，访问日志、黑名单、机器人阻止和 API 限流评估均正常
5. 确认 `SESSION_SECRET` 轮换后旧管理员 session 已失效且可重新登录

这些是实际发布动作；仅修改仓库文档不会更新 Vercel 环境。
