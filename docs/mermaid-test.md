# Mermaid 图表渲染测试

## 1. 流程图（Flowchart）


```mermaid
graph TD
    A[开始] --> B{是否登录?}
    B -->|是| C[进入首页]
    B -->|否| D[跳转登录页]
    D --> E[输入账号密码]
    E --> F{验证成功?}
    F -->|是| C
    F -->|否| D
    C --> G[结束]
```

## 2. 时序图（Sequence Diagram）

```mermaid
sequenceDiagram
    participant U as 用户
    participant F as 前端
    participant B as 后端
    participant D as 数据库

    U->>F: 点击登录
    F->>B: POST /api/login
    B->>D: 查询用户
    D-->>B: 返回用户数据
    B-->>F: 返回 Token
    F-->>U: 登录成功
```

## 3. 类图（Class Diagram）

```mermaid
classDiagram
    class Animal {
        +String name
        +int age
        +makeSound() void
    }
    class Dog {
        +fetch() void
    }
    class Cat {
        +scratch() void
    }
    Animal <|-- Dog
    Animal <|-- Cat
```

## 4. 甘特图（Gantt）

```mermaid
gantt
    title 项目开发计划
    dateFormat  YYYY-MM-DD
    section 需求阶段
    需求调研   :a1, 2026-01-01, 7d
    需求评审   :after a1, 3d
    section 开发阶段
    前端开发   :a2, after a1, 14d
    后端开发   :a3, after a1, 14d
    section 测试阶段
    联调测试   :a4, after a2, 7d
    上线发布   :after a4, 2d
```

## 5. 饼图（Pie）

```mermaid
pie title 浏览器市场份额
    "Chrome" : 65.2
    "Safari" : 18.7
    "Edge" : 5.3
    "Firefox" : 3.1
    "其他" : 7.7
```

## 6. 状态图（State Diagram）

```mermaid
stateDiagram-v2
    [*] --> 待审核
    待审核 --> 审核中 : 提交审核
    审核中 --> 已通过 : 审核通过
    审核中 --> 已拒绝 : 审核拒绝
    已通过 --> 已发布 : 发布
    已拒绝 --> 待审核 : 重新提交
    已发布 --> [*]
```

## 7. ER 图（Entity Relationship）

```mermaid
erDiagram
    USER ||--o{ ORDER : places
    ORDER ||--|{ LINE_ITEM : contains
    PRODUCT ||--o{ LINE_ITEM : "ordered in"

    USER {
        int id PK
        string name
        string email
    }
    ORDER {
        int id PK
        int user_id FK
        date order_date
    }
    PRODUCT {
        int id PK
        string name
        decimal price
    }
    LINE_ITEM {
        int id PK
        int order_id FK
        int product_id FK
        int quantity
    }
```

## 8. Git 图（Git Graph）

```mermaid
gitGraph
    commit
    commit
    branch develop
    checkout develop
    commit
    commit
    checkout main
    merge develop
    commit
    commit
```
