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
            hard: 6
        };
        
        // 棋子价值
        this.pieceValues = {
            'pawn': 100,
            'knight': 320,
            'bishop': 330,
            'rook': 500,
            'queen': 900,
            'king': 20000
        };
        
        // 位置评估表
        this.pieceSquareTables = this.initializePieceSquareTables();
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
    initializePieceSquareTables() {
        return {
            pawn: {
                white: [
                    [0,  0,  0,  0,  0,  0,  0,  0],
                    [50, 50, 50, 50, 50, 50, 50, 50],
                    [10, 10, 20, 30, 30, 20, 10, 10],
                    [5,  5, 10, 25, 25, 10,  5,  5],
                    [0,  0,  0, 20, 20,  0,  0,  0],
                    [5, -5, -10,  0,  0, -10, -5,  5],
                    [5, 10, 10, -20, -20, 10, 10,  5],
                    [0,  0,  0,  0,  0,  0,  0,  0]
                ],
                black: [
                    [0,  0,  0,  0,  0,  0,  0,  0],
                    [5, 10, 10, -20, -20, 10, 10,  5],
                    [5, -5, -10,  0,  0, -10, -5,  5],
                    [0,  0,  0, 20, 20,  0,  0,  0],
                    [5,  5, 10, 25, 25, 10,  5,  5],
                    [10, 10, 20, 30, 30, 20, 10, 10],
                    [50, 50, 50, 50, 50, 50, 50, 50],
                    [0,  0,  0,  0,  0,  0,  0,  0]
                ]
            },
            knight: {
                white: [
                    [-50, -40, -30, -30, -30, -30, -40, -50],
                    [-40, -20,   0,   0,   0,   0, -20, -40],
                    [-30,   0,  10,  15,  15,  10,   0, -30],
                    [-30,   5,  15,  20,  20,  15,   5, -30],
                    [-30,   0,  15,  20,  20,  15,   0, -30],
                    [-30,   5,  10,  15,  15,  10,   5, -30],
                    [-40, -20,   0,   5,   5,   0, -20, -40],
                    [-50, -40, -30, -30, -30, -30, -40, -50]
                ],
                black: [
                    [-50, -40, -30, -30, -30, -30, -40, -50],
                    [-40, -20,   0,   5,   5,   0, -20, -40],
                    [-30,   5,  10,  15,  15,  10,   5, -30],
                    [-30,   0,  15,  20,  20,  15,   0, -30],
                    [-30,   5,  15,  20,  20,  15,   5, -30],
                    [-30,   0,  10,  15,  15,  10,   0, -30],
                    [-40, -20,   0,   0,   0,   0, -20, -40],
                    [-50, -40, -30, -30, -30, -30, -40, -50]
                ]
            },
            bishop: {
                white: [
                    [-20, -10, -10, -10, -10, -10, -10, -20],
                    [-10,   0,   0,   0,   0,   0,   0, -10],
                    [-10,   0,   5,  10,  10,   5,   0, -10],
                    [-10,   5,   5,  10,  10,   5,   5, -10],
                    [-10,   0,  10,  10,  10,  10,   0, -10],
                    [-10,  10,  10,  10,  10,  10,  10, -10],
                    [-10,   5,   0,   0,   0,   0,   5, -10],
                    [-20, -10, -10, -10, -10, -10, -10, -20]
                ],
                black: [
                    [-20, -10, -10, -10, -10, -10, -10, -20],
                    [-10,   5,   0,   0,   0,   0,   5, -10],
                    [-10,  10,  10,  10,  10,  10,  10, -10],
                    [-10,   0,  10,  10,  10,  10,   0, -10],
                    [-10,   5,   5,  10,  10,   5,   5, -10],
                    [-10,   0,   5,  10,  10,   5,   0, -10],
                    [-10,   0,   0,   0,   0,   0,   0, -10],
                    [-20, -10, -10, -10, -10, -10, -10, -20]
                ]
            },
            rook: {
                white: [
                    [0,  0,  0,  0,  0,  0,  0,  0],
                    [5, 10, 10, 10, 10, 10, 10,  5],
                    [-5,  0,  0,  0,  0,  0,  0, -5],
                    [-5,  0,  0,  0,  0,  0,  0, -5],
                    [-5,  0,  0,  0,  0,  0,  0, -5],
                    [-5,  0,  0,  0,  0,  0,  0, -5],
                    [-5,  0,  0,  0,  0,  0,  0, -5],
                    [0,  0,  0,  5,  5,  0,  0,  0]
                ],
                black: [
                    [0,  0,  0,  5,  5,  0,  0,  0],
                    [-5,  0,  0,  0,  0,  0,  0, -5],
                    [-5,  0,  0,  0,  0,  0,  0, -5],
                    [-5,  0,  0,  0,  0,  0,  0, -5],
                    [-5,  0,  0,  0,  0,  0,  0, -5],
                    [-5,  0,  0,  0,  0,  0,  0, -5],
                    [5, 10, 10, 10, 10, 10, 10,  5],
                    [0,  0,  0,  0,  0,  0,  0,  0]
                ]
            },
            queen: {
                white: [
                    [-20, -10, -10, -5, -5, -10, -10, -20],
                    [-10,   0,   0,  0,  0,   0,   0, -10],
                    [-10,   0,   5,  5,  5,   5,   0, -10],
                    [-5,    0,   5,  5,  5,   5,   0, -5],
                    [0,     0,   5,  5,  5,   5,   0,  0],
                    [-10,   5,   5,  5,  5,   5,   0, -10],
                    [-10,   0,   5,  0,  0,   0,   0, -10],
                    [-20, -10, -10, -5, -5, -10, -10, -20]
                ],
                black: [
                    [-20, -10, -10, -5, -5, -10, -10, -20],
                    [-10,   0,   5,  0,  0,   0,   0, -10],
                    [-10,   5,   5,  5,  5,   5,   0, -10],
                    [0,     0,   5,  5,  5,   5,   0,  0],
                    [-5,    0,   5,  5,  5,   5,   0, -5],
                    [-10,   0,   5,  5,  5,   5,   0, -10],
                    [-10,   0,   0,  0,  0,   0,   0, -10],
                    [-20, -10, -10, -5, -5, -10, -10, -20]
                ]
            },
            king: {
                white: [
                    [-30, -40, -40, -50, -50, -40, -40, -30],
                    [-30, -40, -40, -50, -50, -40, -40, -30],
                    [-30, -40, -40, -50, -50, -40, -40, -30],
                    [-30, -40, -40, -50, -50, -40, -40, -30],
                    [-20, -30, -30, -40, -40, -30, -30, -20],
                    [-10, -20, -20, -20, -20, -20, -20, -10],
                    [20,  20,   0,   0,   0,   0,  20,  20],
                    [20,  30,  10,   0,   0,  10,  30,  20]
                ],
                black: [
                    [20,  30,  10,   0,   0,  10,  30,  20],
                    [20,  20,   0,   0,   0,   0,  20,  20],
                    [-10, -20, -20, -20, -20, -20, -20, -10],
                    [-20, -30, -30, -40, -40, -30, -30, -20],
                    [-30, -40, -40, -50, -50, -40, -40, -30],
                    [-30, -40, -40, -50, -50, -40, -40, -30],
                    [-30, -40, -40, -50, -50, -40, -40, -30],
                    [-30, -40, -40, -50, -50, -40, -40, -30]
                ]
            }
        };
    }

    // 获取棋子在指定位置的所有合法移动
    getLegalMoves(square) {
        const piece = this.board[square];
        if (!piece || piece.color !== this.currentPlayer) {
            return [];
        }

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
    getBestMove(color, depth = 4) {
        let bestMove = null;
        let bestScore = color === 'white' ? -Infinity : Infinity;
        
        const moves = this.getAllLegalMoves(color);
        
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
            
            const legalMoves = this.getLegalMoves(square);
            for (const targetSquare of legalMoves) {
                moves.push({ from: square, to: targetSquare });
            }
        }
        
        return moves;
    }

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
            
            const value = this.pieceValues[piece.type];
            const positionBonus = this.getPositionBonus(piece, square);
            const totalValue = value + positionBonus;
            
            if (piece.color === 'white') {
                score += totalValue;
            } else {
                score -= totalValue;
            }
        }
        
        // 考虑王的安全
        score += this.evaluateKingSafety();
        
        return score;
    }

    // 获取位置奖励
    getPositionBonus(piece, square) {
        const [file, rank] = [square[0], parseInt(square[1])];
        const fileIndex = file.charCodeAt(0) - 'a'.charCodeAt(0);
        const rankIndex = piece.color === 'white' ? 8 - rank : rank - 1;
        
        const table = this.pieceSquareTables[piece.type];
        if (table && table[piece.color] && table[piece.color][rankIndex]) {
            return table[piece.color][rankIndex][fileIndex] || 0;
        }
        
        return 0;
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