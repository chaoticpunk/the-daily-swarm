# The Daily Swarm — 环境配置与测试网

本指南说明如何配置 LLM、创建 NEAR testnet 账户、填写 `.env.local`，并跑通一次真实 edition、读者支付与分账。

完整的项目说明见 [README.md](README.md)。

> **安全规则：** key 只写进 `.env.local`。不要把私钥、API key 或 seed phrase 提交到 git、贴进 issue、截图或录屏。

## 0. 前提

- Node.js 24（见 `.nvmrc`）
- 一个 OpenAI-compatible LLM key（推荐 NEAR AI Cloud）
- 创建 testnet 账户时使用 `near-cli-rs` 或 MyNearWallet testnet
- 只有 testnet，没有 mainnet 模式

---

## 1. LLM

打开 `.env.local`，选择一种方式。

### NEAR AI Cloud

```bash
NEARAI_CLOUD_API_KEY=你的key
NEARAI_CLOUD_BASE_URL=https://cloud-api.near.ai
NEARAI_MODEL=Qwen/Qwen3.8-27B
LLM_JSON_MODE=false
LLM_CHAT_TEMPLATE_KWARGS={"enable_thinking":false}
```

`Qwen/Qwen3.8-27B` 是当前目录中可用的模型；关闭 thinking 可以避免模型把 token 全花在 reasoning 上而没有最终 JSON。若换用其他模型，请调整 `NEARAI_MODEL`；如果某个 provider 不接受 `chat_template_kwargs`，将 `LLM_CHAT_TEMPLATE_KWARGS` 留空。

查看当前可用模型：

```bash
set -a; . ./.env.local; set +a
curl -s https://cloud-api.near.ai/v1/models \
  -H "Authorization: Bearer $NEARAI_CLOUD_API_KEY" \
  | grep -o '"id":"[^"]*"' | head -20
```

### 其他 OpenAI-compatible 提供商

```bash
LLM_API_KEY=你的key
LLM_BASE_URL=https://你的提供商地址
LLM_MODEL=你的模型ID
```

保持 `NEARAI_CLOUD_API_KEY=` 为空。若模型不支持 `response_format`，设置 `LLM_JSON_MODE=false`；若模型响应较慢，调整 `LLM_TIMEOUT_MS`。

---

## 2. NEAR testnet 账户

默认账户：

```text
daily-swarm.testnet
  editor.daily-swarm.testnet
  reporter-near.daily-swarm.testnet
  reporter-ai.daily-swarm.testnet
  reporter-markets.daily-swarm.testnet
  fact-checker.daily-swarm.testnet
  treasury.daily-swarm.testnet
```

### 2.1 安装 near-cli-rs

```bash
npm install -g near-cli-rs@latest
near --version
```

