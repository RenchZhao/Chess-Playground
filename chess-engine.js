// Chess Engine - 国际象棋游戏引擎
class ChessEngine {
    constructor() {
        this.board = this.initializeBoard();
        this.currentPlayer = 'white';
        this.gameState = 'playing'; // playing, check, checkmate, stalemate, draw
        this.moveHistory = [];
        this.capturedPieces = { white: [], black: [] };
        this.castlingRights = {
            white: { kingSide: true, queenSide: true },
            black: { kingSide: true, queenSide: true }
        };
        this.enPassantTarget = null;
        this.halfmoveClock = 0;
        this.fullmoveNumber = 1;
        this.kingPositions = { white: 'e1', black: 'e8' };
        
        // AI相关
        this.aiDepth = {
            easy: 2,
            medium: 4,
            hard: 8
        };
        
        // 棋子价值
        this.pieceValues = {
            // 'pawn': 100,
            // 'knight': 320,
            // 'bishop': 330,
            // 'rook': 500,
            // 'queen': 900,
            // 'king': 20000
            'pawn': 100,
            'knight': 280,
            'bishop': 320,
            'rook': 479,
            'queen': 929,
            'king': 60000  // 极大值
        };

        // // 位置得分权重（占总价值的百分比）
        // this.positionWeights = {
        //     'pawn': 0.15,      // 兵：位置占15%
        //     'knight': 0.08,    // 马：8%
        //     'bishop': 0.08,    // 象：8%
        //     'rook': 0.05,      // 车：5%
        //     'queen': 0.02,     // 后：2%（后本身强大，位置影响小）
        //     'king': 0.01       // 王：1%（主要靠专门的安全评估）
        // };
        
        // // 位置评估表
        // this.pieceSquareTables = this.initializePieceSquareTables();

        // 纯位置得分（相对值）
        this.rawPST = this.initializeRawPST();
        
        // 预处理：将棋子价值加到位置表上
        this.pst = this.mergeValueWithPST();
    }

    // 初始化棋盘
    initializeBoard() {
        const board = {};
        const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
        const ranks = ['1', '2', '3', '4', '5', '6', '7', '8'];
        
        // 初始化空棋盘
        for (const rank of ranks) {
            for (const file of files) {
                board[file + rank] = null;
            }
        }
        
        // 设置初始位置
        const initialSetup = {
            // 白方
            'a1': { type: 'rook', color: 'white' },
            'b1': { type: 'knight', color: 'white' },
            'c1': { type: 'bishop', color: 'white' },
            'd1': { type: 'queen', color: 'white' },
            'e1': { type: 'king', color: 'white' },
            'f1': { type: 'bishop', color: 'white' },
            'g1': { type: 'knight', color: 'white' },
            'h1': { type: 'rook', color: 'white' },
            'a2': { type: 'pawn', color: 'white' },
            'b2': { type: 'pawn', color: 'white' },
            'c2': { type: 'pawn', color: 'white' },
            'd2': { type: 'pawn', color: 'white' },
            'e2': { type: 'pawn', color: 'white' },
            'f2': { type: 'pawn', color: 'white' },
            'g2': { type: 'pawn', color: 'white' },
            'h2': { type: 'pawn', color: 'white' },
            
            // 黑方
            'a8': { type: 'rook', color: 'black' },
            'b8': { type: 'knight', color: 'black' },
            'c8': { type: 'bishop', color: 'black' },
            'd8': { type: 'queen', color: 'black' },
            'e8': { type: 'king', color: 'black' },
            'f8': { type: 'bishop', color: 'black' },
            'g8': { type: 'knight', color: 'black' },
            'h8': { type: 'rook', color: 'black' },
            'a7': { type: 'pawn', color: 'black' },
            'b7': { type: 'pawn', color: 'black' },
            'c7': { type: 'pawn', color: 'black' },
            'd7': { type: 'pawn', color: 'black' },
            'e7': { type: 'pawn', color: 'black' },
            'f7': { type: 'pawn', color: 'black' },
            'g7': { type: 'pawn', color: 'black' },
            'h7': { type: 'pawn', color: 'black' }
        };
        
        for (const [square, piece] of Object.entries(initialSetup)) {
            board[square] = piece;
        }
        
        return board;
    }

