// ==================== 数据层 ====================

let gameData = {
    player: {
        name: "探访者",
        level: 1,
        exp: 0,
        expToNext: 100,
        hp: 5,
        maxHp: 5,
        points: 150,
        talent: "",
        inventory: [],
        clues: [],
        flags: {
            exploreStep: 0,
            hasEarring: false,
            hasMetFriend: false,
            hasMetBigSpirit: false,
            hasFoundExit: false,
            hasFoundCabin: false,
            friendJoined: false,
            endingType: null,
            isInLostRealm: false,
            consecutiveDeaths: 0
        }
    },
    ui: {
        currentView: "dungeonList",
        currentDungeonId: "forest_cabin",
        currentSceneKey: "start",
        dungeonCompleted: false,
        dungeonTrueNameUnlocked: false
    },
    shopItems: [
        { id: "revive", name: "晦涩药水", desc: "恢复1点生命值", price: 80, type: "heal" },
        { id: "expPotion", name: "记忆残片", desc: "+30经验", price: 60, type: "exp" },
        { id: "lotteryTicket", name: "诡运抽奖", desc: "消耗80积分抽奖", price: 80, type: "lottery" }
    ]
};

// ==================== 森林探索系统 ====================

function getRandomEvent() {
    let step = gameData.player.flags.exploreStep || 0;
    step++;
    gameData.player.flags.exploreStep = step;
    
    let hasEarring = gameData.player.flags.hasEarring;
    let hasMetFriend = gameData.player.flags.hasMetFriend;
    let hasFoundCabin = gameData.player.flags.hasFoundCabin;
    let hasFoundExit = gameData.player.flags.hasFoundExit;
    
    if ((hasMetFriend && hasFoundCabin) || hasFoundExit) {
        return "nothing";
    }
    
    if (step >= 10 && !hasMetFriend && !hasFoundCabin && !hasFoundExit) {
        let r = Math.floor(Math.random() * 3);
        if (r === 0) return "findExit";
        if (r === 1) return "findFriend";
        return "findCabin";
    }
    
    let baseChance = 0.1;
    let chance = Math.min(baseChance + step * 0.04, 0.5);
    let roll = Math.random();
    
    if (roll < chance) {
        if (!hasFoundExit && !hasMetFriend && !hasFoundCabin) {
            let r = Math.random();
            if (r < 0.35) return "findExit";
            if (r < 0.7) return "findFriend";
            return "findCabin";
        } else if (!hasFoundExit && !hasMetFriend && hasFoundCabin) {
            let r = Math.random();
            if (r < 0.5) return "findExit";
            return "findFriend";
        } else if (!hasFoundExit && hasMetFriend && !hasFoundCabin) {
            return "findCabin";
        }
    }
    
    if (hasEarring && !hasMetFriend && Math.random() < 0.5) {
        return "findFriendByEarring";
    }
    
    return "nothing";
}

// ==================== 副本数据 ====================