如果 `near` 命令不可用，按 [NEAR CLI 文档](https://docs.near.org/tools/cli) 使用 brew、cargo 或安装脚本。

### 2.2 创建父账户

```bash
near account create-account sponsor-by-faucet-service daily-swarm.testnet \
  autogenerate-new-keypair save-to-keychain \
  network-config testnet create
```

短命令：

```bash
near create-account daily-swarm.testnet --useFaucet --networkId testnet
```

父账户建议保留至少 6 testnet NEAR，用于创建子账户。如果 `daily-swarm.testnet` 已被占用，换一个唯一父名，并同步修改 `.env.local` 中全部账户名。

### 2.3 创建 desk 子账户

```bash
for acc in editor reporter-near reporter-ai reporter-markets fact-checker; do
  near account create-account fund-myself "$acc.daily-swarm.testnet" '0.5 NEAR' \
    autogenerate-new-keypair save-to-keychain \
    sign-as daily-swarm.testnet network-config testnet sign-with-keychain send
done
```

desk 账户只收款，不需要把它们的 key 填进环境变量。

### 2.4 创建 treasury

```bash
near account create-account fund-myself treasury.daily-swarm.testnet '3 NEAR' \
  autogenerate-new-keypair save-to-keychain \
  sign-as daily-swarm.testnet network-config testnet sign-with-keychain send
```

### 2.5 导出 treasury private key

```bash
near account export-account treasury.daily-swarm.testnet \
  using-private-key network-config testnet
```

把输出的 `ed25519:...` 或 `secp256k1:...` 填入 `.env.local` 的 `NEAR_TREASURY_PRIVATE_KEY`。

- 必须是 full-access key。
- 应用需要 private key 字符串，不接受 seed phrase。若只有 seed phrase，用 wallet 或 CLI 导出 private key。
- 这是唯一需要放进服务器环境变量的私钥。

### 2.6 不用 CLI

也可以在 [MyNearWallet testnet](https://testnet.mynearwallet.com) 手动创建父账户、5 个 desk 子账户和 treasury，给 treasury 充值，再从 treasury 账户导出 full-access private key。

---

## 3. `.env.local` 模板

```bash
# LLM
NEARAI_CLOUD_API_KEY=你的key
NEARAI_CLOUD_BASE_URL=https://cloud-api.near.ai
NEARAI_MODEL=Qwen/Qwen3.8-27B
LLM_JSON_MODE=false
LLM_CHAT_TEMPLATE_KWARGS={"enable_thinking":false}
LLM_TIMEOUT_MS=25000

# NEAR testnet
NEAR_NETWORK=testnet
NEAR_RPC_URL=https://test.rpc.fastnear.com
NEAR_TREASURY_ACCOUNT=treasury.daily-swarm.testnet
NEAR_TREASURY_PRIVATE_KEY=ed25519:...

NEAR_EDITOR_ACCOUNT=editor.daily-swarm.testnet
NEAR_REPORTER_NEAR_ACCOUNT=reporter-near.daily-swarm.testnet
NEAR_REPORTER_AI_ACCOUNT=reporter-ai.daily-swarm.testnet
NEAR_REPORTER_MARKETS_ACCOUNT=reporter-markets.daily-swarm.testnet
NEAR_FACT_CHECKER_ACCOUNT=fact-checker.daily-swarm.testnet
```

> `https://rpc.testnet.near.org` 已废弃并返回 HTTP 429。保持 `NEAR_RPC_URL=https://test.rpc.fastnear.com`，或使用 [NEAR RPC provider list](https://docs.near.org/api/rpc/providers) 中的其他地址。若交易实际存在但验证报 `NEAR_TX_LOOKUP_FAILED`，先检查这里。

不要使用 `NEXT_PUBLIC_` 前缀，不要提交 `.env.local`，不要填 mainnet 私钥。

---

## 4. 检查配置

```bash
# run from the repository root
npm run check:setup
```

期望结果：

- `LLM configured: yes`
- `payouts: signer configured`
- 6 个账户全部 `exists: yes`
- treasury 有非零 testnet NEAR

常见问题：

| 输出 | 处理 |
| --- | --- |
| `configured: NO` | 检查 LLM key、base URL、model |
| `payouts: NOT configured` | 检查 `NEAR_TREASURY_PRIVATE_KEY` |
| 账户 `exists: no` | 回到第 2 节创建/充值 |
| RPC 读取失败 | 检查 `NEAR_RPC_URL`，稍后重试 |

---

## 5. 跑一次真实 edition

```bash
npm run edition
```

脚本会运行真实 LLM，完成：

```text
pitch → commission → write → fact-check → revise/re-check → editor note
```

并把 edition JSON 输出到 stdout；进度日志在 stderr。没有 fixture fallback。

| 错误 | 处理 |
| --- | --- |
| `LLM_NOT_CONFIGURED` | 填好 `.env.local`，重启终端 |
| `LLM_HTTP_401` | 检查 key |
| `LLM_HTTP_404` / model not found | 检查 base URL 和 model ID |
| `LLM_EMPTY_CONTENT` | thinking 模型加 `LLM_CHAT_TEMPLATE_KWARGS={"enable_thinking":false}` |
| `LLM_INVALID_JSON` / `LLM_SCHEMA_VALIDATION` | 设置 `LLM_JSON_MODE=false`；关闭 thinking；重试 |
| `LLM_TIMEOUT` | 增大 `LLM_TIMEOUT_MS`，或换模型/provider |

---

## 6. 启动应用与读者访问

```bash
npm run dev
```

打开 `http://localhost:3000/newsroom`，点击 **Produce today's edition**。完成后打开 edition 页面。

读者可以：

1. 点击 **Connect NEAR testnet wallet**，用 MyNearWallet 支付 1 testnet NEAR；或
2. 如果已经在别处完成转账，点 **Already paid? Verify a transfer**，填入 tx hash 和 sender account。

服务端通过 NEAR RPC 验证 receiver、signer、金额和 final status 后才会解锁。验证成功后，treasury 按固定比例执行分账：

- reporters 55%
- editor 20%
- fact-checker 15%
- treasury 10%（保留在 treasury，不做 self-transfer）

`/ledger` 显示 reader payment 和所有 payout；链上条目有 explorer 链接，本地回退条目会明确标注 `LOCAL · NOT ON-CHAIN`。

---

## 7. 常见问题

### 父账户名被占用

换一个唯一父名，并同步修改 `.env.local` 中 6 个账户名。

### 子账户创建时报余额不足

```bash
near tokens daily-swarm.testnet view-near-balance network-config testnet now
```

降低子账户初始余额，或先给父账户充值。

### 钱包弹窗没有可用账户

- 确认使用 **testnet** MyNearWallet
- 确认钱包里有 testnet NEAR
- 刷新页面后重试
- 用 edition 页的 transfer verification 作为回退

### 验款失败

| 错误码 | 含义 |
| --- | --- |
| `WRONG_RECEIVER` | 付款没有转给配置的 treasury |
| `WRONG_SENDER` | 输入的 sender 与交易签名账户不一致 |
| `UNDERPAID` | 金额不足 1 NEAR |
| `TX_NOT_FINAL` | 交易还未 final，稍后重试 |
| `TX_FAILED` / `TX_RECEIPT_FAILED` | 链上执行失败 |
| `NEAR_TX_LOOKUP_FAILED` | hash/sender 不匹配，或 RPC 地址不可用 |

### payout 显示 local

服务器没有读到 treasury private key，或 `NEAR_NETWORK` 不是 testnet。运行 `npm run check:setup`。

---

## 8. 安全

- 只用 testnet key。
- `.env.local` 已被 git 忽略，不要手动提交。
- 不要在 `NEXT_PUBLIC_*` 中放 key。
- 不要在聊天、issue、截图或录屏中暴露 private key。
- 公开部署时限制或轮换 LLM key，并考虑加 rate limiting。
- testnet 代币没有现实价值，但仍按真实凭据管理。
