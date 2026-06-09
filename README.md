# Ontology 本体模型建模工具

Ontology 是一个面向业务架构师、系统设计师和交付工程师的本体模型可视化建模工具。项目基于 Next.js 16、React 19 和 TypeScript 5 构建，围绕“项目 -> 业务场景 -> 实体 -> 元模型 -> Manifest / EPC / 运行时代码包”的链路组织建模、导出和验证能力。

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

### 导出与运行

- Manifest 编译：将 `OntologyProject` 编译为平台交付契约 `OntologyManifest`。
- Manifest 校验：校验 Manifest 结构、引用完整性、治理约束、事件约束和数据源约束。
- 配置导出：支持建模配置和 EPC 产物导出。
- 代码生成：按项目版本生成运行时代码包，包括 Flask 后端、React 前端、SQLite 初始化脚本、Docker 配置和可选 AI Agent。
- AI 辅助：提供模型生成接口和 agent skills 查询接口，为后续 Agentic Engineering 流程预留集成点。

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
│       ├── codegen/              # 运行时代码生成
│       ├── export/               # 配置与产物导出
│       ├── generate-model/       # AI 建模建议
│       ├── masterdata/init/      # 主数据初始化
│       ├── metadata/init/        # 元数据初始化
│       └── projects/             # 项目持久化
├── components/
│   ├── landing/                  # 产品介绍页组件
│   └── ontology/                 # 建模工作台组件
├── lib/
│   ├── ai/                       # AI 查询服务
│   ├── code-generator/           # Flask/React/SQLite 代码包生成器
│   ├── configexporter/           # 配置导出器
│   ├── epc-generator/            # EPC 文档生成器
│   ├── gstack/                   # Gstack 工作流集成
│   ├── manifest-compiler/        # OntologyProject -> OntologyManifest
│   ├── manifest-validator/       # Manifest 校验规则
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

POST   /api/generate-model
GET    /api/export
POST   /api/export
GET    /api/codegen
POST   /api/codegen
GET    /api/agent/skills
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

Manifest 交付契约由 `src/lib/manifest-compiler` 生成，并由 `src/lib/manifest-validator` 校验。新增导出、运行时或 Agent 能力时，应优先对齐这两层契约。

## 开发约束

- 必须使用 pnpm，`preinstall` 会通过 `only-allow` 拦截其它包管理器。
- 不要回退到旧字段契约，例如 `scenarioId`、`type`、`metadataId`、`referenceTargetType`、`masterDataIds`。
- 实体业务归属以 `businessScenarioId` 为准，实体角色以 `entityRole` 为准。
- Manifest 相关改动需要同时覆盖编译器、校验器和测试夹具。
- 开发、评审和交接前请参考 `docs/agentic-engineering-checklist.md`。

## 相关文档

- `REQUIREMENT.md`
- `CONTRIBUTING.md`
- `PR_DESCRIPTION.md`
- `docs/agentic-engineering-checklist.md`
- `docs/P0-manifest-alignment-tasks.md`
- `docs/ontology-enhancement-plan.md`
- `assets/ontology-ai-driven-system-specification-v2.0.md`
- `assets/系统架构设计文档.md`
