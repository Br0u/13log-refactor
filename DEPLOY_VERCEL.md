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

当前后台管理员账号默认为：

- 用户名：`admin`
- 密码：`0315`

建议部署上线后尽快修改密码，并同步更新数据库。

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
ADMIN_USERNAME=admin
ADMIN_PASSWORD=0315
SESSION_SECRET=一个足够长的随机字符串
NEXT_PUBLIC_SITE_URL=https://你的正式域名
```

说明如下：

- `DATABASE_URL`：应用运行时使用
- `DIRECT_URL`：Prisma migration 使用
- `SESSION_SECRET`：用于后台登录 session 签名，必须设置为随机长字符串
- `NEXT_PUBLIC_SITE_URL`：用于 RSS、index.json、站点链接输出

## 6. 首次数据库初始化

如果这是第一次部署，需要先把数据库结构建好。

在本地项目目录执行：

```bash
npm run db:generate
npx prisma migrate dev --name init_backend --skip-generate
npm run db:seed
```

如果你希望数据库完全由线上环境管理，也可以在本地先把 migration 跑完，再让 Vercel 只负责应用部署。

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
4. 新文章能在前台看到
5. 点赞功能正常
6. 评论功能正常

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

上线前建议再做两件事：

1. 把 `ADMIN_PASSWORD=0315` 改成你自己的强密码
2. 把 `SESSION_SECRET` 换成高强度随机值

否则后台安全性不够。