    // 初始化位置评估表
    initializeRawPST() {
        return {
            pawn: {
                white: [
                    [  0,   0,   0,   0,   0,   0,   0,   0],
                    [ 78,  83,  86,  73, 102,  82,  85,  90],
                    [  7,  29,  21,  44,  40,  31,  44,   7],
                    [-17,  16,  -2,  15,  14,   0,  15, -13],
                    [-26,   3,  10,   9,   6,   1,   0, -23],
                    [-22,   9,   5, -11, -10,  -2,   3, -19],
                    [-31,   8,  -7, -37, -36, -14,   3, -31],
                    [  0,   0,   0,   0,   0,   0,   0,   0]
                ],
                black: null  // 将在下方自动生成
            },
            knight: {
                white: [
                    [-66, -53, -75, -75, -10, -55, -58, -70],
                    [ -3,  -6, 100, -36,   4,  62,  -4, -14],
                    [ 10,  67,   1,  74,  73,  27,  62,  -2],
                    [ 24,  24,  45,  37,  33,  41,  25,  17],
                    [ -1,   5,  31,  21,  22,  35,   2,   0],
                    [-18,  10,  13,  22,  18,  15,  11, -14],
                    [-23, -15,   2,   0,   2,   0, -23, -20],
                    [-74, -23, -26, -24, -19, -35, -22, -69]
                ],
                black: null
            },
            bishop: {
                white: [
                    [-59, -78, -82, -76, -23,-107, -37, -50],
                    [-11,  20,  35, -42, -39,  31,   2, -22],
                    [ -9,  39, -32,  41,  52, -10,  28, -14],
                    [ 25,  17,  20,  34,  26,  25,  15,  10],
                    [ 13,  10,  17,  23,  17,  16,   0,   7],
                    [ 14,  25,  24,  15,   8,  25,  20,  15],
                    [ 19,  20,  11,   6,   7,   6,  20,  16],
                    [ -7,   2, -15, -12, -14, -15, -10, -10]
                ],
                black: null
            },
            rook: {
                white: [
                    [ 35,  29,  33,   4,  37,  33,  56,  50],
                    [ 55,  29,  56,  67,  55,  62,  34,  60],
                    [ 19,  35,  28,  33,  45,  27,  25,  15],
                    [  0,   5,  16,  13,  18,  -4,  -9,  -6],
                    [-28, -35, -16, -21, -13, -29, -46, -30],
                    [-42, -28, -42, -25, -25, -35, -26, -46],
                    [-53, -38, -31, -26, -29, -43, -44, -53],
                    [-30, -24, -18,   5,  -2, -18, -31, -32]
                ],
                black: null
            },
            queen: {
                white: [
                    [  6,   1,  -8,-104,  69,  24,  88,  26],
                    [ 14,  32,  60, -10,  20,  76,  57,  24],
                    [ -2,  43,  32,  60,  72,  63,  43,   2],
                    [  1, -16,  22,  17,  25,  20, -13,  -6],
                    [-14, -15,  -2,  -5,  -1, -10, -20, -22],
                    [-30,  -6, -13, -11, -16, -11, -16, -27],
                    [-36, -18,   0, -19, -15, -15, -21, -38],
                    [-39, -30, -31, -13, -31, -36, -34, -42]
                ],
                black: null
            },
            king: {
                white: [
                    [  4,  54,  47, -99, -99,  60,  83, -62],
                    [-32,  10,  55,  56,  56,  55,  10,   3],
                    [-62,  12, -57,  44, -67,  28,  37, -31],
                    [-55,  50,  11,  -4, -19,  13,   0, -49],
                    [-55, -43, -52, -28, -51, -47,  -8, -50],
                    [-47, -42, -43, -79, -64, -32, -29, -32],
                    [ -4,   3, -14, -50, -57, -18,  13,   4],
                    [ 17,  30,  -3, -14,   6,  -1,  40,  18]
                ],
                black: null
            }
        };
    }

    // 将棋子价值加到每个位置得分上
    mergeValueWithPST() {
        const pst = {};
        const pieces = ['pawn', 'knight', 'bishop', 'rook', 'queen', 'king'];
        
        for (const pieceName of pieces) {
            const baseValue = this.pieceValues[pieceName];
            const rawTable = this.rawPST[pieceName];
            
            // 为白方和黑方生成表
            pst[pieceName] = {
                white: this.combineRowForColor(rawTable.white, baseValue),
                black: this.combineRowForColor(rawTable.white, baseValue, true) // 黑方翻转
            };
        }
        
        return pst;
    }

    // 合并单行数据（可选翻转给黑方用）
    combineRowForColor(table, baseValue, flip = false) {
        const result = [];
        
        for (let i = 0; i < 8; i++) {
            const row = table[i];
            const processedRow = row.map(val => val + baseValue);
            
            if (flip) {
                result.unshift(processedRow);  // 黑方：翻转行顺序
            } else {
                result.push(processedRow);     // 白方：正常顺序
            }
        }

        return result.flat();
    }

