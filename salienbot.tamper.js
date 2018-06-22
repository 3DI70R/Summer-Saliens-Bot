// ==UserScript==
// @name         Salien bot
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Bot for steam summer sale game "Saliens"
// @author       3DI70R
// @match        https://steamcommunity.com/saliengame/play/
// @grant        none
// ==/UserScript==

var isVictoryButtonClicked = false
var isGridSelected = false
var lastState = null

function getCurrentState() {
    if(isInBattleSelection()) { return "battle_selection" }
    if(isInBattle()) { return "battle" }
}

function onStateChanged(oldState, newState) {
    isGridSelected = false
    isVictoryButtonClicked = false
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

            if(gGame.m_State.m_Grid && !isGridSelected) {
                console.log("Staring new game at zone " + pos + " at: " + x + ", " + y)
                gGame.m_State.m_Grid.click(x, y)
                isGridSelected = true
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
        regularEnemies.forEach(function(value, id) {
            value.Damage(1);
        })
    }
}

function battleExitOnVictory() {
    if(gGame.m_State.m_VictoryScreen) {
        var victoryButton = gGame.m_State.m_VictoryScreen.children[1]
        if(victoryButton.visible && !isVictoryButtonClicked) {
            console.log("Victory!")
            victoryButton.click()
            isVictoryButtonClicked = true
        }
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
    if(isInBattle()) {
        battleDamageEnemies()
        battleExitOnVictory()
    } else if(isInBattleSelection()) {
        battleSelectionPickHighestLevel()
    }
}

setInterval(onLoop, 100);
