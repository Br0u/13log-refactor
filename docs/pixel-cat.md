# 像素小猫陪伴组件

## 使用

- 首页点击中央 avatar：开门、探头、钻出、落地。再次点击会召回已出现的小猫。
- 点击小猫聊天，拖动调整位置；“安静一会儿”暂停主动活动，“回家”执行退场。
- 首页回到 avatar 的门，其他页面回到页头 13log。入口不在视野内时在对应视口边缘过渡，不强制滚动页面。
- 在同一标签页刷新、切换页面会保留出现状态；后台隐藏角色且不提取后台内容。
- `/playzone/pixel-cat`：64 个动作 × 8 帧（512 帧）、17 组连续行为；支持逐帧、暂停、重播、左右朝向、深色背景。
- “跳一下”“跳舞”“打滚”“踩奶”“追尾巴”“抓蝴蝶”“睡觉”“醒醒”等明确指令在本地执行，不等待模型、不消耗 AI 额度。提问或否定句不会误触发动作。
- 动作有各自的帧速率及单次/循环规则；移动可打断，跳跃包含蓄力、弧线腾空和落地。对话时保持位置稳定，系统开启减少动态效果时停用精灵和位移动画。
- `/admin/cat`：模型地址、模型名称、密钥、性格、主动说话间隔、全站每日额度。

## AI 配置与部署

1. 在目标环境执行项目既有的 `prisma migrate deploy`，包含 `20260922000000_add_pixel_cat`。该迁移已按用户授权应用到原有 Neon 远程数据库。
2. 保持 `SESSION_SECRET` 稳定，或设置至少 32 字符的 `CAT_SETTINGS_SECRET` 专用于密钥加密。使用 AES-256-GCM；更换加密 secret 后需在后台重新保存 API Key。
3. 登录 Admin → 小猫设置。填写公网 HTTP 或 HTTPS 基础地址（例如 `https://api.example.com/v1`）、模型名称、API Key。HTTP 无地址白名单，可自定义端口；HTTPS 使用 443 端口。HTTP 会明文传输密钥和对话。仍拦截内网/保留地址、URL 账号和查询参数，不跟随重定向。支持 IPv4 可达的 OpenAI Chat Completions 兼容接口；模型须支持 `response_format: {type: "json_object"}`。不会调用浏览器中的第三方 API，也不把密钥下发到浏览器。
4. “测试连接，不保存”验证 JSON 动作协议；成功后再保存。API Key 可选：未保存密钥时留空不发送认证头；已有密钥时留空保留原值，选择删除可改为无密钥调用。修改服务地址时须重新填写或删除原密钥。
5. 默认 AI 关闭。未配置、超时、额度不足或模型回复不合法时，本地动作仍然可用。真实供应商连通性需实际测试；若接口要求认证，仍须提供有效密钥。

回复兼容 JSON 代码块、缺省动作及纯文本台词；无效动作单独丢弃，台词最多保留 800 字符。聊天输出上限为 1024 tokens，后台连接测试为 2048 tokens，连接等待上限为 45 秒。提示词要求日常回答简短，明确要求故事或详解时最多 240 字。

聊天使用 SSE：浏览器先显示 `say` 正文，完整回复校验通过后再执行动作。JSON、思考过程和未校验动作不会显示到气泡中。停止、替换提问、拖动、切页或回家会取消上游请求；仅收起气泡不会取消，之后仍可重新打开。断流保留已收到的文字并提示重试。不支持增量、但直接返回完整 JSON 的服务仍可使用；若服务拒绝 `stream: true`，会报告错误，不自动重复请求。

`/api/cat` 按 `Accept: text/event-stream` 返回 `text`、`done` 或 `error` 事件；未指定时保留 JSON 响应。`done.timing` 提供请求准备、首段正文和总耗时，均以毫秒计。首字速度受模型及网络影响，流式显示不保证固定延迟。

参考协议：[Chat Completions 官方文档](https://developers.openai.com/api/reference/resources/chat)。部分兼容服务不支持 JSON 输出或 `max_tokens`，连接测试会报告失败，不能仅凭 HTTP 200 视为可用。

额度按 UTC 天计算：全站可配，每个访客 IP 每天 40 次、每分钟 6 次；请求失败也消耗预留次数。三项额度在 PostgreSQL 事务中用同一条参数化 SQL 原子预留，任一超限则全部回滚，减少远程数据库往返；数据库不可用时不调用模型。部署代理必须正确覆盖 `x-real-ip` / `x-forwarded-for`；全站额度独立于 IP，无法通过换 IP 绕过。后台管理员主动连接测试不计访客额度。

只提取公开页面正文、可见段落、标题、图片替代文字和用户选中文字；排除表单、评论区、`data-cat-private` 区域。普通闲聊省略正文和目标列表，页面相关问题最多发送 3000 字符正文、6 个目标。未发送图片，不具备照片视觉理解。模型只能选择允许的动作和已提供的目标，台词作为纯文本显示，不能执行脚本、提交表单或跳转。页面切换、拖动、回家会中断过期动作。

## 素材与代码

- `scripts/generate-pixel-cat.mjs`：原创 48×48 整数网格素材，姿态、五官、肢体和道具均可编辑；执行 `node scripts/generate-pixel-cat.mjs` 重建 PNG。
- `lib/pixel-cat/catalog.mjs`：动作顺序、名称、时长、本地指令与连续行为；帧顺序必须与 PNG 保持一致。
- `components/pixel-cat/PixelCat.jsx`：唯一的跨页角色控制器；`page-context.js` 只读取公开内容。
- `lib/pixel-cat/server.ts`：加密、提供方请求、配额、输入输出边界；`contracts.ts` 定义协议。
- `lib/pixel-cat/stream.mjs`：服务端与浏览器共用的 SSE 分帧，以及增量正文提取。
- 门有独立的 8 帧素材；Sprite 不依赖图片生成服务、Canvas 或游戏引擎。素材总大小约 60 KB（不含预览图）。

## 验证

单元与组件测试：`npx vitest run tests/lib/pixel-cat.test.ts tests/lib/pixel-cat-provider.test.ts tests/lib/pixel-cat-stream.test.ts tests/components/pixel-cat.test.jsx tests/app/api/cat.test.ts tests/app/playzone-page.test.jsx`。

真实数据库测试沿用项目的 `TEST_DATABASE_URL` 与 `TEST_DATABASE_GUARD=13log-test-only` 隔离检查：`npm run test:db -- tests/lib/pixel-cat-db.test.ts`。必须是与日常数据库不同、尚无小猫配置的测试库；测试结束删除自己的配置和额度记录。

浏览器证据保存在 `output/playwright/pixel-cat-*.png`。已使用用户保存的免密 Qwen 服务验证真实流式问候与故事；带密钥请求由自动化测试验证。实测与验证范围见 `output/playwright/pixel-cat-preview.md`。
