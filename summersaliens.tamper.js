// ==UserScript==
// @name         Salien bot
// @namespace    http://tampermonkey.net/
// @version      0.6
// @description  Bot for steam summer sale game "Salien"
// @author       3DI70R
// @match        https://steamcommunity.com/saliengame/play/
// @grant        none
// ==/UserScript==

var isStateFinished = false
var lastState = null

function fireLaserAt(x, y) {
    var event = {}
    event.data = {}
    event.data.global = {}
    event.data.global.x = x
    event.data.global.y = y
    gGame.m_State.FireLaser(event)
}

function getCurrentState() {
    if(isInBootScreen()) { return "boot" }
    if(isInBattleSelection()) { return "battle_selection" }
    if(isInBattle()) { return "battle" }
}

function onStateChanged(oldState, newState) {
    isStateFinished = false
}

function isInBootScreen() {
    return gGame.m_State instanceof CBootState
}

function bootScreenEnterGame() {
    var button = gGame.m_State.button
    if(button) {
        console.log("Game started")
        button.click()
        isStateFinished = true
    }
}

function isInBattleSelection() {
    return gGame.m_State instanceof CBattleSelectionState
}

function battleSelectionPickHighestLevel() {
    var planetData = gGame.m_State.m_PlanetData
    if(planetData) {
        var zones = planetData.zones.slice()
	
        zones.sort(function(l, r) {
            return r.difficulty - l.difficulty
        })

        var firstNotCaptured = zones.find(function(e, i) {
            return e.captured == false
        });

        if(firstNotCaptured) {
            var pos = firstNotCaptured.zone_position
            var x = Math.floor(pos % 12)
            var y = Math.floor(pos / 12)

            if(gGame.m_State.m_Grid) {
                console.log("Staring new game in zone " + pos + " at: " + x + ", " + y)
                gGame.m_State.m_Grid.click(x, y)
                isStateFinished = true
            }
        }
    }
}

function isInBattle() {
    return gGame.m_State instanceof CBattleState
}

function battleDamageEnemies() {
    var enemyManager = gGame.m_State.m_EnemyManager
    if(enemyManager) {
        var regularEnemies = enemyManager.m_rgEnemies
        var enemies = []

        regularEnemies.forEach(function(value, id) {
            value.Damage(1);
            enemies.push(value)
        })

        if(enemies.length > 0) {
            var sprite = enemies[Math.floor(Math.random() * enemies.length)].m_Sprite
            fireLaserAt(sprite.x + sprite.width / 2, sprite.y + sprite.height / 2)
        }
    }
}

function battleExitOnVictory() {
    var victoryScreen = gGame.m_State.m_VictoryScreen
    if(victoryScreen) {
        var victoryButton = victoryScreen.children[1]
        if(victoryButton.visible) {
            console.log("Victory!")
            victoryButton.pointertap()
            isStateFinished = true
        }
    }
}

function battleExitOnLevelUp() {
    var levelUpScreen = gGame.m_State.m_LevelUpScreen
    if(levelUpScreen) {
        console.log("Level up!")
        gGame.m_State.m_LevelUpScreen.children[1].pointertap()
        isStateFinished = true
    }
}

function checkStateChange() {
    var currentState = getCurrentState()

    if(currentState != lastState) {
        onStateChanged(lastState, currentState)
        lastState = currentState
    }
}

function onLoop() {
    checkStateChange()

    if(!isStateFinished) {
	if(isInBootScreen()) {
            bootScreenEnterGame()
        } else if(isInBattle()) {
            battleDamageEnemies()
            battleExitOnVictory()
            battleExitOnLevelUp()
    	} else if(isInBattleSelection()) {
            battleSelectionPickHighestLevel()
        }	
    }
}

setTimeout(function() {
    setInterval(onLoop, 100);
}, 3000)