    // 获取棋子在指定位置的所有合法移动
    getLegalMoves(square, playColor = this.currentPlayer) {
        console.log(`getLegalMoves(${square}, color=${playColor})`);
        const piece = this.board[square];
        if (!piece || piece.color !== playColor) {
            return [];
        }
        console.log(`⚠️ 在 ${square} 有${piece.color}色棋子 ${piece.type}`);

        let moves = [];
        
        switch (piece.type) {
            case 'pawn':
                moves = this.getPawnMoves(square);
                break;
            case 'rook':
                moves = this.getRookMoves(square);
                break;
            case 'bishop':
                moves = this.getBishopMoves(square);
                break;
            case 'queen':
                moves = this.getQueenMoves(square);
                break;
            case 'king':
                moves = this.getKingMoves(square);
                break;
            case 'knight':
                moves = this.getKnightMoves(square);
                break;
        }
        // console.log(`⚠️ 在 ${square} 有移动 ${moves}`);

        // 过滤掉会导致自己王被将军的移动
        return moves.filter(move => !this.wouldLeaveInCheck(square, move));
    }

    // 获取兵的移动
    getPawnMoves(square) {
        const piece = this.board[square];
        const moves = [];
        const [file, rank] = [square[0], parseInt(square[1])];
        const direction = piece.color === 'white' ? 1 : -1;
        const startRank = piece.color === 'white' ? 2 : 7;
        
        // 前进一格
        const forwardSquare = file + (rank + direction);
        if (!this.board[forwardSquare]) {
            moves.push(forwardSquare);
            
            // 从起始位置可以前进两格
            if (rank === startRank) {
                const doubleForwardSquare = file + (rank + 2 * direction);
                if (!this.board[doubleForwardSquare]) {
                    moves.push(doubleForwardSquare);
                }
            }
        }
        
        // 斜向吃子
        const captureFiles = [String.fromCharCode(file.charCodeAt(0) - 1), 
                             String.fromCharCode(file.charCodeAt(0) + 1)];
        
        for (const captureFile of captureFiles) {
            if (captureFile >= 'a' && captureFile <= 'h') {
                const captureSquare = captureFile + (rank + direction);
                const targetPiece = this.board[captureSquare];
                
                if (targetPiece && targetPiece.color !== piece.color) {
                    moves.push(captureSquare);
                }
                
                // 吃过路兵
                if (this.enPassantTarget === captureSquare) {
                    moves.push(captureSquare);
                }
            }
        }
        
        return moves;
    }

    // 获取车的移动
    getRookMoves(square) {
        return this.getSlidingMoves(square, [[0, 1], [0, -1], [1, 0], [-1, 0]]);
    }

    // 获取象的移动
    getBishopMoves(square) {
        return this.getSlidingMoves(square, [[1, 1], [1, -1], [-1, 1], [-1, -1]]);
    }

    // 获取后的移动
    getQueenMoves(square) {
        return [...this.getRookMoves(square), ...this.getBishopMoves(square)];
    }

    // 获取王的移动
    getKingMoves(square) {
        const piece = this.board[square];
        const moves = [];
        const [file, rank] = [square[0], parseInt(square[1])];
        
        // 八个方向的单格移动
        const directions = [[0, 1], [0, -1], [1, 0], [-1, 0], [1, 1], [1, -1], [-1, 1], [-1, -1]];
        
        for (const [df, dr] of directions) {
            const newFile = String.fromCharCode(file.charCodeAt(0) + df);
            const newRank = rank + dr;
            
            if (newFile >= 'a' && newFile <= 'h' && newRank >= 1 && newRank <= 8) {
                const targetSquare = newFile + newRank;
                const targetPiece = this.board[targetSquare];
                
                if (!targetPiece || targetPiece.color !== piece.color) {
                    moves.push(targetSquare);
                }
            }
        }
        
        // 王车易位
        if (this.canCastle(piece.color, 'kingside')) {
            moves.push(piece.color === 'white' ? 'g1' : 'g8');
        }
        if (this.canCastle(piece.color, 'queenside')) {
            moves.push(piece.color === 'white' ? 'c1' : 'c8');
        }
        
        return moves;
    }

