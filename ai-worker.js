// AI Worker - 在独立线程中执行AI计算
// 接收棋盘状态和搜索参数，返回最佳移动

// 加载ChessEngine类定义
importScripts('chess-engine.js');

let engine = null;

// 初始化引擎
function initEngine(boardState, gameConfig) {
    if (!engine) {
        // 加载ChessEngine类定义
        engine = new ChessEngine();
    }
    
    // 恢复棋盘状态（如果有）
    if (boardState) {
        engine.loadGameState(boardState);
    }
    
    return engine;
}

// 执行搜索
function searchBestMove(data) {
    const { boardState, color, difficulty, maxTime } = data;
    
    // 初始化引擎（如果boardState为null，使用全新引擎）
    let searchEngine;
    if (boardState) {
        searchEngine = initEngine(boardState);
    } else {
        // 没有boardState，创建新引擎
        searchEngine = new ChessEngine();
    }
    
    // 设置搜索深度
    const depth = searchEngine.aiDepth[difficulty] || 4;
    
    // 执行搜索
    let bestMove;
    if (maxTime && maxTime > 0) {
        // 使用迭代加深（带时间限制）
        bestMove = searchEngine.getBestMoveWithTimeLimit(color, maxTime);
    } else {
        // 使用固定深度
        bestMove = searchEngine.getBestMove(color, depth);
    }
    
    return bestMove;
}

// 消息处理
self.addEventListener('message', function(e) {
    const { type, data } = e.data;
    
    try {
        switch (type) {
            case 'init':
                // 初始化
                initEngine(data.boardState, data.gameConfig);
                self.postMessage({ type: 'ready' });
                break;
                
            case 'search':
                // 执行搜索
                const startTime = performance.now();
                const move = searchBestMove(data);
                const endTime = performance.now();
                
                self.postMessage({
                    type: 'result',
                    data: {
                        move: move,
                        searchTime: endTime - startTime,
                        nodesEvaluated: 0 // 可以添加节点计数
                    }
                });
                break;
                
            case 'stop':
                // 停止搜索（可以实现更细粒度的控制）
                break;
                
            default:
                self.postMessage({
                    type: 'error',
                    data: 'Unknown message type: ' + type
                });
        }
    } catch (error) {
        self.postMessage({
            type: 'error',
            data: error.message
        });
    }
});

// 通知主线程worker已加载
self.postMessage({ type: 'loaded' });
