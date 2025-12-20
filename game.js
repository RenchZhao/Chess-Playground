// Game Controller - 游戏控制器
class GameController {
    constructor() {
        this.engine = new ChessEngine();
        this.gameConfig = null;
        this.selectedSquare = null;
        this.highlightedSquares = [];
        this.gameStartTime = Date.now();
        this.gameTimer = null;
        this.isAIThinking = false;
        this.isPlayerTurn = true;
        
        this.init();
    }

    init() {
        this.loadGameConfig();
        this.setupBoard();
        this.setupEventListeners();
        this.startGameTimer();
        this.updateUI();
        
        // 如果是AI先手，让AI走棋
        if (this.gameConfig && 
            ((this.gameConfig.mode === 'human-ai' && this.gameConfig.color === 'black') ||
             this.gameConfig.mode === 'ai-ai')) {
            this.isPlayerTurn = false;
            setTimeout(() => this.makeAIMove(), 1000);
        }
    }

    // 加载游戏配置
    loadGameConfig() {
        const config = localStorage.getItem('chessGameConfig');
        if (config) {
            this.gameConfig = JSON.parse(config);
        } else {
            // 默认配置
            this.gameConfig = {
                mode: 'human-human',
                color: 'white',
                difficulty: 'medium',
                aiSpeed: 'normal'
            };
        }
    }

    // 设置棋盘
    setupBoard() {
        const board = document.getElementById('chessBoard');
        board.innerHTML = '';
        
        const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
        const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];
        
        for (const rank of ranks) {
            for (const file of files) {
                const square = document.createElement('div');
                square.className = 'chess-square';
                square.id = file + rank;
                
                // 设置格子颜色
                const isLight = (files.indexOf(file) + ranks.indexOf(rank)) % 2 === 0;
                square.classList.add(isLight ? 'light' : 'dark');
                
                // 添加点击事件
                square.addEventListener('click', () => this.handleSquareClick(file + rank));
                
                board.appendChild(square);
            }
        }
        
