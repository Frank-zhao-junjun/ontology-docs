# Ontology 本体模型建模工具

Ontology 是一个面向业务架构师、系统设计师和交付工程师的本体模型可视化建模工具。项目基于 Next.js 16、React 19 和 TypeScript 5 构建，围绕"项目 -> 业务场景 -> 实体 -> 元模型 -> EPC"的链路组织建模和验证能力。

当前仓库同时包含产品介绍页和实际建模工作台：

- `/`：产品介绍、架构说明、路线图和验收标准。
- `/tool`：本体建模工作台。

## 核心能力

### 建模工作台

- 项目与业务场景管理：实体必须归属于具体项目和业务场景，工作台按当前业务场景过滤实体。
- DDD 实体角色：支持 `aggregate_root` 聚合根与 `child_entity` 聚合内子实体，聚合根可承载 EPC 与领域事件链路。
- 数据模型：维护实体、属性、关系、计算属性、数据来源映射等结构。
- 行为模型：维护状态机、状态、状态流转、触发器、动作和副作用。
- 规则模型：维护字段校验、跨字段校验、跨实体校验、聚合校验和时序规则。
- 事件模型：维护领域事件、订阅、事务阶段、幂等键和处理策略。
- EPC 事件说明书：面向聚合根生成只读 EPC 文档，并支持 Markdown、JSON 和整包导出。

### 平台级模型

- 元数据管理：通过模板统一字段语义、数据类型和业务说明。
- 主数据管理：支持主数据定义、字段解析、动态记录和属性引用。
- 指标模型：维护业务指标、公式、单位、绑定动作和度量方式。
- 治理模型：维护角色权限、字段权限和 Agent 策略。
- 数据源模型：维护 API、数据库、文件等外部数据源配置。

### 版本管理与审核

- 版本快照：保存当前工作区的完整模型快照（DataModel / BehaviorModel / RuleModel / EventModel / EpcModel / GovernanceModel / DataSourcesModel / MetricsModel）。
- 版本状态：`draft` → `published` / `pending_review` / `rejected` / `archived`。
- 版本回滚：支持将工作区回滚到任意已发布版本。
- 版本审核：Excel 导入生成的 `pending_review` 版本支持审批通过（应用到工作区）或驳回（填写原因）。

### Excel 导入

- 模板下载：生成含填写说明 + 6 个数据 Sheet（实体 / 属性 / 关系 / 状态机 / 规则 / 事件）的 `.xlsx` 导入模板。
- 文件上传：仅接受 `.xlsx` 格式，5MB 上限制，自动校验 Sheet 结构完整性。
- 数据校验：逐行校验必填字段、枚举值、布尔类型和跨 Sheet 引用完整性，返回行级错误明细。
- 数据解析：校验通过后将 Excel 行数据解析为 Entity / Attribute / Relation / StateMachine / Rule / EventDefinition 模型对象。
- 版本生成：基于解析数据生成 `pending_review` 状态版本（非工作区快照），版本号按日期自动递增。
- 审核流程：审核通过将解析数据应用到工作区（替换当前数据），驳回需填写原因。

## 技术栈

- 应用框架：Next.js 16 App Router
- 前端运行时：React 19
- 语言：TypeScript 5
- UI：shadcn/ui、Radix UI、lucide-react
- 样式：Tailwind CSS 4
- 动画：GSAP
- 状态管理：Zustand + persist
- 数据服务：Supabase / PostgreSQL 适配
- AI 集成：coze-coding-dev-sdk
- 测试：Vitest、Testing Library、happy-dom

## 快速开始

项目强制使用 pnpm。

```bash
pnpm install
pnpm dev
```

启动后访问：

- 产品介绍页：`http://localhost:3000`
- 建模工作台：`http://localhost:3000/tool`

生产构建：

```bash
pnpm build
pnpm start
```

## 常用脚本

```bash
pnpm lint
pnpm ts-check
pnpm test:unit
pnpm test:integration
pnpm test:e2e:smoke
pnpm test:coverage
pnpm run ci:check
```

`pnpm run ci:check` 的执行顺序为：

```text
lint -> ts-check -> unit -> integration -> e2e smoke
```

## 环境变量

项目可以在无远端数据源时使用内置示例数据；接入 Supabase 或远端初始化数据时再配置环境变量。常见变量包括：

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

主数据和元数据初始化接口也支持远端来源覆盖，具体以 `src/app/api/metadata/init/route.ts` 和 `src/app/api/masterdata/init/route.ts` 为准。

## 关键目录

```text
src/
├── app/
│   ├── page.tsx                  # 产品介绍页
│   ├── tool/page.tsx             # 建模工作台入口
│   └── api/
│       ├── agent/skills/         # Agent skills 查询
│       ├── generate-model/       # AI 建模建议
│       ├── excel-import/         # Excel 文件上传与解析
│       ├── excel-template/       # Excel 导入模板下载
│       ├── masterdata/init/      # 主数据初始化
│       ├── metadata/init/        # 元数据初始化
│       └── projects/             # 项目持久化
├── components/
│   ├── landing/                  # 产品介绍页组件
│   └── ontology/                 # 建模工作台组件
├── lib/
│   ├── ai/                       # AI 查询服务
│   ├── epc-generator/            # EPC 文档生成器
│   ├── gstack/                   # Gstack 工作流集成
│   ├── ralph-loop/               # Ralph Loop 代理流程
│   └── superpowers/              # Agent skills 集成
├── storage/database/             # Supabase / 数据库适配
├── store/ontology-store.ts       # 全局状态、迁移和建模动作
└── types/ontology.ts             # 核心类型定义

tests/
├── unit/
├── integration/
├── e2e/
└── fixtures/
```

## 主要接口

```text
GET    /api/projects
POST   /api/projects
GET    /api/projects/:id
PUT    /api/projects/:id
DELETE /api/projects/:id

GET    /api/metadata/init
GET    /api/masterdata/init

GET    /api/excel-template
POST   /api/excel-import

POST   /api/generate-model
```

## 核心契约

建模主类型定义在 `src/types/ontology.ts`。关键模型包括：

- `OntologyProject`
- `DataModel`
- `BehaviorModel`
- `RuleModel`
- `EventModel`
- `EpcModel`
- `GovernanceModel`
- `DataSourcesModel`
- `MetricsModel`
- `ProjectVersion`
- `ExcelParsedData`
- `ExcelImportResult`

## 开发约束

- 必须使用 pnpm，`preinstall` 会通过 `only-allow` 拦截其它包管理器。
- 不要回退到旧字段契约，例如 `scenarioId`、`type`、`metadataId`、`referenceTargetType`、`masterDataIds`。
- 实体业务归属以 `businessScenarioId` 为准，实体角色以 `entityRole` 为准。
- 开发、评审和交接前请参考 `docs/agentic-engineering-checklist.md`。

## 相关文档

- `REQUIREMENT.md`
- `CONTRIBUTING.md`
- `PR_DESCRIPTION.md`
- `docs/agentic-engineering-checklist.md`
- `docs/ontology-enhancement-plan.md`
- `assets/ontology-ai-driven-system-specification-v2.0.md`
- `assets/系统架构设计文档.md`