    // 获取马的移动
    getKnightMoves(square) {
        const piece = this.board[square];
        const moves = [];
        const [file, rank] = [square[0], parseInt(square[1])];
        
        const knightMoves = [
            [-2, -1], [-2, 1], [-1, -2], [-1, 2],
            [1, -2], [1, 2], [2, -1], [2, 1]
        ];
        
        for (const [df, dr] of knightMoves) {
            const newFile = String.fromCharCode(file.charCodeAt(0) + df);
            const newRank = rank + dr;
            
            if (newFile >= 'a' && newFile <= 'h' && newRank >= 1 && newRank <= 8) {
                const targetSquare = newFile + newRank;
                const targetPiece = this.board[targetSquare];
                
                if (!targetPiece || targetPiece.color !== piece.color) {
                    moves.push(targetSquare);
                }
            }
        }
        
        return moves;
    }

    // 获取滑动移动（车、象、后）
    getSlidingMoves(square, directions) {
        const piece = this.board[square];
        const moves = [];
        const [file, rank] = [square[0], parseInt(square[1])];
        
        for (const [df, dr] of directions) {
            let newFile = file;
            let newRank = rank;
            
            while (true) {
                newFile = String.fromCharCode(newFile.charCodeAt(0) + df);
                newRank += dr;
                
                if (newFile < 'a' || newFile > 'h' || newRank < 1 || newRank > 8) {
                    break;
                }
                
                const targetSquare = newFile + newRank;
                const targetPiece = this.board[targetSquare];
                
                if (!targetPiece) {
                    moves.push(targetSquare);
                } else {
                    if (targetPiece.color !== piece.color) {
                        moves.push(targetSquare);
                    }
                    break;
                }
            }
        }
        
        return moves;
    }

    // 检查移动是否会导致自己王被将军
    wouldLeaveInCheck(fromSquare, toSquare) {
        // 临时执行移动
        const originalPiece = this.board[fromSquare];
        const capturedPiece = this.board[toSquare];
        
        this.board[fromSquare] = null;
        this.board[toSquare] = originalPiece;
        
        // 更新王的位置
        if (originalPiece.type === 'king') {
            this.kingPositions[originalPiece.color] = toSquare;
        }
        
        const inCheck = this.isInCheck(originalPiece.color);
        
        // 恢复棋盘
        this.board[fromSquare] = originalPiece;
        this.board[toSquare] = capturedPiece;
        
        // 恢复王的位置
        if (originalPiece.type === 'king') {
            this.kingPositions[originalPiece.color] = fromSquare;
        }
        
        return inCheck;
    }

    // 检查指定颜色的王是否被将军
    isInCheck(color) {
        const kingSquare = this.kingPositions[color];
        return this.isSquareAttacked(kingSquare, color === 'white' ? 'black' : 'white');
    }

    // 检查指定位置是否被指定颜色的棋子攻击
    isSquareAttacked(square, attackerColor) {
        const [file, rank] = [square[0], parseInt(square[1])];
        
        // 检查所有可能的攻击者
        for (const [checkSquare, piece] of Object.entries(this.board)) {
            if (!piece || piece.color !== attackerColor) continue;
            
            const moves = this.getPieceAttackingMoves(checkSquare, piece);
            if (moves.includes(square)) {
                return true;
            }
        }
        
        return false;
    }

    // 获取棋子的攻击移动（不考虑将军）
    getPieceAttackingMoves(square, piece) {
        const moves = [];
        const [file, rank] = [square[0], parseInt(square[1])];
        
        switch (piece.type) {
            case 'pawn':
                const direction = piece.color === 'white' ? 1 : -1;
                const captureFiles = [String.fromCharCode(file.charCodeAt(0) - 1), 
                                     String.fromCharCode(file.charCodeAt(0) + 1)];
                
                for (const captureFile of captureFiles) {
                    if (captureFile >= 'a' && captureFile <= 'h') {
                        moves.push(captureFile + (rank + direction));
                    }
                }
                break;
                
            case 'rook':
                return this.getSlidingMoves(square, [[0, 1], [0, -1], [1, 0], [-1, 0]]);
                
            case 'bishop':
                return this.getSlidingMoves(square, [[1, 1], [1, -1], [-1, 1], [-1, -1]]);
                
            case 'queen':
                return [...this.getSlidingMoves(square, [[0, 1], [0, -1], [1, 0], [-1, 0]]),
                       ...this.getSlidingMoves(square, [[1, 1], [1, -1], [-1, 1], [-1, -1]])];
                
            case 'king':
                const directions = [[0, 1], [0, -1], [1, 0], [-1, 0], [1, 1], [1, -1], [-1, 1], [-1, -1]];
                for (const [df, dr] of directions) {
                    const newFile = String.fromCharCode(file.charCodeAt(0) + df);
                    const newRank = rank + dr;
                    
                    if (newFile >= 'a' && newFile <= 'h' && newRank >= 1 && newRank <= 8) {
                        moves.push(newFile + newRank);
                    }
                }
                break;
                
            case 'knight':
                const knightMoves = [
                    [-2, -1], [-2, 1], [-1, -2], [-1, 2],
                    [1, -2], [1, 2], [2, -1], [2, 1]
                ];
                
                for (const [df, dr] of knightMoves) {
                    const newFile = String.fromCharCode(file.charCodeAt(0) + df);
                    const newRank = rank + dr;
                    
                    if (newFile >= 'a' && newFile <= 'h' && newRank >= 1 && newRank <= 8) {
                        moves.push(newFile + newRank);
                    }
                }
                break;
        }
        
        return moves;
    }

