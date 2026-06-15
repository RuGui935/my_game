// ==================== 渲染层 ====================

// 将文本拆分成句子（不分割引号内的内容，不把引号当分隔符）
function splitToLines(text) {
    if (!text) return [];
    
    // 按换行分割成段落
    let paragraphs = text.split(/\n/);
    let lines = [];
    
    for (let para of paragraphs) {
        if (para.trim() === "") continue;
        
        // 直接按标点符号分割，不处理任何引号（直双引号、弯双引号都不处理）
        // 用正则匹配句号、感叹号、问号作为分隔
        let sentences = [];
        let current = "";
        
        for (let i = 0; i < para.length; i++) {
            let ch = para[i];
            current += ch;
            
            // 遇到中文或英文句末标点，切分（但不切分引号）
            if (ch === '。' || ch === '！' || ch === '？' || ch === '!' || ch === '?') {
                if (current.trim()) {
                    sentences.push(current.trim());
                }
                current = "";
            }
        }
        
        // 剩余内容
        if (current.trim()) {
            sentences.push(current.trim());
        }
        
        // 如果没有切分出任何句子，整段作为一句
        if (sentences.length === 0 && para.trim()) {
            sentences = [para.trim()];
        }
        
        for (let s of sentences) {
            if (s) lines.push(s);
        }
    }
    
    if (lines.length === 0 && text.trim()) lines = [text.trim()];
    return lines;
}

// 全局刷新UI（顶部面板 + 当前视图）
function updateUI_Global() {
    let p = gameData.player;
    let statsPanel = document.getElementById("playerStatsPanel");
    if (statsPanel) {
        statsPanel.innerHTML = `
            <span>🔖 ${p.name}</span>
            <span>❤️ ${p.hp}/${p.maxHp}</span>
            <span>⭐ Lv.${p.level}</span>
            <span>🔮 ${p.exp}/${p.expToNext}</span>
            <span>💰 ${p.points}积分</span>
            ${p.talent ? `<span>✨ ${p.talent === 'attack' ? '燃血之刃' : p.talent === 'heal' ? '抚慰之光' : '不动之躯'}</span>` : ""}
        `;
    }
    renderCurrentView();
    if (typeof saveToLocal === 'function') saveToLocal();
}

// 逐句显示工具
let currentLineIndex = 0;
let currentLines = [];
let isAnimating = false;

function resetAnimation() {
    currentLineIndex = 0;
    currentLines = [];
    isAnimating = false;
}




// 获取场景文本（支持函数或字符串）
function getSceneText(scene) {
    if (!scene) return "";
    if (typeof scene.text === 'function') {
        return scene.text();
    }
    return scene.text || "";
}

// 渲染普通场景（逐句渐显）
function renderLinesToStory(lines, options, dungeonId, scene, hasBackBtn, isEndingScene, endingType) {
    const mainPanel = document.getElementById("mainPanel");
    if (!mainPanel) return;
    
    mainPanel.innerHTML = `
        <div class="story-area" style="min-height: 200px; max-height: 400px; overflow-y: auto;"></div>
        <div class="options-area"></div>
    `;
    
    const storyDiv = mainPanel.querySelector('.story-area');
    const optionsDiv = mainPanel.querySelector('.options-area');
    
    if (!storyDiv) return;
    
    storyDiv.innerHTML = "";
    currentLines = lines;
    currentLineIndex = 0;
    isAnimating = true;
    
    function showNextLine() {
        if (currentLineIndex < currentLines.length) {
            const lineDiv = document.createElement('div');
            lineDiv.className = 'story-line';
            lineDiv.textContent = currentLines[currentLineIndex];
            storyDiv.appendChild(lineDiv);
            currentLineIndex++;
            storyDiv.scrollTop = storyDiv.scrollHeight;
            setTimeout(showNextLine, 150);
        } else {
            isAnimating = false;
            if (isEndingScene) {
                optionsDiv.innerHTML = '';
                const continueBtn = document.createElement('button');
                continueBtn.className = 'game-btn';
                continueBtn.textContent = '继续';
                continueBtn.addEventListener('click', () => {
                    if (typeof handleEnding === 'function') {
                        handleEnding(endingType, dungeonId);
                    }
                });
                optionsDiv.appendChild(continueBtn);
            } else {
                showOptions(options, dungeonId, scene, hasBackBtn);
            }
        }
    }
    
    showNextLine();
}

