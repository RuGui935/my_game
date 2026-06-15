// ==================== 逻辑层 ====================

// 存储/读取
function saveToLocal() {
    localStorage.setItem("mistGameSave", JSON.stringify(gameData));
}

function loadFromLocal() {
    let saved = localStorage.getItem("mistGameSave");
    if(saved) {
        try {
            let tmp = JSON.parse(saved);
            gameData = tmp;
        } catch(e) {}
    }
}

// 经验升级
function addExp(amount) {
    let p = gameData.player;
    p.exp += amount;
    while(p.exp >= p.expToNext) {
        p.level++;
        p.exp -= p.expToNext;
        p.expToNext = Math.floor(p.expToNext * 1.2);
    }
    updateUI_Global();
}

// 加积分
function addPoints(pts) {
    gameData.player.points += pts;
    updateUI_Global();
}

// 扣血（死亡进入迷失副本）
// 扣血（连续死亡5次进入迷失副本）
function loseHp() {
    let p = gameData.player;
    p.hp--;
    p.flags.consecutiveDeaths = (p.flags.consecutiveDeaths || 0) + 1;
    updateUI_Global();
    
    if (p.hp <= 0) {
        if (p.flags.consecutiveDeaths >= 5) {
            // 连续死亡5次，进入迷失副本
            alert("⚠️ 你已连续迷失五次，被拖入虚空试炼！");
            p.hp = 1;
            p.flags.consecutiveDeaths = 0;
            gameData.ui.currentDungeonId = "lost_realm";
            gameData.ui.currentSceneKey = "start";
            gameData.ui.currentView = "dungeonGame";
            gameData.ui.dungeonCompleted = false;
            gameData.player.flags.isInLostRealm = true;
            renderDungeonGame();
        } else {
            alert(`⚠️ 你在副本中迷失了……剩余生命：${5 - p.flags.consecutiveDeaths}/5`);
            p.hp = 1;
            gameData.ui.currentView = "dungeonList";
            updateUI_Global();
        }
    }
    updateUI_Global();
}

// 结局处理（带弹窗）
function handleEnding(endingType, dungeonId) {
    let dungeon = dungeonsData[dungeonId];
    if (!dungeon) return;
    
    let title = "", message = "";
    let expReward = 0, pointReward = 0;
    let unlockTruth = false;
    
    if (dungeonId === "forest_cabin") {
        switch (endingType) {
            case "low":
                title = "🚪 独自离开";
                message = "你独自走出了森林，但好友还留在里面……\n你获得了一份愧疚和一枚染血的耳钉。";
                expReward = dungeon.rewardExp.low;
                pointReward = dungeon.rewardPoints.low;
                unlockTruth = false;
                break;
            case "medium":
                title = "🤝 结伴而归";
                message = "你和好友一起离开了森林。\n虽然还有很多疑问，但至少你们都安全了。";
                expReward = dungeon.rewardExp.medium;
                pointReward = dungeon.rewardPoints.medium;
                unlockTruth = false;
                break;
            case "mediumPlus":
                title = "🏚️ 和解之径";
                message = "你们一起感谢了那只孤独的诡异。\n它没有伤害你们，反而帮你们找到了出路。";
                expReward = dungeon.rewardExp.medium;
                pointReward = dungeon.rewardPoints.medium + 10;
                unlockTruth = false;
                break;
            case "high":
                title = "✨ 善意感化 ✨";
                message = "你用善意化解了孤寂。\n诡异让你们留宿，七天后带你们走出森林。\n你知道了真相——它只是太孤独了。";
                expReward = dungeon.rewardExp.high;
                pointReward = dungeon.rewardPoints.high;
                unlockTruth = true;
                break;
            case "death":
                title = "💀 激怒诡异 💀";
                message = "你的挑衅激怒了那只诡异……\n你被黑暗吞噬，迷失在森林深处。";
                expReward = 0;
                pointReward = 0;
                unlockTruth = false;
                break;
            default:
                expReward = dungeon.rewardExp.medium;
                pointReward = dungeon.rewardPoints.medium;
        }
    } else if (dungeonId === "lost_realm") {
        if (endingType === "revive") {
            title = "🌀 破境归来";
            message = "你击败了怨魂，从虚空中归来。\n生命恢复1点。";
            gameData.player.hp = Math.min(gameData.player.maxHp, gameData.player.hp + 1);
        } else {
            title = "💀 永久迷失";
            message = "你放弃了抵抗，永远留在了虚空之中。\n游戏结束。";
            expReward = 0;
            pointReward = 0;
        }
    }
    
    if (expReward > 0) addExp(expReward);
    if (pointReward > 0) addPoints(pointReward);
    if (unlockTruth) gameData.ui.dungeonTrueNameUnlocked = true;
    
    showModal(title, message, () => {
        if (endingType === "permanentDeath") {
            // 永久死亡：重置所有数据
            localStorage.removeItem("mistGameSave");
            alert("游戏进度已重置，刷新页面重新开始。");
            location.reload();
        } else {
            gameData.ui.currentView = "dungeonList";
            gameData.ui.dungeonCompleted = false;
            
            // 重置副本内标志
            gameData.player.flags = {
                exploreStep: 0,
                hasEarring: false,
                hasMetFriend: false,
                hasMetBigSpirit: false,
                hasFoundExit: false,
                hasFoundCabin: false,
                friendJoined: false,
                endingType: null
            };
            
            updateUI_Global();
        }
    });
}

// 弹窗函数
function showModal(title, message, onClose) {
    // 移除已存在的弹窗
    const existingModal = document.querySelector('.modal-overlay');
    if(existingModal) existingModal.remove();
    
    const modalHtml = `
        <div class="modal-overlay">
            <div class="modal-content">
                <div class="modal-title ${title.includes('成功') || title.includes('感化') || title.includes('平安') || title.includes('逃离') ? 'success' : 'death'}">${title}</div>
                <div class="modal-message">${message.replace(/\n/g, '<br>')}</div>
                <button class="modal-btn" id="modalConfirmBtn">确 定</button>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    const confirmBtn = document.getElementById('modalConfirmBtn');
    const overlay = document.querySelector('.modal-overlay');
    
    const closeModal = () => {
        overlay.remove();
        if(onClose) onClose();
    };
    
    confirmBtn.addEventListener('click', closeModal);
    overlay.addEventListener('click', (e) => {
        if(e.target === overlay) closeModal();
    });
}

// 处理副本内的动作
function processAction(actionName, dungeonId, scene) {
    let dungeon = dungeonsData[dungeonId];
    if (!dungeon) return;
    
    // 如果传入了 scene 参数，直接用；否则通过 sceneKey 获取
    let currentScene = scene;
    if (!currentScene) {
        let sceneKey = gameData.ui.currentSceneKey;
        currentScene = dungeon.scenes[sceneKey];
    }
    
    if (currentScene && currentScene.isEnding) {
        handleEnding(currentScene.endingType, dungeonId);
        return;
    }
    
    // 查找下一个场景
    let nextSceneKey = null;
    if (currentScene && currentScene.options) {
        let found = currentScene.options.find(opt => opt.action === actionName);
        if (found) nextSceneKey = found.action;
    }
    
    // 检查是否是预定义的场景
    if (nextSceneKey && dungeon.scenes[nextSceneKey]) {
        gameData.ui.currentSceneKey = nextSceneKey;
    } else if (dungeon.scenes[actionName]) {
        gameData.ui.currentSceneKey = actionName;
    } else {
        gameData.ui.currentSceneKey = "wander";
    }
    
    renderDungeonGame();
}