    // 检查是否可以王车易位
    canCastle(color, side) {
        if (this.isInCheck(color)) return false;
        
        const rights = this.castlingRights[color];
        if (side === 'kingside' && !rights.kingSide) return false;
        if (side === 'queenside' && !rights.queenSide) return false;
        
        const kingSquare = this.kingPositions[color];
        const [kingFile, kingRank] = [kingSquare[0], parseInt(kingSquare[1])];
        
        if (side === 'kingside') {
            // 检查王和车之间的格子是否为空
            const squaresBetween = [String.fromCharCode(kingFile.charCodeAt(0) + 1) + kingRank,
                                   String.fromCharCode(kingFile.charCodeAt(0) + 2) + kingRank];
            
            for (const square of squaresBetween) {
                if (this.board[square]) return false;
                if (this.isSquareAttacked(square, color === 'white' ? 'black' : 'white')) return false;
            }
        } else {
            // 长易位
            const squaresBetween = [String.fromCharCode(kingFile.charCodeAt(0) - 1) + kingRank,
                                   String.fromCharCode(kingFile.charCodeAt(0) - 2) + kingRank,
                                   String.fromCharCode(kingFile.charCodeAt(0) - 3) + kingRank];
            
            for (const square of squaresBetween) {
                if (this.board[square]) return false;
                if (this.isSquareAttacked(square, color === 'white' ? 'black' : 'white')) return false;
            }
        }
        
        return true;
    }

    // 执行移动
    makeMove(fromSquare, toSquare, promotionPiece = null) {
        const piece = this.board[fromSquare];
        if (!piece) return false;
        
        const legalMoves = this.getLegalMoves(fromSquare);
        if (!legalMoves.includes(toSquare)) return false;
        
        // 保存移动前的状态用于悔棋
        const moveData = {
            from: fromSquare,
            to: toSquare,
            piece: { ...piece },
            captured: this.board[toSquare],
            castlingRights: JSON.parse(JSON.stringify(this.castlingRights)),
            enPassantTarget: this.enPassantTarget,
            halfmoveClock: this.halfmoveClock,
            isEnPassant: false,
            isCastling: false,
            isPromotion: false
        };
        
        // 处理特殊移动
        this.handleSpecialMoves(fromSquare, toSquare, piece, moveData);
        
        // 执行移动
        this.board[fromSquare] = null;
        this.board[toSquare] = piece;
        
        // console.log('move')
        // 处理兵的升变
        if (piece.type === 'pawn' && (toSquare[1] === '1' || toSquare[1] === '8')) {
            // console.log(promotionPiece)
            if (promotionPiece) {  //bug 这里没有输出，说明promotionPiece是null
                // console.log('piece')
                this.board[toSquare] = { type: promotionPiece, color: piece.color };
                moveData.isPromotion = true;
                moveData.promotionPiece = promotionPiece;
            }
        }
        
        // 更新王的位置
        if (piece.type === 'king') {
            this.kingPositions[piece.color] = toSquare;
            
            // 处理王车易位
            if (Math.abs(fromSquare.charCodeAt(0) - toSquare.charCodeAt(0)) === 2) {
                this.handleCastling(fromSquare, toSquare, piece.color);
                moveData.isCastling = true;
            }
        }
        
        // 更新易位权利
        this.updateCastlingRights(fromSquare, toSquare);
        
        // 切换玩家
        this.currentPlayer = this.currentPlayer === 'white' ? 'black' : 'white';
        if (this.currentPlayer === 'white') {
            this.fullmoveNumber++;
        }
        
        // 记录移动
        this.moveHistory.push(moveData);
        
        // 更新游戏状态
        this.updateGameState();
        
        return true;
    }