// 显示选项按钮
function showOptions(options, dungeonId, scene, hasBackBtn) {
    const mainPanel = document.getElementById("mainPanel");
    if (!mainPanel) return;
    
    let optionsDiv = mainPanel.querySelector('.options-area');
    if (!optionsDiv) {
        const newOptionsDiv = document.createElement('div');
        newOptionsDiv.className = 'options-area';
        mainPanel.appendChild(newOptionsDiv);
        optionsDiv = newOptionsDiv;
    }
    
    optionsDiv.innerHTML = "";
    
    if (options && options.length) {
        options.forEach(opt => {
            const btn = document.createElement('button');
            btn.className = 'game-btn';
            btn.textContent = opt.text;
            btn.addEventListener('click', (e) => {
                const allBtns = document.querySelectorAll('.game-btn');
                allBtns.forEach(b => b.disabled = true);
                optionsDiv.innerHTML = '<div style="color:#b9917a; text-align:center; width:100%;">⚡ 命运齿轮转动中...</div>';
                
                if (scene && scene.onTrigger) {
                    scene.onTrigger();
                }
                
                if (typeof processAction === 'function') {
                    processAction(opt.action, dungeonId, scene);
                }
            });
            optionsDiv.appendChild(btn);
        });
    }
    
    if (hasBackBtn) {
        const backBtn = document.createElement('button');
        backBtn.className = 'game-btn back-btn';
        backBtn.textContent = '🔙 中断探索';
        backBtn.addEventListener('click', () => {
            gameData.ui.currentView = "dungeonList";
            updateUI_Global();
        });
        optionsDiv.appendChild(backBtn);
    }
}

// 渲染结局场景
function renderEndingScene(lines, scene, dungeonId) {
    const mainPanel = document.getElementById("mainPanel");
    if (!mainPanel) return;
    
    mainPanel.innerHTML = `
        <div class="story-area" style="min-height: 200px; max-height: 400px; overflow-y: auto;"></div>
        <div class="options-area"></div>
    `;
    
    const storyDiv = mainPanel.querySelector('.story-area');
    const optionsDiv = mainPanel.querySelector('.options-area');
    
    storyDiv.innerHTML = "";
    currentLines = lines;
    currentLineIndex = 0;
    isAnimating = true;
    
    function showNextLine() {
        if (currentLineIndex < currentLines.length) {
            const lineDiv = document.createElement('div');
            lineDiv.className = 'story-line';
            lineDiv.textContent = currentLines[currentLineIndex];
            storyDiv.appendChild(lineDiv);
            currentLineIndex++;
            storyDiv.scrollTop = storyDiv.scrollHeight;
            setTimeout(showNextLine, 150);
        } else {
            isAnimating = false;
            optionsDiv.innerHTML = '';
            const continueBtn = document.createElement('button');
            continueBtn.className = 'game-btn';
            continueBtn.textContent = '继续';
            continueBtn.addEventListener('click', () => {
                if (typeof handleEnding === 'function') {
                    handleEnding(scene.endingType, dungeonId);
                }
            });
            optionsDiv.appendChild(continueBtn);
        }
    }
    
    showNextLine();
}

// 渲染单个场景（用于事件路由）
function renderSpecificScene(dungeonId, scene, sceneKey) {
    if (!scene) {
        renderDungeonGame();
        return;
    }
    
    let sceneText = getSceneText(scene);
    let lines = splitToLines(sceneText);
    let hasBack = true;
    
    if (scene.isEnding) {
        renderEndingScene(lines, scene, dungeonId);
    } else {
        renderLinesToStory(lines, scene.options, dungeonId, scene, hasBack, false, null);
    }
}