        this.updateBoardDisplay();
    }

    // 设置事件监听器
    setupEventListeners() {
        // 游戏控制按钮
        document.getElementById('newGameBtn').addEventListener('click', () => this.newGame());
        document.getElementById('undoBtn').addEventListener('click', () => this.undoMove());
        document.getElementById('drawBtn').addEventListener('click', () => this.offerDraw());
        document.getElementById('resignBtn').addEventListener('click', () => this.resign());
        
        // 键盘事件
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.clearSelection();
            } else if (e.key === 'u' && e.ctrlKey) {
                e.preventDefault();
                this.undoMove();
            }
        });
    }

    // 处理格子点击
    handleSquareClick(square) {
        if (this.isAIThinking || !this.isPlayerTurn) return;
        
        const piece = this.engine.board[square];
        
        if (this.selectedSquare) {
            // 如果点击的是已选中的格子，取消选择
            if (this.selectedSquare === square) {
                this.clearSelection();
                return;
            }
            
            // 如果点击的是可移动的格子，执行移动
            if (this.highlightedSquares.includes(square)) {
                this.makeMove(this.selectedSquare, square);
                return;
            }
            
            // 如果点击的是自己的其他棋子，重新选择
            if (piece && piece.color === this.engine.currentPlayer) {
                this.selectSquare(square);
                return;
            }
            
            // 否则取消选择
            this.clearSelection();
        } else {
            // 选择棋子
            if (piece && piece.color === this.engine.currentPlayer) {
                this.selectSquare(square);
            }
        }
    }

    // 选择格子
    selectSquare(square) {
        this.clearSelection();
        
        this.selectedSquare = square;
        this.highlightedSquares = this.engine.getLegalMoves(square);
        
        // 更新显示
        document.getElementById(square).classList.add('selected');
        for (const highlightedSquare of this.highlightedSquares) {
            document.getElementById(highlightedSquare).classList.add('highlight');
        }
    }

    // 清除选择
    clearSelection() {
        if (this.selectedSquare) {
            document.getElementById(this.selectedSquare).classList.remove('selected');
        }
        
        for (const square of this.highlightedSquares) {
            document.getElementById(square).classList.remove('highlight');
        }
        
        this.selectedSquare = null;
        this.highlightedSquares = [];
    }

    // 执行移动
    makeMove(fromSquare, toSquare, promotionPiece = null) {
        const success = this.engine.makeMove(fromSquare, toSquare, promotionPiece);
        
        if (success) {
            this.clearSelection();
            this.updateBoardDisplay();
            this.updateUI();
            
            // 处理兵的升变
            const piece = this.engine.board[toSquare];
            if (piece && piece.type === 'pawn' && (toSquare[1] === '1' || toSquare[1] === '8')) {
                this.showPromotionDialog(fromSquare, toSquare);
                return;
            }
            
            // 播放移动音效
            this.playMoveSound();
            
            // 检查游戏是否结束
            if (this.engine.gameState !== 'playing' && this.engine.gameState !== 'check') {
                this.endGame();
                return;
            }
            
            // 切换回合
            this.switchTurn();
            
            // 如果是AI对战模式，让AI走棋
            if (this.shouldAIMove()) {
                this.isPlayerTurn = false;
                setTimeout(() => this.makeAIMove(), this.getAIThinkTime());
            }
        }
    }

    // 显示升变对话框
    showPromotionDialog(fromSquare, toSquare) {
        const modal = document.getElementById('promotionModal');
        const options = document.getElementById('promotionOptions');
        const color = this.engine.board[toSquare].color;
        
        // 清空选项
        options.innerHTML = '';
        
        // 升变选项
        const promotionPieces = ['queen', 'rook', 'bishop', 'knight'];
        const pieceSymbols = { queen: '♕', rook: '♖', bishop: '♗', knight: '♘' };
        const pieceNames = { queen: '后', rook: '车', bishop: '象', knight: '马' };
        
        for (const piece of promotionPieces) {
            const option = document.createElement('div');
            option.className = 'piece-option';
            option.innerHTML = `
                <div class="text-4xl mb-2">${pieceSymbols[piece]}</div>
                <div class="text-sm font-medium">${pieceNames[piece]}</div>
            `;
            
            option.addEventListener('click', () => {
                this.completePromotion(fromSquare, toSquare, piece);
                this.closePromotionDialog();
            });
            
            options.appendChild(option);
        }
        
        modal.classList.remove('hidden');
        
        // 动画效果
        anime({
            targets: '#promotionContent',
            scale: [0.8, 1],
            opacity: [0, 1],
            duration: 300,
            easing: 'easeOutBack'
        });
    }

    // 完成升变
    completePromotion(fromSquare, toSquare, pieceType) {
        // 重新执行移动并指定升变棋子
        this.engine.makeMove(fromSquare, toSquare, pieceType);
        this.updateBoardDisplay();
        this.updateUI();
        
        // 检查游戏是否结束
        if (this.engine.gameState !== 'playing' && this.engine.gameState !== 'check') {
            this.endGame();
            return;
        }
        
        this.switchTurn();
        
        if (this.shouldAIMove()) {
            this.isPlayerTurn = false;
            setTimeout(() => this.makeAIMove(), this.getAIThinkTime());
        }
    }

    // 关闭升变对话框
    closePromotionDialog() {
        const modal = document.getElementById('promotionModal');
        const content = document.getElementById('promotionContent');
        
        anime({
            targets: content,
            scale: [1, 0.8],
            opacity: [1, 0],
            duration: 200,
            easing: 'easeInBack',
            complete: () => {
                modal.classList.add('hidden');
            }
        });
    }

    // AI走棋
    makeAIMove() {
        if (this.engine.gameState !== 'playing' && this.engine.gameState !== 'check') {
            this.endGame();
            return;
        }
        
        this.isAIThinking = true;
        this.updateGameStatus('AI思考中...');
        
        // 使用Web Worker避免阻塞UI
        setTimeout(() => {
            const aiColor = this.engine.currentPlayer;
            const depth = this.engine.aiDepth[this.gameConfig.difficulty] || 4;
            
            const bestMove = this.engine.getBestMove(aiColor, depth);
            
            if (bestMove) {
                // 模拟思考时间
                const thinkTime = this.getAIThinkTime();
                setTimeout(() => {
                    this.engine.makeMove(bestMove.from, bestMove.to);
                    this.updateBoardDisplay();
                    this.updateUI();
                    
                    // 检查游戏是否结束
                    if (this.engine.gameState !== 'playing' && this.engine.gameState !== 'check') {
                        this.endGame();
                        return;
                    }
                    
                    this.switchTurn();
                    this.isAIThinking = false;
                    
                    // 如果是AI对AI模式，继续下一轮
                    if (this.gameConfig.mode === 'ai-ai') {
                        setTimeout(() => this.makeAIMove(), this.getAIThinkTime());
                    }
                }, thinkTime);
            } else {
                this.isAIThinking = false;
                this.endGame();
            }
        }, 100);
    }

    // 获取AI思考时间
    getAIThinkTime() {
        const speedMap = {
            fast: 500,
            normal: 1000,
            slow: 2000
        };
        return speedMap[this.gameConfig.aiSpeed] || 1000;
    }

    // 判断是否应该AI走棋
    shouldAIMove() {
        if (this.gameConfig.mode === 'ai-ai') return true;
        if (this.gameConfig.mode === 'human-ai') {
            return (this.gameConfig.color === 'white' && this.engine.currentPlayer === 'black') ||
                   (this.gameConfig.color === 'black' && this.engine.currentPlayer === 'white');
        }
        return false;
    }

    // 切换回合
    switchTurn() {
        this.isPlayerTurn = !this.shouldAIMove();
        this.updateCurrentPlayer();
    }

    // 更新棋盘显示
    updateBoardDisplay() {
        const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
        const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];
        
        // 清除所有棋子
        for (const rank of ranks) {
            for (const file of files) {
                const square = document.getElementById(file + rank);
                square.innerHTML = '';
                square.classList.remove('check');
            }
        }
        
        // 放置棋子
        for (const [square, piece] of Object.entries(this.engine.board)) {
            if (piece) {
                const squareElement = document.getElementById(square);
                const pieceElement = document.createElement('div');
                pieceElement.className = 'chess-piece';
                pieceElement.textContent = this.getPieceSymbol(piece);
                squareElement.appendChild(pieceElement);
            }
        }
        
        // 高亮被将军的王
        if (this.engine.gameState === 'check') {
            const kingColor = this.engine.currentPlayer;
            const kingSquare = this.engine.kingPositions[kingColor];
            document.getElementById(kingSquare).classList.add('check');
        }
    }

    // 获取棋子符号
    getPieceSymbol(piece) {
        const symbols = {
            white: { king: '♔', queen: '♕', rook: '♖', bishop: '♗', knight: '♘', pawn: '♙' },
            black: { king: '♚', queen: '♛', rook: '♜', bishop: '♝', knight: '♞', pawn: '♟' }
        };
        return symbols[piece.color][piece.type];
    }

    // 更新UI
    updateUI() {
        this.updateCurrentPlayer();
        this.updateGameStatus();
        this.updateMoveHistory();
        this.updateCapturedPieces();
        this.updateGameStats();
        this.updateControlButtons();
    }

    // 更新当前玩家显示
    updateCurrentPlayer() {
        const currentPlayerDiv = document.getElementById('currentPlayer');
        const isWhiteTurn = this.engine.currentPlayer === 'white';
        
        currentPlayerDiv.innerHTML = `
            <span class="status-indicator ${isWhiteTurn ? 'status-white' : 'status-black'}"></span>
            <span class="text-sm font-medium text-gray-700">${isWhiteTurn ? '白方' : '黑方'}回合</span>
        `;
    }

    // 更新游戏状态
    updateGameStatus(customMessage = null) {
        const statusDiv = document.getElementById('gameStatus');
        
        if (customMessage) {
            statusDiv.textContent = customMessage;
            return;
        }
        
        const stateMessages = {
            playing: '游戏进行中',
            check: '将军！',
            checkmate: '将死！',
            stalemate: '逼和',
            draw: '和棋',
            white_wins: '白方获胜！',
            black_wins: '黑方获胜！'
        };
        
        statusDiv.textContent = stateMessages[this.engine.gameState] || '游戏进行中';
    }

    // 更新走法历史
    updateMoveHistory() {
        const historyDiv = document.getElementById('moveHistory');
        
        if (this.engine.moveHistory.length === 0) {
            historyDiv.innerHTML = '<div class="text-center text-gray-500 py-4">游戏尚未开始</div>';
            return;
        }
        
        let html = '';
        for (let i = 0; i < this.engine.moveHistory.length; i += 2) {
            const moveNumber = Math.floor(i / 2) + 1;
            const whiteMove = this.engine.moveHistory[i];
            const blackMove = this.engine.moveHistory[i + 1];
            
            html += `<div class="move-item">`;
            html += `${moveNumber}. ${this.formatMove(whiteMove)}`;
            if (blackMove) {
                html += ` ${this.formatMove(blackMove)}`;
            }
            html += `</div>`;
        }
        
        historyDiv.innerHTML = html;
        historyDiv.scrollTop = historyDiv.scrollHeight;
    }

    // 格式化走法显示
    formatMove(move) {
        const piece = move.piece;
        const from = move.from;
        const to = move.to;
        
        let notation = '';
        
        // 棋子类型（兵不显示）
        if (piece.type !== 'pawn') {
            notation += piece.type.charAt(0).toUpperCase();
        }
        
        // 起始位置
        notation += from;
        
        // 吃子
        if (move.captured) {
            notation = notation.replace(/.$/, 'x') + to;
        } else {
            notation += to;
        }
        
        // 特殊标记
        if (move.isCastling) {
            notation = to[0] === 'g' ? 'O-O' : 'O-O-O';
        }
        if (move.isEnPassant) {
            notation += ' e.p.';
        }
        if (move.isPromotion) {
            notation += '=' + move.promotionPiece.charAt(0).toUpperCase();
        }
        
        return notation;
    }

    // 更新被吃棋子显示
    updateCapturedPieces() {
        const capturedByWhite = document.getElementById('capturedByWhite');
        const capturedByBlack = document.getElementById('capturedByBlack');
        
        // 统计被吃棋子
        const captured = { white: [], black: [] };
        
        for (const move of this.engine.moveHistory) {
            if (move.captured) {
                const capturerColor = move.piece.color;
                const capturedColor = move.captured.color;
                
                if (capturedColor === 'black') {
                    captured.white.push(move.captured);
                } else {
                    captured.black.push(move.captured);
                }
            }
        }
        
        // 更新显示
        capturedByWhite.innerHTML = captured.white
            .map(piece => `<span class="captured-piece">${this.getPieceSymbol(piece)}</span>`)
            .join('');
            
        capturedByBlack.innerHTML = captured.black
            .map(piece => `<span class="captured-piece">${this.getPieceSymbol(piece)}</span>`)
            .join('');
    }

    // 更新游戏统计
    updateGameStats() {
        // 更新回合数
        document.getElementById('currentTurn').textContent = `第${this.engine.fullmoveNumber}回合`;
        
        // 更新总步数
        document.getElementById('totalMoves').textContent = this.engine.moveHistory.length;
        
        // 悔棋按钮状态
        const undoBtn = document.getElementById('undoBtn');
        undoBtn.disabled = this.engine.moveHistory.length === 0 || 
                          this.gameConfig.mode === 'ai-ai' ||
                          this.isAIThinking;
    }

    // 更新控制按钮状态
    updateControlButtons() {
        const gameOver = this.engine.gameState !== 'playing' && this.engine.gameState !== 'check';
        
        document.getElementById('newGameBtn').disabled = false;
        document.getElementById('undoBtn').disabled = this.engine.moveHistory.length === 0 || gameOver;
        document.getElementById('drawBtn').disabled = gameOver || this.gameConfig.mode === 'ai-ai';
        document.getElementById('resignBtn').disabled = gameOver;
    }

    // 开始游戏计时器
    startGameTimer() {
        this.gameTimer = setInterval(() => {
            const elapsed = Math.floor((Date.now() - this.gameStartTime) / 1000);
            const minutes = Math.floor(elapsed / 60);
            const seconds = elapsed % 60;
            document.getElementById('gameTime').textContent = 
                `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }, 1000);
    }

    // 播放移动音效
    playMoveSound() {
        // 这里可以添加音效播放逻辑
        // 由于浏览器限制，需要用户交互后才能播放音频
    }

    // 新游戏
    newGame() {
        if (this.gameTimer) {
            clearInterval(this.gameTimer);
        }
        
        this.engine = new ChessEngine();
        this.selectedSquare = null;
        this.highlightedSquares = [];
        this.gameStartTime = Date.now();
        this.isAIThinking = false;
        this.isPlayerTurn = true;
        
        this.setupBoard();
        this.updateUI();
        this.startGameTimer();
        
        // 关闭游戏结束弹窗
        this.closeGameOver();
        
        // 如果是AI先手
        if (this.shouldAIMove()) {
            this.isPlayerTurn = false;
            setTimeout(() => this.makeAIMove(), 1000);
        }
    }

    // 悔棋
    undoMove() {
        if (this.engine.moveHistory.length === 0) return;
        
        // 在人对人模式下可以直接悔棋
        // 在人机模式下，需要撤销双方的移动
        if (this.gameConfig.mode === 'human-ai') {
            // 撤销玩家的移动
            this.engine.undoMove();
            
            // 如果还有AI的移动，也撤销
            if (this.engine.moveHistory.length > 0 && 
                this.engine.moveHistory[this.engine.moveHistory.length - 1].piece.color !== this.gameConfig.color) {
                this.engine.undoMove();
            }
        } else {
            // 人对人模式，只撤销一步
            this.engine.undoMove();
        }
        
        this.clearSelection();
        this.updateBoardDisplay();
        this.updateUI();
        this.isPlayerTurn = !this.shouldAIMove();
    }

    // 提和
    offerDraw() {
        if (confirm('确定要提和吗？')) {
            this.engine.gameState = 'draw';
            this.endGame();
        }
    }

    // 认输
    resign() {
        if (confirm('确定要认输吗？')) {
            const winner = this.gameConfig.color === 'white' ? 'black' : 'white';
            this.engine.gameState = winner + '_wins';
            this.endGame();
        }
    }

    // 游戏结束
    endGame() {
        if (this.gameTimer) {
            clearInterval(this.gameTimer);
        }
        
        this.showGameOver();
        this.updateControlButtons();
    }

    // 显示游戏结束弹窗
    showGameOver() {
        const modal = document.getElementById('gameOverModal');
        const icon = document.getElementById('gameOverIcon');
        const title = document.getElementById('gameOverTitle');
        const message = document.getElementById('gameOverMessage');
        
        const gameState = this.engine.gameState;
        
        // 根据游戏结果设置显示
        switch (gameState) {
            case 'white_wins':
                icon.className = 'w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center';
                icon.innerHTML = '<span class="text-4xl text-white">👑</span>';
                title.textContent = '白方获胜！';
                message.textContent = '恭喜白方取得胜利！';
                break;
            case 'black_wins':
                icon.className = 'w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center';
                icon.innerHTML = '<span class="text-4xl text-white">👑</span>';
                title.textContent = '黑方获胜！';
                message.textContent = '恭喜黑方取得胜利！';
                break;
            case 'stalemate':
                icon.className = 'w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center';
                icon.innerHTML = '<span class="text-4xl text-white">🤝</span>';
                title.textContent = '逼和！';
                message.textContent = '双方子力相当，无法将死对方。';
                break;
            case 'draw':
                icon.className = 'w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center';
                icon.innerHTML = '<span class="text-4xl text-white">🤝</span>';
                title.textContent = '和棋！';
                message.textContent = '双方同意和棋。';
                break;
            default:
                return;
        }
        
        modal.classList.remove('hidden');
        
        // 动画效果
        anime({
            targets: '#gameOverContent',
            scale: [0.8, 1],
            opacity: [0, 1],
            duration: 500,
            easing: 'easeOutBack'
        });
    }

    // 关闭游戏结束弹窗
    closeGameOver() {
        const modal = document.getElementById('gameOverModal');
        modal.classList.add('hidden');
    }

    // 返回主页
    goHome() {
        if (this.gameTimer) {
            clearInterval(this.gameTimer);
        }
        
        anime({
            targets: 'body',
            opacity: [1, 0],
            duration: 300,
            easing: 'easeInOutQuad',
            complete: () => {
                window.location.href = 'index.html';
            }
        });
    }
}

// 全局函数
function newGame() {
    gameController.newGame();
}

function undoMove() {
    gameController.undoMove();
}

function closeGameOver() {
    gameController.closeGameOver();
}

function goHome() {
    gameController.goHome();
}

// 页面加载完成后初始化
let gameController;
document.addEventListener('DOMContentLoaded', () => {
    gameController = new GameController();
    
    // 页面入场动画
    anime({
        targets: 'body',
        opacity: [0, 1],
        duration: 500,
        easing: 'easeOutQuad'
    });
});

// 页面卸载时清理
window.addEventListener('beforeunload', () => {
    if (gameController && gameController.gameTimer) {
        clearInterval(gameController.gameTimer);
    }
});