    // 处理特殊移动
    handleSpecialMoves(fromSquare, toSquare, piece, moveData) {
        // 吃过路兵
        if (piece.type === 'pawn' && toSquare === this.enPassantTarget) {
            const direction = piece.color === 'white' ? -1 : 1;
            const capturedPawnSquare = toSquare[0] + (parseInt(toSquare[1]) + direction);
            moveData.captured = this.board[capturedPawnSquare];
            this.board[capturedPawnSquare] = null;
            moveData.isEnPassant = true;
            moveData.enPassantSquare = capturedPawnSquare;
        }
        
        // 设置吃过路兵目标
        this.enPassantTarget = null;
        if (piece.type === 'pawn' && Math.abs(parseInt(fromSquare[1]) - parseInt(toSquare[1])) === 2) {
            this.enPassantTarget = fromSquare[0] + ((parseInt(fromSquare[1]) + parseInt(toSquare[1])) / 2);
        }
    }

    // 处理王车易位
    handleCastling(fromSquare, toSquare, color) {
        const rank = color === 'white' ? '1' : '8';
        
        if (toSquare[0] === 'g') { // 短易位
            const rookFrom = 'h' + rank;
            const rookTo = 'f' + rank;
            this.board[rookTo] = this.board[rookFrom];
            this.board[rookFrom] = null;
        } else if (toSquare[0] === 'c') { // 长易位
            const rookFrom = 'a' + rank;
            const rookTo = 'd' + rank;
            this.board[rookTo] = this.board[rookFrom];
            this.board[rookFrom] = null;
        }
    }

    // 更新易位权利
    updateCastlingRights(fromSquare, toSquare) {
        const fromPiece = this.board[toSquare]; // 棋子已经移动到了目标位置
        
        if (fromPiece.type === 'king') {
            this.castlingRights[fromPiece.color] = { kingSide: false, queenSide: false };
        } else if (fromPiece.type === 'rook') {
            if (fromSquare === 'a1') this.castlingRights.white.queenSide = false;
            else if (fromSquare === 'h1') this.castlingRights.white.kingSide = false;
            else if (fromSquare === 'a8') this.castlingRights.black.queenSide = false;
            else if (fromSquare === 'h8') this.castlingRights.black.kingSide = false;
        }
        
        // 如果车被吃掉，更新易位权利
        const capturedPiece = this.moveHistory.length > 0 ? 
            this.moveHistory[this.moveHistory.length - 1].captured : null;
        
        if (capturedPiece && capturedPiece.type === 'rook') {
            if (toSquare === 'a1') this.castlingRights.white.queenSide = false;
            else if (toSquare === 'h1') this.castlingRights.white.kingSide = false;
            else if (toSquare === 'a8') this.castlingRights.black.queenSide = false;
            else if (toSquare === 'h8') this.castlingRights.black.kingSide = false;
        }
    }

    // 更新游戏状态
    updateGameState() {
        const currentColor = this.currentPlayer;
        
        // 检查是否被将军
        const inCheck = this.isInCheck(currentColor);
        
        // 检查是否有合法移动
        let hasLegalMoves = false;
        
        for (const [square, piece] of Object.entries(this.board)) {
            if (!piece || piece.color !== currentColor) continue;
            
            const legalMoves = this.getLegalMoves(square);
            if (legalMoves.length > 0) {
                hasLegalMoves = true;
                break;
            }
        }
        
        if (!hasLegalMoves) {
            if (inCheck) {
                this.gameState = currentColor === 'white' ? 'black_wins' : 'white_wins';
            } else {
                this.gameState = 'stalemate';
            }
        } else if (inCheck) {
            this.gameState = 'check';
        } else {
            this.gameState = 'playing';
        }
        
        // 检查其他和棋条件
        this.checkDrawConditions();
    }

    // 检查和棋条件
    checkDrawConditions() {
        // 50步规则
        if (this.halfmoveClock >= 100) {
            this.gameState = 'draw';
            return;
        }
        
        // 三次重复局面（简化版本）
        if (this.moveHistory.length > 8) {
            // TODO
            // 这里可以实现更复杂的重复局面检测
        }
        
        // 子力不足和棋
        if (this.isInsufficientMaterial()) {
            this.gameState = 'draw';
        }
    }

    // 检查是否子力不足
    isInsufficientMaterial() {
        let whitePieces = [];
        let blackPieces = [];
        
        for (const piece of Object.values(this.board)) {
            if (!piece) continue;
            if (piece.color === 'white') {
                whitePieces.push(piece.type);
            } else {
                blackPieces.push(piece.type);
            }
        }
        
        // 王对王
        if (whitePieces.length === 1 && blackPieces.length === 1) {
            return true;
        }
        
        // 王对王+单马或单象
        if ((whitePieces.length === 1 && blackPieces.length === 2 && 
             (blackPieces.includes('knight') || blackPieces.includes('bishop'))) ||
            (blackPieces.length === 1 && whitePieces.length === 2 && 
             (whitePieces.includes('knight') || whitePieces.includes('bishop')))) {
            return true;
        }
        
        return false;
    }

