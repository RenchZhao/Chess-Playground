// Chess Master - 主要JavaScript逻辑
class ChessApp {
    constructor() {
        this.currentMode = null;
        this.selectedColor = null;
        this.gameConfig = {
            difficulty: 'medium',
            aiSpeed: 'normal'
        };
        this.init();
    }

    init() {
        this.initAnimations();
        this.initEventListeners();
        this.initScrollEffects();
    }

    // 初始化动画效果
    initAnimations() {
        // 文字分割动画
        if (typeof Splitting !== 'undefined') {
            Splitting();
            
            // 标题动画
            anime({
                targets: '.hero-title .char',
                translateY: [-100, 0],
                opacity: [0, 1],
                easing: 'easeOutExpo',
                duration: 1400,
                delay: (el, i) => 30 * i
            });
        }

        // 浮动动画增强
        anime({
            targets: '.floating-animation',
            translateY: [-10, 10],
            duration: 4000,
            easing: 'easeInOutSine',
            direction: 'alternate',
            loop: true
        });

        // 卡片入场动画
        anime({
            targets: '.card-hover',
            translateY: [50, 0],
            opacity: [0, 1],
            easing: 'easeOutExpo',
            duration: 1000,
            delay: (el, i) => 200 * i
        });
    }

    // 初始化事件监听
    initEventListeners() {
        // 平滑滚动
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', (e) => {
                e.preventDefault();
                const target = document.querySelector(anchor.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });

        // 难度设置监听
        const difficultySelect = document.getElementById('aiDifficulty');
        if (difficultySelect) {
            difficultySelect.addEventListener('change', (e) => {
                this.gameConfig.difficulty = e.target.value;
            });
        }

        // AI速度设置监听
        const speedSelect = document.getElementById('aiSpeed');
        if (speedSelect) {
            speedSelect.addEventListener('change', (e) => {
                this.gameConfig.aiSpeed = e.target.value;
            });
        }

        // 键盘事件
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closePieceSelection();
            }
        });
    }

    // 初始化滚动效果
    initScrollEffects() {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }
            });
        }, observerOptions);

        // 观察需要动画的元素
        document.querySelectorAll('section > div').forEach(el => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(30px)';
            el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            observer.observe(el);
        });
    }

    // 选择游戏模式
    selectMode(mode) {
        this.currentMode = mode;
        
        // 根据模式决定是否需要选择棋子颜色
        if (mode === 'human-ai' || mode === 'human-human') {
            this.showPieceSelection();
        } else {
            // AI对AI模式直接进入游戏
            this.startGame();
        }
    }

    // 显示棋子选择弹窗
    showPieceSelection() {
        const modal = document.getElementById('pieceSelectionModal');
        const modalContent = document.getElementById('modalContent');
        
        modal.classList.remove('hidden');
        
        // 弹窗动画
        anime({
            targets: modalContent,
            scale: [0.8, 1],
            opacity: [0, 1],
            duration: 300,
            easing: 'easeOutBack'
        });
    }

    // 关闭棋子选择弹窗
    closePieceSelection() {
        const modal = document.getElementById('pieceSelectionModal');
        const modalContent = document.getElementById('modalContent');
        
        anime({
            targets: modalContent,
            scale: [1, 0.8],
            opacity: [1, 0],
            duration: 200,
            easing: 'easeInBack',
            complete: () => {
                modal.classList.add('hidden');
            }
        });
    }

    // 选择棋子颜色
    selectColor(color) {
        this.selectedColor = color;
        
        // 选择动画
        const selectedButton = event.target.closest('button');
        anime({
            targets: selectedButton,
            scale: [1, 1.1, 1],
            duration: 300,
            easing: 'easeOutBack',
            complete: () => {
                setTimeout(() => {
                    this.closePieceSelection();
                    setTimeout(() => {
                        this.startGame();
                    }, 200);
                }, 300);
            }
        });
    }

    // 开始游戏
    startGame() {
        // 构建游戏配置
        const gameConfig = {
            mode: this.currentMode,
            color: this.selectedColor,
            difficulty: this.gameConfig.difficulty,
            aiSpeed: this.gameConfig.aiSpeed
        };

        // 保存配置到本地存储
        localStorage.setItem('chessGameConfig', JSON.stringify(gameConfig));

        // 页面切换动画
        anime({
            targets: 'body',
            opacity: [1, 0],
            duration: 500,
            easing: 'easeInOutQuad',
            complete: () => {
                window.location.href = 'game.html';
            }
        });
    }

    // 显示关于信息
    showAbout() {
        const aboutSection = document.getElementById('about');
        aboutSection.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }
}

// 全局函数
function selectMode(mode) {
    chessApp.selectMode(mode);
}

function selectColor(color) {
    chessApp.selectColor(color);
}

function closePieceSelection() {
    chessApp.closePieceSelection();
}

function scrollToModes() {
    document.getElementById('modes').scrollIntoView({
        behavior: 'smooth',
        block: 'start'
    });
}

function showAbout() {
    chessApp.showAbout();
}

// 页面加载完成后初始化
let chessApp;
document.addEventListener('DOMContentLoaded', () => {
    chessApp = new ChessApp();
    
    // 页面入场动画
    anime({
        targets: 'body',
        opacity: [0, 1],
        duration: 800,
        easing: 'easeOutQuad'
    });
});

// 页面可见性变化处理
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
        // 页面重新可见时重新初始化动画
        setTimeout(() => {
            chessApp?.initAnimations();
        }, 100);
    }
});

// 窗口大小变化处理
window.addEventListener('resize', () => {
    // 重新计算布局相关的动画
    setTimeout(() => {
        chessApp?.initScrollEffects();
    }, 100);
});

// 导出类以供其他模块使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ChessApp;
}