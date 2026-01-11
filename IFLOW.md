# IFLOW - 国际象棋对弈APP

## 项目概述

这是一个功能完整的国际象棋对弈应用，名为"Chess Master"，支持多种对战模式，具有精美的界面设计和强大的AI对手。项目采用纯前端技术栈实现，无需后端服务即可运行。

### 核心特性
- **三种对战模式**：人对电脑、电脑对电脑、人对人
- **智能AI对手**：基于Minimax算法 + Alpha-Beta剪枝
- **完整规则支持**：王车易位、吃过路兵、兵升变等特殊规则
- **实时状态检测**：将军、将死、逼和自动判定
- **响应式设计**：适配桌面端和移动端

## 技术栈

### 前端技术
- **HTML5** - 语义化结构
- **CSS3** - 现代样式和动画
- **JavaScript ES6+** - 模块化编程
- **Tailwind CSS** - 实用优先的CSS框架

### 核心库
- **Anime.js** - 流畅的动画效果
- **PIXI.js** - 高性能图形渲染（预留）
- **Splitting.js** - 文字动画效果
- **Google Fonts** - Noto Sans/Serif SC 字体

## 项目结构

```
/
├── index.html          # 主页面 - 游戏模式选择
├── game.html           # 游戏页面 - 实际对弈界面
├── main.js             # 主页JavaScript逻辑
├── game.js             # 游戏控制器
├── chess-engine.js     # 象棋游戏引擎（核心）
├── resources/          # 资源文件夹
│   ├── chess-hero.jpg  # 英雄区域背景图
│   ├── chess-abstract.jpg # 抽象策略图
│   └── chess-hands.jpg # 手部操作图
├── design.md           # 设计风格指南
├── interaction.md      # 交互设计文档
├── outline.md          # 项目概述
├── README.md           # 项目说明文档
└── IFLOW.md            # 本文件
```

## 核心模块说明

### chess-engine.js
**ChessEngine类** - 游戏核心引擎
- 棋盘状态管理（8x8标准棋盘）
- 移动合法性验证
- 特殊规则处理（易位、吃过路兵、升变）
- AI决策算法（Minimax + Alpha-Beta剪枝）
- 游戏状态检测（将军、将死、逼和）

**关键方法：**
- `getLegalMoves(square)` - 获取指定位置所有合法移动
- `makeMove(from, to, promotion)` - 执行移动
- `getBestMove(color, depth)` - AI获取最佳移动
- `evaluatePosition()` - 评估当前局面
- `isInCheck(color)` - 检测是否被将军

### game.js
**GameController类** - 游戏控制器
- 用户界面交互管理
- 棋盘渲染和更新
- 回合控制和AI对战逻辑
- 游戏状态显示和历史记录
- 弹窗管理（升变、游戏结束等）

**关键方法：**
- `handleSquareClick(square)` - 处理格子点击
- `makeMove(from, to, promotion)` - 执行玩家移动
- `makeAIMove()` - AI自动走棋
- `updateBoardDisplay()` - 更新棋盘显示
- `showPromotionDialog()` - 显示升变选择

### main.js
**ChessApp类** - 主页应用逻辑
- 游戏模式选择和配置
- 动画效果初始化
- 页面切换和导航
- 本地存储管理

## 游戏规则实现

### 棋子移动规则
- **兵**：前进一格，斜向吃子，首次可前进两格
- **车**：横向或纵向任意距离
- **象**：斜向任意距离
- **马**：L形移动，可跨越棋子
- **后**：车+象的移动方式
- **王**：任意方向一格移动

### 特殊规则
- **王车易位**：王和车同时移动，王移动两格
- **吃过路兵**：兵首次前进两格时，相邻兵可斜向吃掉
- **兵升变**：兵到达对方底线时升变为后、车、象或马
- **将军与将死**：王被攻击时必须应将，无法应将即为将死

### 和棋条件
- 逼和：无合法移动且不被将军
- 三次重复局面
- 50步规则
- 子力不足
- 双方同意

## AI算法

### Minimax算法
- **评估函数**：棋子价值 + 位置评估 + 王的安全
- **搜索深度**：初级2层，中级4层，高级6-8层
- **Alpha-Beta剪枝**：优化搜索效率

### 位置评估
- **棋子价值**：兵100，马280，象320，车479，后929，王60000
- **位置表**：基于Stockfish的Piece Square Tables
- **中心控制奖励**：鼓励控制中心格子
- **王的安全评估**：王的位置和周围保护

## 开发指南

### 本地运行
```bash
# 使用Python内置服务器
python -m http.server 8000

# 或使用Node.js
npx serve .

# 访问
http://localhost:8000
```

### 代码规范
- 使用ES6+语法，模块化设计
- 类名采用PascalCase（如ChessEngine）
- 方法名采用camelCase（如getLegalMoves）
- 常量使用UPPER_SNAKE_CASE
- 添加适当注释说明复杂逻辑

### 调试技巧
- 在chess-engine.js中设置`console.log`输出AI思考过程
- 使用浏览器的开发者工具查看棋盘状态
- 在getLegalMoves中添加调试信息检查移动生成
- 评估函数返回值可反映AI对局面的判断

## 扩展建议

### 功能增强
- 添加PGN格式支持，导入/导出对局
- 实现计时器功能（快棋、标准棋）
- 添加开局库，提升AI开局表现
- 支持FEN字符串，自定义初始局面

### 性能优化
- 使用Web Worker处理AI计算，避免UI阻塞
- 实现置换表（Transposition Table）缓存已评估局面
- 优化移动生成算法，减少重复计算
- 添加渐进 deepening，提升搜索效率

### UI改进
- 添加3D棋盘渲染选项
- 实现拖拽移动棋子
- 添加音效和背景音乐
- 支持主题切换（不同棋盘和棋子样式）

## 常见问题

### Q: AI思考时间过长？
A: 降低难度等级（difficulty），或减少搜索深度。可在chess-engine.js中调整`aiDepth`配置。

### Q: 浏览器兼容性问题？
A: 确保使用现代浏览器（Chrome 60+, Firefox 60+, Safari 12+, Edge 79+）。IE浏览器不支持。

### Q: 如何修改棋子样式？
A: 修改`getPieceSymbol()`方法中的Unicode符号，或添加自定义字体/图片渲染逻辑。

### Q: AI水平如何调整？
A: 在chess-engine.js中：
- 调整`aiDepth`改变搜索深度
- 修改`pieceValues`调整棋子价值
- 优化`evaluatePosition()`改进评估函数

## 许可证

MIT License - 仅供学习和演示使用

## 联系信息

专为象棋爱好者打造，享受智慧对决的乐趣！