    // AI决策（Minimax算法 + Alpha-Beta剪枝）
    // TODO
    // 查看杀招，防止逼和
    getBestMove(color, depth = 4) {
        let bestMove = null;
        let bestScore = color === 'white' ? -Infinity : Infinity;
        
        console.log(`  `.repeat(3000-depth) + `getBestMove(${color}, depth=${depth})`);
    
        const moves = this.getAllLegalMoves(color);
        
        console.log(`  `.repeat(3000-depth) + `找到 ${moves.length} 个着法`);
        
        if (moves.length === 0) {
            console.error(`❌ 在深度 ${depth} 时，${color} 没有着法！`);
            return null;  // 立即发现问题
        }
        
        for (const move of moves) {
            // 模拟移动
            const moveResult = this.simulateMove(move.from, move.to);
            
            let score;
            if (depth === 1) {
                score = this.evaluatePosition();
            } else {
                const nextColor = color === 'white' ? 'black' : 'white';
                const nextMove = this.getBestMove(nextColor, depth - 1);
                score = nextMove ? nextMove.score : this.evaluatePosition();
            }
            
            // 恢复棋盘
            this.undoSimulatedMove(moveResult);
            
            if ((color === 'white' && score > bestScore) || 
                (color === 'black' && score < bestScore)) {
                bestScore = score;
                bestMove = { from: move.from, to: move.to, score: score };
            }
        }
        
        return bestMove;
    }

    // 获取所有合法移动
    getAllLegalMoves(color) {
        const moves = [];
        
        for (const [square, piece] of Object.entries(this.board)) {
            if (!piece || piece.color !== color) continue;
            
            const legalMoves = this.getLegalMoves(square, color);

            // ✅ 调试：如果某个棋子没有合法移动，打印原因
            if (legalMoves.length === 0) {
                console.log(`⚠️ ${color} ${piece.type} 在 ${square} 没有合法移动`);
            }
            for (const targetSquare of legalMoves) {
                moves.push({ from: square, to: targetSquare });
            }
        }
        // ✅ 关键调试：打印总着法数
        console.log(`getAllLegalMoves(${color}) 返回 ${moves.length} 个着法`);
        
        return moves;
    }

    // TODO
    // 王车易位和升变没处理
    // 模拟移动（用于AI评估）
    simulateMove(fromSquare, toSquare) {
        const piece = this.board[fromSquare];
        const capturedPiece = this.board[toSquare];
        const originalEnPassant = this.enPassantTarget;
        
        this.board[fromSquare] = null;
        this.board[toSquare] = piece;
        
        if (piece.type === 'king') {
            this.kingPositions[piece.color] = toSquare;
        }
        
        return {
            from: fromSquare,
            to: toSquare,
            piece: piece,
            captured: capturedPiece,
            originalEnPassant: originalEnPassant
        };
    }

    // 撤销模拟移动
    undoSimulatedMove(moveResult) {
        this.board[moveResult.from] = moveResult.piece;
        this.board[moveResult.to] = moveResult.captured;
        this.enPassantTarget = moveResult.originalEnPassant;
        
        if (moveResult.piece.type === 'king') {
            this.kingPositions[moveResult.piece.color] = moveResult.from;
        }
    }

    // 评估当前局面
    evaluatePosition() {
        let score = 0;
        
        for (const [square, piece] of Object.entries(this.board)) {
            if (!piece) continue;
            
            // const baseValue = this.pieceValues[piece.type];  // 子力价值
            // const positionBonus = this.getPositionBonus(piece, square);  // -10 ~ +10
            // const positionBonus = this.getSquareValue(piece, square);
            
            // 直接查表：价值+位置得分已合并
            const sqValue = this.getSquareValue(piece, square);
            
            if (piece.color === 'white') {
                score += sqValue;
            } else {
                score -= sqValue;
            }
        }
        
        // 考虑王的安全
        score += this.evaluateKingSafety();
        
        return score;
    }

    // 获取位置奖励
    // getPositionBonus(piece, square) {
    //     const [file, rank] = [square[0], parseInt(square[1])];
    //     const fileIndex = file.charCodeAt(0) - 'a'.charCodeAt(0);
    //     const rankIndex = piece.color === 'white' ? 8 - rank : rank - 1;
        