const dungeonsData = {
    "forest_cabin": {
        displayName: "林中小屋",
        trueName: "永不褪色的耳钉",
        backstory: "那只诡曾在树下等待百年，直到一位少女愿意把耳钉分给她一只。她不是妖邪，只是孤独。",
        rewardExp: { low: 30, medium: 70, high: 120 },
        rewardPoints: { low: 10, medium: 25, high: 50 },
        
        startDescription: `你站在一片陌生的森林里，头顶是遮天蔽日的树冠，脚下是松软的腐殖土。
刚才还在和好友说着话，只是一个回身的功夫，她就不见了。
你喊了几声她的名字，只有自己的回声在林中飘荡。
手机没有信号，指南针在疯狂乱转。
你是来调查"林中小屋"怪事的，但现在，你连自己在哪都不知道。`,
        
        startOptions: [
            { text: "📱 使用道具", action: "showInventory" },
            { text: "🌲 抬头观察", action: "lookUp" },
            { text: "🚶 随便乱走", action: "wander" }
        ],
        
        scenes: {
            // ========== 道具系统 ==========
            "showInventory": {
                text: "你摸了摸身上的口袋，找到了这几样东西：",
                options: [
                    { text: "📱 手机", action: "usePhone" },
                    { text: "🧭 指南针", action: "useCompass" },
                    { text: "🔦 手电筒", action: "useFlashlight" },
                    { text: "🔙 返回", action: "backToStart" }
                ]
            },
            "usePhone": {
                text: `你掏出手机，屏幕亮起。\n没有信号。\n最后一条信息停留在你发给她的消息上，旁边是一个醒目的红色感叹号——\n"你在哪？"\n发送时间……就是刚才。但你明明没有发过这条消息。`,
                options: [{ text: "🔙 返回", action: "showInventory" }]
            },
            "useCompass": {
                text: `指南针的指针像疯了一样疯狂旋转，完全无法辨别方向。\n这片森林……好像不认东南西北。`,
                options: [{ text: "🔙 返回", action: "showInventory" }]
            },
            "useFlashlight": {
                text: `你打开手电筒，惨白的光束切开昏暗的森林。\n前方不远处，有什么东西在反光。\n那是一枚耳钉，上面沾着暗红色的……血？`,
                options: [
                    { text: "🔍 捡起耳钉", action: "pickUpEarring" },
                    { text: "🚫 不去理会", action: "ignoreEarring" },
                    { text: "🔙 收起手电", action: "showInventory" }
                ]
            },
            "pickUpEarring": {
                text: `你蹲下身，捡起那枚耳钉。\n是你送给她的那对——她生日时你挑了很久，说好了要一人一只。\n上面沾着的血迹已经干涸发黑。\n你的手在发抖。\n【获得线索：染血的耳钉】`,
                options: [{ text: "继续探索", action: "wander" }],
                onTrigger: () => {
                    gameData.player.flags.hasEarring = true;
                    if (!gameData.player.inventory.includes("染血的耳钉")) {
                        gameData.player.inventory.push("染血的耳钉");
                    }
                }
            },
            "ignoreEarring": {
                text: `你犹豫了一下，最终没有过去。\n那枚耳钉在光束中又闪了一下，像是某种无声的呼救。`,
                options: [
                    { text: "继续探索", action: "wander" },
                    { text: "🔙 返回道具栏", action: "showInventory" }
                ]
            },
            
            // ========== 观察 ==========
            "lookUp": {
                text: `你仰起头，树冠密不透风，几乎看不到天空。\n远处树冠上似乎挂着黑色的长条轮廓……像是……人的形状？\n你不敢细看，赶紧低下了头。`,
                options: [{ text: "继续探索", action: "wander" }]
            },
            
            // ========== 探索主循环 ==========
            "wander": {
                text: `你站在林间，四周都是相似的树木，分不清方向。`,
                options: [
                    { text: "⬅️ 向左走", action: "exploreLeft" },
                    { text: "➡️ 向右走", action: "exploreRight" },
                    { text: "⬆️ 向前走", action: "exploreForward" },
                    { text: "⬇️ 向后走", action: "exploreBack" },
                    { text: "📱 使用道具", action: "showInventory" },
                    { text: "🪑 原地等待", action: "waitHere" }
                ]
            },
            
            "exploreLeft": { text: `你拨开灌木向左走去。树影婆娑，前方似乎有一条被杂草掩埋的小径。`, options: [{ text: "继续探索", action: "checkEvent" }] },
            "exploreRight": { text: `右边是一片相对开阔的空地，空气中弥漫着潮湿的腐木气息。`, options: [{ text: "继续探索", action: "checkEvent" }] },
            "exploreForward": { text: `你径直向前，脚下的腐殖土越来越松软，像是很久没有人来过。`, options: [{ text: "继续探索", action: "checkEvent" }] },
            "exploreBack": { text: `你转身往回走，但很快发现——你根本不知道"回"是哪里。所有的树都长得一样。`, options: [{ text: "继续探索", action: "checkEvent" }] },
            "waitHere": { text: `你靠在树上，闭上眼睛听了听周围的动静。\n风吹过树梢，远处似乎有鸟鸣，但什么特别的事也没有发生。`, options: [{ text: "继续探索", action: "wander" }] },
            
            // ========== 事件判定节点 ==========
            "checkEvent": {
                text: ``,
                options: [],
                isEventRouter: true
            },
            
            // ========== 普通探索（无事件） ==========
            "nothing": {
                text: `你穿行在密林之中，周围只有风吹过树梢的沙沙声。\n脚下的路似乎没有尽头，你甚至开始怀疑自己是不是在原地打转。`,
                options: [
                    { text: "⬅️ 向左走", action: "exploreLeft" },
                    { text: "➡️ 向右走", action: "exploreRight" },
                    { text: "⬆️ 向前走", action: "exploreForward" },
                    { text: "⬇️ 向后走", action: "exploreBack" },
                    { text: "📱 使用道具", action: "showInventory" }
                ]
            },
            
            // ========== 发现出口 ==========
            "findExit": {
                text: `你迷迷糊糊地走着，突然发现前方的树木变得稀疏了。\n一缕真正的阳光穿过枝叶洒在地上。\n那是……森林的出口！\n你回头看了一眼身后的密林，好友还没有找到。\n要出去吗？还是回去找她？`,
                options: [
                    { text: "🚪 独自离开森林", action: "endingLow" },
                    { text: "🔙 回去继续找好友", action: "wander" }
                ]
            },
            
            // ========== 发现好友 ==========
            "findFriend": {
                text: `你转过一棵粗壮的老树，眼前突然出现一个熟悉的身影。\n"原来你在这里……"她转过头，脸色有些苍白，"我找了你好久……"\n她的眼神闪烁着，似乎在隐瞒什么。`,
                options: [
                    { text: "质问她为什么丢下你", action: "talkToFriend" },
                    { text: "告诉她你捡到了耳钉", action: "showEarringToFriend" },
                    { text: "先离开这里再说", action: "suggestLeaveWithFriend" }
                ],
                onTrigger: () => { gameData.player.flags.hasMetFriend = true; }
            },
            
            "findFriendByEarring": {
                text: `你攥着那枚染血的耳钉，心中突然有一个直觉——往某个方向走。\n大约走了十分钟，你看到好友正靠在一棵树下，闭着眼睛，脸上带着泪痕。\n"你……你怎么找到我的？"她睁开眼，看到是你，眼眶又红了。\n"你的耳钉……"你摊开手心。\n她愣住了。`,
                options: [
                    { text: "质问她发生了什么", action: "talkToFriend" },
                    { text: "提议一起离开", action: "suggestLeaveWithFriend" }
                ],
                onTrigger: () => { gameData.player.flags.hasMetFriend = true; }
            },
            
            "talkToFriend": {
                text: `"我看到有什么东西跟着我们……"她低下头，"我怕它伤到你，就去追它，结果迷路了。"\n"那是什么东西？"\n"我……我不知道。"她的眼神闪躲，"我们快离开这里好不好？"`,
                options: [
                    { text: "坚持要调查小屋", action: "insistGoCabin" },
                    { text: "答应和她一起离开", action: "endingMedium" },
                    { text: "追问她隐瞒了什么", action: "pressFriend" }
                ]
            },
            
            "pressFriend": {
                text: `"你在撒谎。"你直视她的眼睛。\n她沉默了很久，终于开口：\n"我……可能不是人。但我永远不会伤害你。"\n"那耳钉上的血呢？"\n"那是我不小心蹭到的……那只小东西很凶，我引开它的时候受了点伤。"\n她挽起袖子，手臂上有一道已经结痂的伤口。`,
                options: [
                    { text: "相信她，一起离开", action: "endingMedium" },
                    { text: "还是想去小屋看看", action: "insistGoCabin" }
                ]
            },
            
            "showEarringToFriend": {
                text: `"这是你的耳钉……上面有血。"\n她看到耳钉的那一刻，脸色彻底变了。\n"你……你在哪里找到的？"\n"在失散的地方附近。"\n她咬了咬嘴唇，"我没事……我们先离开这里好吗？"`,
                options: [
                    { text: "答应离开", action: "endingMedium" },
                    { text: "坚持去小屋", action: "insistGoCabin" }
                ]
            },
            
            "suggestLeaveWithFriend": {
                text: `"我们先出去吧。"你拉起她的手。\n她点点头，眼中闪过一丝感激。\n但你们刚走几步，身后的林子里传来一阵低沉的嘶吼。\n她猛地把你拉到身后。`,
                options: [
                    { text: "回头查看", action: "encounterBigSpirit" }
                ]
            },
            
            // ========== 发现小屋 ==========
            "findCabin": {
                text: `穿过一片低矮的灌木丛，你终于看到了那间传说中的小屋。\n木制的墙壁上爬满了枯萎的藤蔓，窗户黑洞洞的，像某种生物的瞳孔。\n空气中弥漫着腐朽的气息，但你隐约感觉到——里面有什么东西正在注视着你。`,
                options: [
                    { text: "🔍 靠近小屋", action: "approachCabin" },
                    { text: "🔙 暂时离开", action: "wander" }
                ],
                onTrigger: () => { gameData.player.flags.hasFoundCabin = true; }
            },
            
            "approachCabin": {
                text: function() {
                    if (gameData.player.flags.friendJoined) {
                        return `你走近小屋，门半掩着。\n好友紧跟在你的身后。\n里面很暗，你只能隐约看到一个扭曲的影子蜷缩在角落里。\n"离开。"一个沙哑的声音响起，"这里不欢迎活人。"`;
                    } else {
                        return `你走近小屋，门半掩着。\n里面很暗，你只能隐约看到一个扭曲的影子蜷缩在角落里。\n"离开。"一个沙哑的声音响起，"这里不欢迎活人。"`;
                    }
                },
                options: function() {
                    if (gameData.player.flags.friendJoined) {
                        return [
                            { text: "尝试对话", action: "talkToSpirit" },
                            { text: "挑衅它", action: "provokeSpiritWithFriend" },
                            { text: "转身离开", action: "wander" }
                        ];
                    } else {
                        return [
                            { text: "尝试对话", action: "talkToSpirit" },
                            { text: "挑衅它", action: "provokeSpirit" },
                            { text: "转身离开", action: "wander" }
                        ];
                    }
                }
            },
            
            "talkToSpirit": {
                text: function() {
                    if (gameData.player.flags.friendJoined) {
                        return `"我们不是来找麻烦的。"好友挡在你前面，"我们想离开这片森林。"\n那影子微微动了动。\n"你们……不是来砸东西的？"\n"不是。"好友摇头，"我们只是迷路了。"\n影子的声音低了下去，"往东边走，有一棵歪脖子树，那里是迷阵最薄的地方。往那个方向一直走，就能出去。"`;
                    } else {
                        return `"我们不是来找麻烦的。"你尽量让声音平静，"我的同伴走散了，我在找她。"\n那影子微微动了动。\n"你的同伴……那个不是人的小姑娘？"\n你愣住了。"你见过她？"\n"她引走了那只受惊的小东西，自己被迷阵困住了。"影子的声音低了下去，"往东边走，有一棵歪脖子树，她在那里。"`;
                    }
                },
                options: [
                    { text: "道谢，去找好友", action: "findFriendAfterCabin" },
                    { text: "问她为什么要吓唬人", action: "askWhy" }
                ]
            },
            
            "askWhy": {
                text: `"吓唬？"影子的声音突然变大，"是他们先砸我的东西！我让他们离开，他们不听，还想烧我的屋子！"\n它激动起来，屋内的温度骤降。\n"我只是想一个人待着……为什么都不放过我……"\n你心中涌起一股复杂的感觉。`,
                options: [
                    { text: "「我们没有恶意，只是路过。」", action: "tryConvince1" },
                    { text: "转身离开", action: "findFriendAfterCabin" }
                ]
            },
            
            "tryConvince1": {
                text: `"路过？"影子的声音带着讥讽，"上一个说路过的人，砸碎了我唯一的镜子。"\n"那不是我做的。"你平静地说，"我只想找到我的朋友，然后离开。"\n影子沉默了片刻。\n"你不怕我？"`,
                options: [
                    { text: "「有点怕，但我觉得你好像也不是那么坏。」", action: "tryConvince2" },
                    { text: "「……怕。」", action: "tryConvince2" }
                ]
            },
            
            "tryConvince2": {
                text: `影子发出一声低沉的哼笑。\n"怕还敢这么跟我说话？你们人类真是奇怪。"\n它的语气似乎没有那么敌对了。\n"算了。"它转过身，"你们可以在这里待几天。等雾散了，你们就可以走了。"\n「感化成功！」`,
                options: [{ text: "接受好意", action: "endingHigh" }],
                onTrigger: () => { gameData.player.flags.hasMetBigSpirit = true; }
            },
            
            // 独自挑衅
            "provokeSpirit": {
                text: `"这里又不是你的地方。"你冷声说道。\n那影子猛地膨胀起来，一双血红的眼睛在黑暗中亮起。\n"放肆！这里岂是尔等撒野之地，再不离开，就休怪我了！"\n一股无形的力量将你击飞，你撞在门框上。`,
                options: [
                    { text: "继续挑衅", action: "provokeSpiritAgain" },
                    { text: "道歉并离开", action: "wander" }
                ]
            },
            
            "provokeSpiritAgain": {
                text: `"我偏不走！"你咬牙站起来。\n影子彻底被激怒了，黑色的雾气将你笼罩。\n你失去了意识。\n「你激怒了诡异，生命值-1」`,
                options: [],
                isEnding: true,
                endingType: "death",
                onTrigger: () => {
                    gameData.player.hp = Math.max(0, gameData.player.hp - 1);
                }
            },
            
            // 与好友一起挑衅
            "provokeSpiritWithFriend": {
                text: `"这里又不是你的地方。"你冷声说道。\n好友拉住你的手臂："别说了……"\n那影子猛地膨胀起来，一双血红的眼睛在黑暗中亮起。\n"放肆！这里岂是尔等撒野之地！"\n好友挡在你面前："对不起，她不是故意的——"\n"让开！"影子怒吼。\n一股力量将好友推开，她摔倒在地，手臂擦破了皮。`,
                options: [
                    { text: "继续挑衅", action: "provokeSpiritAgainWithFriend" },
                    { text: "道歉并离开", action: "apologizeAndLeave" }
                ]
            },
            
            "provokeSpiritAgainWithFriend": {
                text: `"你凭什么伤她！"你冲上前。\n影子彻底被激怒了，黑色的雾气将你们笼罩。\n好友拼命拉住你，但已经来不及了——\n你失去了意识。\n「你激怒了诡异，通关失败」`,
                options: [],
                isEnding: true,
                endingType: "death",
                onTrigger: () => {
                    gameData.player.hp = Math.max(0, gameData.player.hp - 1);
                }
            },
            
            "apologizeAndLeave": {
                text: `"对不起……我们这就走。"好友扶着你退出小屋。\n影子没有追出来。\n你们头也不回地离开了。\n「你们离开了小屋，继续在森林中探索。」`,
                options: [
                    { text: "继续探索", action: "wander" }
                ]
            },
            
            "findFriendAfterCabin": {
                text: `你按照影子的指引，往东边走去。\n果然，在一棵歪脖子老树下，你看到了好友。\n"你……你怎么找到这里的？"她惊讶地看着你。\n"小屋里的……那个东西告诉我的。"\n她沉默了一会儿，"原来它不坏。是我太紧张了。"`,
                options: [
                    { text: "一起离开森林", action: "endingMedium" },
                    { text: "问她要不要回去感谢它", action: "goBackToSpirit" }
                ]
            },
            
            "goBackToSpirit": {
                text: `你们一起回到小屋。\n"谢谢你。"好友对着黑暗轻声说。\n影子没有回应，但你们感觉到一阵暖风拂过。\n"你们该走了，天快亮了。"\n你们走出森林的时候，晨光正好洒在身后。`,
                options: [],
                isEnding: true,
                endingType: "mediumPlus"
            },
            
            "insistGoCabin": {
                text: `"我不能就这样走。"你看着密林深处，"我想知道真相。"\n她叹了口气，"那我陪你。"\n你们一起往森林深处走去。`,
                options: [
                    { text: "继续探索", action: "wander" }
                ],
                onTrigger: () => { gameData.player.flags.friendJoined = true; }
            },
            
            "encounterBigSpirit": {
                text: function() {
                    if (gameData.player.flags.friendJoined) {
                        return `一个扭曲的影子从树后缓缓走出。\n"又一个。"它发出沙哑的声音，"你们为什么要来这里？"\n好友挡在你面前，身体微微发抖。`;
                    } else {
                        return `一个扭曲的影子从树后缓缓走出。\n"又一个。"它发出沙哑的声音，"为什么要来这里？"\n你下意识后退了一步，但身后没有退路。`;
                    }
                },
                options: function() {
                    if (gameData.player.flags.friendJoined) {
                        return [
                            { text: "尝试对话", action: "talkToSpirit" },
                            { text: "挑衅它", action: "provokeSpiritWithFriend" },
                            { text: "拉着好友逃跑", action: "endingMedium" }
                        ];
                    } else {
                        return [
                            { text: "尝试对话", action: "talkToSpirit" },
                            { text: "挑衅它", action: "provokeSpirit" },
                            { text: "转身逃跑", action: "endingMedium" }
                        ];
                    }
                }
            },
            
            // ========== 结局 ==========
            "endingLow": {
                text: `你独自走出了森林。\n回头望去，林间雾气弥漫，再也看不清来时的路。\n好友没有跟上来。\n你握紧手中的耳钉，心中涌起一阵愧疚。`,
                options: [],
                isEnding: true,
                endingType: "low"
            },
            
            "endingMedium": {
                text: `你们手牵着手，在林中摸索。\n终于，前方的树木变得稀疏，阳光洒了下来。\n"出来了……"她松了一口气。\n你回头看了一眼身后的森林，那间小屋和那些秘密，都留在了雾里。`,
                options: [],
                isEnding: true,
                endingType: "medium"
            },
            
            "endingHigh": {
                text: `雾渐渐散去，影子带着你们走出森林。\n临别时，它站在树影下，声音低沉：\n"谢谢你们……很久没有人跟我说过话了。"\n你回头看了一眼，晨光中，那间小屋仿佛没有那么阴森了。\n好友握紧了你的手，"走吧。"\n真相，有时候比想象中温柔。`,
                options: [],
                isEnding: true,
                endingType: "high"
            },
            
            "backToStart": {
                text: ``,
                options: [{ text: "继续探索", action: "wander" }]
            }
        }
    },
    
    "lost_realm": {
        displayName: "迷失之境",
        trueName: "虚空试炼",
        backstory: "徘徊者的迷阵，唯有战胜内心的恐惧才能归来。",
        rewardExp: 60,
        rewardPoints: 30,
        startDescription: `意识模糊，你感觉自己的身体在虚空中下沉。\n周围是无尽的黑暗，只有远处漂浮着几块破碎的记忆碎片。\n一个声音在你脑海中回响：\n"你已经迷失了……但还有最后一次机会。"\n"击败虚空中的怨魂，你就能重返人间。"`,
        startOptions: [
            { text: "接受试炼", action: "startTrial" },
            { text: "放弃抵抗（永久迷失）", action: "giveUp" }
        ],
        scenes: {
            "startTrial": {
                text: `虚空中，三只怨魂从黑暗中浮现。\n它们发出凄厉的尖叫，朝你扑来！\n你咬紧牙关，迎了上去……`,
                options: [{ text: "战斗", action: "fightWaves" }]
            },
            "fightWaves": {
                text: `第一波怨魂袭来！你挥拳击退它，但手臂被划出一道血痕。\n第二波……第三波……\n你的体力在流失，但心中的执念让你没有倒下。\n终于，最后一只怨魂消散在虚空中。\n光芒重新照耀在你身上。`,
                options: [],
                isEnding: true,
                endingType: "revive"
            },
            "giveUp": {
                text: `你闭上眼睛，任由黑暗将你吞噬。\n意识逐渐消散……\n你永远迷失在了虚空之中。`,
                options: [],
                isEnding: true,
                endingType: "permanentDeath"
            }
        }
    }
};