// ========== 副本游玩主函数 ==========
function renderDungeonGame() {
    let dungeonId = gameData.ui.currentDungeonId;
    let dungeon = dungeonsData[dungeonId];
    let sceneKey = gameData.ui.currentSceneKey;
    
    if (!dungeon) {
        gameData.ui.currentView = "dungeonList";
        updateUI_Global();
        return;
    }
    
    // 处理开始场景
    if (sceneKey === "start") {
        let startText = getSceneText({ text: dungeon.startDescription });
        let lines = splitToLines(startText);
        const mainPanel = document.getElementById("mainPanel");
        mainPanel.innerHTML = `
            <div class="story-area" style="min-height: 200px; max-height: 400px; overflow-y: auto;"></div>
            <div class="options-area"></div>
        `;
        
        const storyDiv = mainPanel.querySelector('.story-area');
        const optionsDiv = mainPanel.querySelector('.options-area');
        
        storyDiv.innerHTML = "";
        currentLines = lines;
        currentLineIndex = 0;
        isAnimating = true;
        
        function showNextLine() {
            if (currentLineIndex < currentLines.length) {
                const lineDiv = document.createElement('div');
                lineDiv.className = 'story-line';
                lineDiv.textContent = currentLines[currentLineIndex];
                storyDiv.appendChild(lineDiv);
                currentLineIndex++;
                storyDiv.scrollTop = storyDiv.scrollHeight;
                setTimeout(showNextLine, 150);
            } else {
                isAnimating = false;
                optionsDiv.innerHTML = "";
                if (dungeon.startOptions && dungeon.startOptions.length) {
                    dungeon.startOptions.forEach(opt => {
                        const btn = document.createElement('button');
                        btn.className = 'game-btn';
                        btn.textContent = opt.text;
                        btn.addEventListener('click', () => {
                            const btns = document.querySelectorAll('.game-btn');
                            btns.forEach(b => b.disabled = true);
                            optionsDiv.innerHTML = '<div style="color:#b9917a; text-align:center; width:100%;">⚡ 命运齿轮转动中...</div>';
                            gameData.ui.currentSceneKey = opt.action;
                            renderDungeonGame();
                        });
                        optionsDiv.appendChild(btn);
                    });
                }
                const backBtn = document.createElement('button');
                backBtn.className = 'game-btn back-btn';
                backBtn.textContent = '🔙 返回副本列表';
                backBtn.addEventListener('click', () => {
                    gameData.ui.currentView = "dungeonList";
                    updateUI_Global();
                });
                optionsDiv.appendChild(backBtn);
            }
        }
        
        showNextLine();
        return;
    }
    
    let scene = dungeon.scenes[sceneKey];
    if (!scene) {
        gameData.ui.currentSceneKey = "start";
        renderDungeonGame();
        return;
    }
    
    // 处理事件路由节点
    if (scene.isEventRouter) {
        let eventType = getRandomEvent();
        let targetScene = dungeon.scenes[eventType];
        if (targetScene) {
            if (targetScene.onTrigger) targetScene.onTrigger();
            gameData.ui.currentSceneKey = eventType;
            renderDungeonGame();
        } else {
            let nothingScene = dungeon.scenes["nothing"];
            if (nothingScene) {
                gameData.ui.currentSceneKey = "nothing";
                renderDungeonGame();
            }
        }
        return;
    }
    
    // 处理普通场景
    let sceneText = getSceneText(scene);
    let lines = splitToLines(sceneText);
    let hasBack = true;
    
    if (scene.isEnding) {
        renderEndingScene(lines, scene, dungeonId);
    } else {
        renderLinesToStory(lines, scene.options, dungeonId, scene, hasBack, false, null);
    }
}

// ========== 副本列表 ==========
function renderDungeonList() {
    let dungeon = dungeonsData["forest_cabin"];
    let isUnlocked = gameData.ui.dungeonTrueNameUnlocked;
    let displayName = isUnlocked ? dungeon.trueName : dungeon.displayName;
    
    let truthButtonHtml = "";
    if (isUnlocked) {
        truthButtonHtml = `<button class="truth-btn" id="showTruthBtn">📜 真相</button>`;
    }
    
    let html = `<div class="dungeon-list">
        <div class="dungeon-card" data-dungeon="forest_cabin">
            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
                <div class="dungeon-name">🌲 ${displayName}</div>
                ${truthButtonHtml}
            </div>
            <div class="dungeon-desc">[新手推荐] 寻找失踪的好友，在迷雾中抉择</div>
        </div>
    </div>`;
    
    if (gameData.player.flags.isInLostRealm) {
        html += `<div style="margin-top: 16px; padding: 12px; background: #3a1a1a; border-radius: 20px; text-align: center; border: 1px solid #b54a3a;">
            <span style="color: #ffaa88;">⚠️ 你正在迷失副本中挣扎 ⚠️</span>
        </div>`;
    }
    
    document.getElementById("mainPanel").innerHTML = html;
    
    document.querySelectorAll(".dungeon-card").forEach(card => {
        card.addEventListener("click", (e) => {
            if (e.target.classList && e.target.classList.contains('truth-btn')) return;
            let id = card.getAttribute("data-dungeon");
            if (id) {
                gameData.ui.currentDungeonId = id;
                gameData.ui.currentSceneKey = "start";
                gameData.ui.currentView = "dungeonGame";
                updateUI_Global();
            }
        });
    });
    
    const truthBtn = document.getElementById("showTruthBtn");
    if (truthBtn) {
        truthBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            showTruthModal(dungeon.trueName, dungeon.backstory);
        });
    }
}