    //     const table = this.pieceSquareTables[piece.type];
    //     if (table && table[piece.color] && table[piece.color][rankIndex]) {
    //         return table[piece.color][rankIndex][fileIndex] || 0;
    //     }
        
    //     return 0;
    // }

    getSquareValue(piece, square) {
        const [file, rank] = [square[0], parseInt(square[1])];
        const fileIndex = file.charCodeAt(0) - 'a'.charCodeAt(0);
        // const rankIndex = piece.color === 'white' ? 8 - rank : rank - 1;
        const rankIndex = 8 - rank; //解释：RawPST视觉上是下方为0,实际上代码下标上方为0
        // const rankIndex = rank - 1;
        
        const table = this.pst[piece.type][piece.color];
        const index = rankIndex * 8 + fileIndex;
        
        return table[index];
    }

    // 评估王的安全
    evaluateKingSafety() {
        let safetyScore = 0;
        
        for (const color of ['white', 'black']) {
            const kingSquare = this.kingPositions[color];
            const [file, rank] = [kingSquare[0], parseInt(kingSquare[1])];
            
            // 检查王周围是否有保护子
            const directions = [[0, 1], [0, -1], [1, 0], [-1, 0], [1, 1], [1, -1], [-1, 1], [-1, -1]];
            let protection = 0;
            
            for (const [df, dr] of directions) {
                const newFile = String.fromCharCode(file.charCodeAt(0) + df);
                const newRank = rank + dr;
                
                if (newFile >= 'a' && newFile <= 'h' && newRank >= 1 && newRank <= 8) {
                    const piece = this.board[newFile + newRank];
                    if (piece && piece.color === color) {
                        protection += 10;
                    }
                }
            }
            
            if (color === 'white') {
                safetyScore += protection;
            } else {
                safetyScore -= protection;
            }
        }
        
        return safetyScore;
    }

    // 悔棋
    undoMove() {
        if (this.moveHistory.length === 0) return false;
        
        const lastMove = this.moveHistory.pop();
        
        // 恢复棋盘
        this.board[lastMove.from] = lastMove.piece;
        this.board[lastMove.to] = lastMove.captured;
        
        // 处理特殊情况
        if (lastMove.isEnPassant) {
            this.board[lastMove.enPassantSquare] = lastMove.captured;
        }
        
        if (lastMove.isCastling) {
            const color = lastMove.piece.color;
            const rank = color === 'white' ? '1' : '8';
            
            if (lastMove.to[0] === 'g') { // 短易位
                this.board['h' + rank] = this.board['f' + rank];
                this.board['f' + rank] = null;
            } else if (lastMove.to[0] === 'c') { // 长易位
                this.board['a' + rank] = this.board['d' + rank];
                this.board['d' + rank] = null;
            }
        }
        
        if (lastMove.isPromotion) {
            this.board[lastMove.to] = { type: 'pawn', color: lastMove.piece.color };
        }
        
        // 恢复状态
        this.castlingRights = lastMove.castlingRights;
        this.enPassantTarget = lastMove.enPassantTarget;
        this.halfmoveClock = lastMove.halfmoveClock;
        this.currentPlayer = lastMove.piece.color;
        
        // 恢复王的位置
        if (lastMove.piece.type === 'king') {
            this.kingPositions[lastMove.piece.color] = lastMove.from;
        }
        
        // 更新游戏状态
        this.updateGameState();
        
        return true;
    }

    // 获取游戏状态
    getGameState() {
        return {
            board: JSON.parse(JSON.stringify(this.board)),
            currentPlayer: this.currentPlayer,
            gameState: this.gameState,
            moveHistory: [...this.moveHistory],
            capturedPieces: JSON.parse(JSON.stringify(this.capturedPieces)),
            castlingRights: JSON.parse(JSON.stringify(this.castlingRights)),
            enPassantTarget: this.enPassantTarget,
            kingPositions: { ...this.kingPositions }
        };
    }

    // 从状态恢复游戏
    loadGameState(state) {
        this.board = JSON.parse(JSON.stringify(state.board));
        this.currentPlayer = state.currentPlayer;
        this.gameState = state.gameState;
        this.moveHistory = [...state.moveHistory];
        this.capturedPieces = JSON.parse(JSON.stringify(state.capturedPieces));
        this.castlingRights = JSON.parse(JSON.stringify(state.castlingRights));
        this.enPassantTarget = state.enPassantTarget;
        this.kingPositions = { ...state.kingPositions };
    }
}

// 导出类以供其他模块使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ChessEngine;
}