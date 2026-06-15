// ==================== 入口初始化 ====================

function initGame() {
    loadFromLocal();
    
    if(!gameData.player.talent) {
        let t = prompt("✨ 觉醒金色天赋 ✨\n输入 attack(战斗) / heal(感化) / defense(守护)", "heal");
        if(t === "attack" || t === "heal" || t === "defense") {
            gameData.player.talent = t;
        } else {
            gameData.player.talent = "heal";
        }
    }
    
    gameData.ui.currentView = "dungeonList";
    updateUI_Global();
    
    document.querySelectorAll(".nav-item").forEach(btn => {
        btn.addEventListener("click", (e) => {
            let nav = btn.getAttribute("data-nav");
            if(nav === "shop") gameData.ui.currentView = "shop";
            else if(nav === "inventory") gameData.ui.currentView = "inventory";
            else if(nav === "forum") gameData.ui.currentView = "forum";
            else if(nav === "profile") gameData.ui.currentView = "profile";
            else gameData.ui.currentView = "dungeonList";
            updateUI_Global();
        });
    });
    
    document.getElementById("settingsBtn")?.addEventListener("click", () => {
        alert("⚙️ 设置：音量/主题暂未深度开发");
    });
}

// 启动游戏
initGame();