// ========== 真相弹窗 ==========
function showTruthModal(trueName, backstory) {
    const existingModal = document.querySelector('.modal-overlay');
    if (existingModal) existingModal.remove();
    
    const modalHtml = `
        <div class="modal-overlay">
            <div class="modal-content" style="max-width: 400px;">
                <div class="modal-title success" style="font-size: 24px;">📖 ${trueName}</div>
                <div class="modal-message" style="text-align: left; line-height: 1.8;">${backstory}</div>
                <button class="modal-btn" id="truthModalClose">关 闭</button>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    const closeBtn = document.getElementById('truthModalClose');
    const overlay = document.querySelector('.modal-overlay');
    
    closeBtn.addEventListener('click', () => overlay.remove());
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) overlay.remove();
    });
}

// ========== 商城 ==========
function renderShop() {
    let html = `<div class="placeholder-panel"><h3>🕯️ 诡市商城</h3><div class="shop-grid">`;
    if (gameData.shopItems) {
        gameData.shopItems.forEach(item => {
            html += `<div class="shop-card">
                <b>${item.name}</b><br>${item.desc}<br>
                <span style="color:#e7b874">💰 ${item.price}</span><br>
                <button class="game-btn buy-btn" data-id="${item.id}">购买</button>
            </div>`;
        });
    }
    html += `</div><button class="game-btn back-btn" id="shopBack">返回</button></div>`;
    document.getElementById("mainPanel").innerHTML = html;
    
    document.querySelectorAll(".buy-btn").forEach(btn => {
        btn.addEventListener("click", (e) => {
            let id = btn.getAttribute("data-id");
            let item = gameData.shopItems.find(i => i.id === id);
            if (item && gameData.player.points >= item.price) {
                gameData.player.points -= item.price;
                if (item.type === "heal") gameData.player.hp = Math.min(gameData.player.maxHp, gameData.player.hp + 1);
                if (item.type === "exp" && typeof addExp === 'function') addExp(30);
                if (item.type === "lottery") {
                    let reward = Math.random() > 0.5 ? 30 : 10;
                    gameData.player.points += reward;
                    alert(`抽奖获得 ${reward} 积分`);
                }
                updateUI_Global();
                renderShop();
            } else alert("积分不足！");
        });
    });
    document.getElementById("shopBack")?.addEventListener("click", () => {
        gameData.ui.currentView = "dungeonList";
        updateUI_Global();
    });
}

// ========== 背包 ==========
function renderInventory() {
    let inv = gameData.player.inventory || [];
    let clueHtml = (gameData.player.clues || []).map(c => `<li>🔍 ${c}</li>`).join("");
    let html = `<div class="placeholder-panel">
        <h3>🎒 背包</h3>
        <div>📦 持有物：${inv.length ? inv.join(", ") : "空空如也"}</div>
        <hr>
        <div>📜 线索：<ul>${clueHtml || "<li>暂无</li>"}</ul></div>
        <button class="game-btn back-btn" id="invBack">返回</button>
    </div>`;
    document.getElementById("mainPanel").innerHTML = html;
    document.getElementById("invBack")?.addEventListener("click", () => {
        gameData.ui.currentView = "dungeonList";
        updateUI_Global();
    });
}

// ========== 论坛 ==========
function renderForum() {
    let html = `<div class="placeholder-panel">
        <h3>📰 迷雾论坛</h3>
        <p>［热帖］耳钉与誓言 · 秘密讨论区</p>
        <p>玩家留言: 感化诡异太感人啦</p>
        <button class="game-btn back-btn" id="forumBack">返回</button>
    </div>`;
    document.getElementById("mainPanel").innerHTML = html;
    document.getElementById("forumBack")?.addEventListener("click", () => {
        gameData.ui.currentView = "dungeonList";
        updateUI_Global();
    });
}

// ========== 个人档案 ==========
function renderProfile() {
    let p = gameData.player;
    let html = `<div class="placeholder-panel">
        <h3>👤 命途档案</h3>
        <p>名号: ${p.name}</p>
        <p>等级 ${p.level} · 觉醒天赋 ${p.talent ? (p.talent === 'attack' ? '燃血之刃' : p.talent === 'heal' ? '抚慰之光' : '不动之躯') : '未选择'}</p>
        <button class="game-btn" id="resetTalentBtn">重置天赋(演示)</button>
        <button class="game-btn back-btn" id="profileBack">返回</button>
    </div>`;
    document.getElementById("mainPanel").innerHTML = html;
    
    document.getElementById("resetTalentBtn")?.addEventListener("click", () => {
        let choice = prompt("输入天赋: attack / heal / defense");
        if (choice === "attack" || choice === "heal" || choice === "defense") {
            gameData.player.talent = choice;
            updateUI_Global();
        }
    });
    document.getElementById("profileBack")?.addEventListener("click", () => {
        gameData.ui.currentView = "dungeonList";
        updateUI_Global();
    });
}

// ========== 路由 ==========
function renderCurrentView() {
    let view = gameData.ui.currentView;
    if (view === "dungeonList") renderDungeonList();
    else if (view === "dungeonGame") renderDungeonGame();
    else if (view === "shop") renderShop();
    else if (view === "inventory") renderInventory();
    else if (view === "forum") renderForum();
    else if (view === "profile") renderProfile();
}