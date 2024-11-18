"use strict";

const GS = MM.GS;

class GameState {
    constructor(log) {
        let logIdx = 0
        this.rawRound = log[logIdx++]
        this.roundWind = Math.floor(this.rawRound[0]/4) + tm2t('e')
        this.dealerIdx = this.rawRound[0] % 4
        this.roundNum = this.dealerIdx
        this.honbas = this.rawRound[1]
        this.prevRoundSticks = this.rawRound[2]
        this.thisRoundSticks = [0,0,0,0]
        this.thisRoundExtraDoras = 0
        this.tilesLeft = 70
        this.scores = log[logIdx++]
        this.doraIndicator = log[logIdx++]
        this.dora = this.doraIndicator.map(doraIndicator2dora)
        this.uradora = log[logIdx++]
        this.hands = []
        this.draws = []
        this.discards = []
        this.discardPond = [[],[],[],[]]
        for (let pnum=0; pnum<4; pnum++) {
            this.hands.push(Array.from(log[logIdx++]))
            this.draws.push(log[logIdx++])
            this.discards.push(log[logIdx++])
        }
        this.resultArray = log[logIdx++]
        this.result = this.resultArray[0]
        this.scoreChanges = [0,0,0,0]
        this.winner = []
        this.payer = []
        this.pao = []
        this.yakuStrings = []
        let idx = 1
        let s = this.resultArray[idx]
        while(this.resultArray[idx]) {
            this.scoreChanges = this.scoreChanges.map((a, i) => a+this.resultArray[idx][i])
            idx++
            if (this.resultArray[idx]) {
                this.winner.push(this.resultArray[idx][0])
                this.payer.push(this.resultArray[idx][1])
                this.pao.push(this.resultArray[idx][2]) // TODO: Find an example of this
                this.yakuStrings.push(this.resultArray[idx].slice(3))
            }
            idx++
        }
        this.drawnTile = [null, null, null, null]
        this.calls = [[],[],[],[]]
        this.handOver = false
        this.genbutsu = [new Set, new Set, new Set, new Set]
        this.discardsToRiichi = [[],[],[],[]]
        this.reach_accepted = [false, false, false, false]
        this.unseenTiles = []
        for (let pidx=0; pidx<4; pidx++) {
            this.unseenTiles[pidx] = initUnseenTiles(pidx, this)
        }
    }
}

class UI {
    constructor() {
        this.hands = [[],[],[],[]]
        this.calls = [[],[],[],[]]
        this.discards = [[],[],[],[]]
        this.pInfo = [[],[],[],[]]
        this.pInfoResult = [[],[],[],[]]
        this.gridInfo = document.querySelector('.grid-info')
        this.round = document.querySelector('.info-round')
        this.tilesLeft = document.querySelector('.info-tiles-left')
        this.doras = document.querySelector('.info-doras')
        this.aboutModal = document.querySelector('.about-modal')
        this.infoRoundModal = document.querySelector('.info-round-modal')
        this.infoRoundTable = document.querySelector('.info-round-table')
        this.infoThisRoundModal = document.querySelector('.info-this-round-modal')
        this.infoThisRoundTable = document.querySelector('.info-this-round-table')
        this.infoThisRoundClose = document.querySelector('.info-this-round-close')
        this.genericModal = document.getElementById('generic-modal')
        this.genericModalBody = document.querySelector('.generic-modal-body')
        this.setPovPidx(0)
    }
    setPovPidx(newPidx) {
        this.povPidx = newPidx
        for (let pidx=0; pidx<4; pidx++) {
            let tmpPovPidx = (4 + pidx - this.povPidx) % 4
            this.hands[pidx] = document.querySelector(`.hand-closed-p${tmpPovPidx}`)
            this.calls[pidx] = document.querySelector(`.hand-calls-p${tmpPovPidx}`)
            this.discards[pidx] = document.querySelector(`.grid-discard-p${tmpPovPidx}`)
            this.pInfo[pidx] = document.querySelector(`.gi-p${tmpPovPidx}`)
            this.pInfoResult[pidx] = document.querySelector(`.gi-p${tmpPovPidx}-result`)
        }
    }
    roundStr(showSticks) {
        let str = i18next.t(GS.C_windStr[GS.gs.roundWind-tm2t('e')])
        str += (GS.gs.roundNum+1)
        if (GS.gs.honbas > 0) {
            str += "-" + GS.gs.honbas
        }
        if (showSticks && GS.gs.prevRoundSticks>0) {
            str += " +" + GS.gs.prevRoundSticks*1000
        }
        return str
    }
    reset() {
        this.round.replaceChildren(this.roundStr(true))
        this.doras.replaceChildren()
        this.tilesLeft.replaceChildren()
        for (let pidx=0; pidx<4; pidx++) {
            this.discards[pidx].replaceChildren()
            let seatWind = (4 + pidx - GS.gs.roundNum) % 4
            this.pInfo[pidx].replaceChildren(i18next.t(GS.C_windStr[seatWind]))
            this.pInfo[pidx].append(' ', GS.gs.scores[pidx]-GS.gs.thisRoundSticks[pidx]*1000)
            this.pInfoResult[pidx].replaceChildren()
            this.pInfoResult[pidx].append(this.formatString(-GS.gs.thisRoundSticks[pidx]*1000, false, true))
        }
    }
    formatString(num, showZero, addPlus) {
        if (!showZero && num == 0) {
            return ''
        }
        let s = (addPlus && num>0) ? '+' : ''
        s += num
        return s
    }
    parseYakuString(yaku) {
        let s = yaku.split(/([\(\)])|([0-9]+)/)
        s = s.map(x => { return !x ? '' : x.match(/[0-9\-\(\)]/) ? x : i18next.t(x) })
        return s.join(' ')
    }
    getResultTypeStr() {
        let resultTypeStr = []
        for (let idx=0; idx==0||idx<GS.gs.winner.length; idx++) {
            if (GS.gs.result == '和了') {
                const winnerStr = relativeToHeroStr(GS.gs.winner[idx])
                if (GS.gs.winner[0] === GS.gs.payer[0]) {
                    resultTypeStr[idx] = i18next.t('tsumo-full', {winner:winnerStr})
                } else {
                    const loserStr = relativeToHeroStr(GS.gs.payer[idx])
                    resultTypeStr[idx] = i18next.t('ron-full', {winner:winnerStr, loser:loserStr})

                }
            } else {
                resultTypeStr[idx] = i18next.t(GS.gs.result)
            }
        }
        return resultTypeStr
    }
    updateGridInfo() {
        this.clearDiscardBars()
        this.clearCallBars()
        let event = GS.ge[GS.hand_counter][GS.ply_counter]
        this.updateDiscardBars()
        this.updateCallBars()
        this.tilesLeft.append(`x${GS.gs.tilesLeft}`)
        if (event.mortalEval && event.mortalEval.tiles_left != GS.gs.tilesLeft) {
            console.log('tiles left mismatch:', event.mortalEval.tiles_left, GS.gs.tilesLeft)
        }
        for (let i=0; i<5; i++) {
            if (GS.gs.doraIndicator[i] == null || i > GS.gs.thisRoundExtraDoras) {
                this.doras.append(createTile('back'))
            } else {
                this.doras.append(createTile(tenhou2str(GS.gs.doraIndicator[i])))
            }
        }
        if (GS.gs.handOver) {
            this.infoThisRoundTable.replaceChildren()
            let table = document.createElement("table")
            let resultTypeStr = this.getResultTypeStr()
            for (let idx=0; idx==0||idx<GS.gs.winner.length; idx++) {
                if (idx>0) {
                    this.infoThisRoundTable.append(document.createElement("br"))
                }
                this.infoThisRoundTable.append(createParaElem(resultTypeStr[idx]))
                if (GS.gs.result == '和了') {
                    for (let yaku of GS.gs.yakuStrings[idx]) {
                        this.infoThisRoundTable.append(createParaElem(this.parseYakuString(yaku)))
                    }
                }
            }
            for (let pidx=0; pidx<4+1; pidx++) {
                let tr = table.insertRow()
                let cell = tr.insertCell()
                cell.textContent = `${relativeToHeroStr(pidx)}`
                cell = tr.insertCell()
                cell.textContent = `${event.scoreChangesPlusSticks[pidx]}`
            }
            table.style.margin = "10px auto"
            this.infoThisRoundTable.append(table)

            this.infoThisRoundModal.showModal()
            this.infoThisRoundModal.addEventListener('click', (event) => {
                this.infoThisRoundModal.close()
            })
            this.infoThisRoundClose.addEventListener('click', (event) => {
                this.infoThisRoundModal.close()
            })
        }
    }
    clearCallBars() {
        const callBars = document.querySelector('.killer-call-bars')
        let svgElement = document.createElementNS("http://www.w3.org/2000/svg", "svg")
        svgElement.setAttribute('transform-origin', 'top left')
        svgElement.setAttribute('transform', `scale(${GS.C_zoom})`)
        svgElement.setAttribute('style', 'position:absolute')
        callBars.replaceChildren(svgElement)
    }
    createTileSvg(x, y, tile) {
        if (isNaN(tile)) {
            console.log(tile)
            throw new Error()
        }
        const backgroundRect = document.createElementNS("http://www.w3.org/2000/svg", "rect")
        backgroundRect.setAttribute("x", x-1)
        backgroundRect.setAttribute("y", y-1)
        backgroundRect.setAttribute("width", "20")
        backgroundRect.setAttribute("height", "26")
        backgroundRect.setAttribute("fill", GS.C_colorTileBg)
        backgroundRect.setAttribute("rx", "2px")
        backgroundRect.setAttribute("ry", "2px")
        const tileSvg = document.createElementNS("http://www.w3.org/2000/svg", "image")
        tileSvg.setAttribute('href', `media/Regular_shortnames/${tenhou2str(tile)}.svg`)
        tileSvg.setAttribute("x", x)
        tileSvg.setAttribute("y", y)
        tileSvg.setAttribute("width", 18)
        return [backgroundRect, tileSvg]
    }
    updateCallBars() {
        let gameEvent = GS.ge[GS.hand_counter][GS.ply_counter]
        let mortalEval = gameEvent.mortalEval
        if (!GS.showMortal || !mortalEval) {
            return
        }
        const callBars = document.querySelector('.killer-call-bars')
        let svgElement = callBars.firstElementChild
        let slot = 0
        for (let [idx, detail] of mortalEval.details.entries()) {
            let Pval = detail.normProb*100
            let mortalDetail = !mortalEval.is_equal && idx==0
            if (detail.action.type == 'dahai' && !mortalDetail) {
                continue // Skip tiles (unless it's a mismatch)
            }
            if (slot>=GS.C_cb_maxShown-1 && !mortalDetail && mortalEval.actual_index != idx) {
                continue // Not enough room in GUI to show more
            }
            let xloc = GS.C_db_tileWidth*GS.C_cb_widthFactor/2 + slot*GS.C_db_tileWidth*GS.C_cb_widthFactor
            if (mortalEval.actual_index == idx) {
                svgElement.appendChild(createRect(
                    xloc-GS.C_db_heroBarWidth/2, GS.C_db_heroBarWidth, GS.C_cb_heroBarHeight, 1, GS.C_colorBarHero
                ))
            }
            svgElement.appendChild(createRect(
                xloc-GS.C_db_mortBarWidth/2, GS.C_db_mortBarWidth, GS.C_cb_heroBarHeight, Pval/100*GS.C_cb_mortBarHeightRatio, GS.C_colorBarMortal
            ))
            let textContent = i18next.t(detail.action.type)
            if (detail.action.type == 'hora' && detail.action.actor != detail.action.target) {
                textContent = i18next.t('ron') // translate defaults to Tsumo. Change to Ron in this case            
            }
            svgElement.appendChild(createSvgText(xloc-GS.C_db_mortBarWidth/2-10, GS.C_db_height + 20, textContent))
            // Some kans include pai, some don't.
            let pai = detail.action.type.endsWith('kan') ? detail.action.consumed[0] : detail.action.pai
            if (pai) {
                let tiles = [pai]
                if (detail.action.consumed && !detail.action.type.endsWith('kan')) {
                    tiles = detail.action.consumed
                }
                let x_offset = tiles.length == 1 ? 25 : 35 // why did I use svgs and now I have to write my own layout code!
                for (let i=0; i<tiles.length; i++) {
                    let tileSvg = this.createTileSvg(xloc+(i+1)*20-GS.C_db_mortBarWidth/2-x_offset, GS.C_db_height + 30, tiles[i])
                    svgElement.appendChild(tileSvg[0])
                    svgElement.appendChild(tileSvg[1])
                }
            }
            slot++
        }
        if (!mortalEval.is_equal) {
            let xloc = GS.C_db_tileWidth*GS.C_cb_widthFactor/5 + slot*GS.C_db_tileWidth*GS.C_cb_widthFactor
            let textContent = (mortalEval.details[mortalEval.actual_index].normProb > .50) ? i18next.t("Hmm...") : i18next.t("Clack!")
            svgElement.appendChild(createSvgText(xloc-GS.C_db_mortBarWidth/2, 60, textContent))
        }
    }
    clearDiscardBars() {
        const discardBars = document.getElementById("discard-bars")
        let [discardSvgElem, dangerSvgElem] = discardBars.children
        if (discardSvgElem) {
            discardSvgElem.replaceChildren()
            dangerSvgElem.replaceChildren()
            return
        }
        let svgElement = document.createElementNS("http://www.w3.org/2000/svg", "svg")
        svgElement.setAttribute("width", GS.C_db_totWidth)
        svgElement.setAttribute("height", GS.C_db_height)
        svgElement.setAttribute('transform-origin', 'top left')
        svgElement.setAttribute('transform', `scale(${GS.C_zoom})`)
        svgElement.classList.add('discard-bars-svg')
        discardBars.replaceChildren(svgElement)
        svgElement = document.createElementNS("http://www.w3.org/2000/svg", "svg")
        svgElement.setAttribute("width", GS.C_db_totWidth)
        svgElement.setAttribute("height", GS.C_db_height)
        svgElement.setAttribute('transform-origin', 'top left')
        svgElement.setAttribute('transform', `scale(${GS.C_zoom}, ${-GS.C_zoom}) translate(0, ${-1*(GS.C_db_height+GS.C_db_tileHeight)})`)
        svgElement.classList.add('danger-bars-svg')
        discardBars.append(svgElement)
    }
    updateDiscardBars() {
        let gameEvent = GS.ge[GS.hand_counter][GS.ply_counter]
        let mortalEval = gameEvent.mortalEval
        const discardBars = document.getElementById("discard-bars")
        let [discardSvgElem, dangerSvgElem] = discardBars.children
        if (!GS.showMortal) {
            discardSvgElem.appendChild(createSvgText(60,30,i18next.t("spoiler")))
            return
        }
        let showDangerBars = GS.showDealinRate && ('danger' in gameEvent)
        if (!mortalEval && !showDangerBars) {
            if (GS.showDealinRate) {
                dangerSvgElem.appendChild(createSvgText(60,30,i18next.t("dealin-riichi-only")))
                dangerSvgElem.lastChild.setAttribute('transform', 'translate(0, 50) scale(1, -1)')
            }
            return // nothing to display
        }
        let atLeastOnedanger = false
        for (let i = -1; i < GS.gs.hands[GS.heroPidx].length; i++) {
            let tile = (i==-1) ? GS.gs.drawnTile[GS.heroPidx] : GS.gs.hands[GS.heroPidx][i]
            if (tile == null) {
                continue // on calls there was no drawnTile
            }
            let slot = (i !== -1) ? i : GS.gs.hands[GS.heroPidx].length+0.5
            let xloc = GS.C_db_handPadding + GS.C_db_tileWidth/2 + slot*GS.C_db_tileWidth
            if (mortalEval) {
                let matchingDetailIdx = mortalEval.details.findIndex(x => x.action && x.action.type == 'dahai' && x.action.pai && x.action.pai==tile)
                // TODO: Check code for this. For now assume due to illegal calls swaps
                if (matchingDetailIdx != -1) {
                    let matchingDetail = mortalEval.details[matchingDetailIdx]
                    let Pval = matchingDetail.normProb*100
                    if (matchingDetailIdx == mortalEval.actual_index) {
                        discardSvgElem.appendChild(createRect(
                            xloc-GS.C_db_heroBarWidth/2, GS.C_db_heroBarWidth, GS.C_db_height, 1, GS.C_colorBarHero
                        ))
                    }
                    discardSvgElem.appendChild(createRect(
                        xloc-GS.C_db_mortBarWidth/2, GS.C_db_mortBarWidth, GS.C_db_height, Pval/100*GS.C_cb_mortBarHeightRatio, GS.C_colorBarMortal
                    ));
                }
            }
            if (showDangerBars) {
                for (let tenpaiPidx=0; tenpaiPidx<4; tenpaiPidx++) {
                    if (tenpaiPidx == GS.heroPidx) {
                        continue
                    }
                    atLeastOnedanger = true
                    let relToHero = relativeToHero(tenpaiPidx)
                    let color = GS.C_colorOpps[relToHero-1]
                    let fakeDangers = false
                    // fakeDangers = true
                    let Pval
                    if (fakeDangers) {
                        Pval = 7*relToHero
                    } else {
                        let thisDanger = gameEvent['danger'][tenpaiPidx][GS.heroPidx]
                        if (!thisDanger) {
                            continue
                        }
                        let matchingCombo = thisDanger['combos'][normRedFive(tile)]
                        Pval = matchingCombo === undefined ? 0 : matchingCombo['all']/thisDanger['combos']['all']*100
                    }
                    let PvalZoom = Math.min(Pval*(100/GS.C_db_dealinMax), 100)
                    dangerSvgElem.appendChild(createRect(
                        xloc-(2.5-relToHero)*GS.C_db_mortBarWidth, GS.C_db_mortBarWidth, GS.C_db_height, PvalZoom/100*GS.C_cb_mortBarHeightRatio, color
                    ));
                }
            }
        }
        if (GS.showDealinRate && !atLeastOnedanger) {
            dangerSvgElem.appendChild(createSvgText(60,30,i18next.t("dealin-riichi-only")))
            dangerSvgElem.lastChild.setAttribute('transform', 'translate(0, 50) scale(1, -1)')
        }
    }
    updateHandInfo() {
        for (let pidx=0; pidx<4; pidx++) {
            this.addHandTiles(pidx, 'hand', [], true)
            for (let tileInt of GS.gs.hands[pidx]) {
                // TODO: Draw and all tenpai could show the hands also?
                if (GS.showHands || (GS.gs.handOver && GS.gs.scoreChanges[pidx]>0) || pidx==GS.heroPidx) {
                    this.addHandTiles(pidx, 'hand', [tenhou2str(tileInt)], false)
                } else {
                    this.addHandTiles(pidx, 'hand', ['back'], false)
                }
            }
            this.addBlankSpace(pidx, true)
            if (GS.gs.drawnTile[pidx] != null) {
                if (GS.showHands || (GS.gs.handOver && GS.gs.scoreChanges[pidx]>0) || pidx==GS.heroPidx) {
                    this.addHandTiles(pidx, 'hand', [tenhou2str(GS.gs.drawnTile[pidx])], false)
                } else {
                    this.addHandTiles(pidx, 'hand', ['back'], false)
                }
            }
            if (GS.gs.calls[pidx].length > 0) {
                for (let tileInt of GS.gs.calls[pidx]) {
                    if (tileInt == 'rotate') {
                        this.rotateLastTile(pidx, 'hand')
                    } else if (tileInt == 'float') {
                        this.floatLastTile(pidx)
                    } else if (tileInt == 'back') {
                        this.addHandTiles(pidx, 'call', [tileInt], false)
                    } else {
                        this.addHandTiles(pidx, 'call', [tenhou2str(tileInt)], false)
                    }
                }
            }
        }
    }
    addHandTiles(pidx, type, tileStrArray, replace) {
        let div = type == 'call' ? this.calls[pidx] : this.hands[pidx]
        if (replace) {
            this.hands[pidx].replaceChildren()
            this.calls[pidx].replaceChildren()
        }
        for (let i in tileStrArray) {
            div.appendChild(createTile(tileStrArray[i]))
        }   
    }
    addDiscardTiles(pidx, tileStrArray, replace) {
        let div = this.discards[pidx]
        if (replace) {
            div.replaceChildren()
        }
        for (let i in tileStrArray) {
            // Add 4 blank placeholders for the first 2 rows of discards
            // The 3rd row will allow 4 overflow tiles
            // Then it overflows to the 4th row (and probably overlaps GUI stuff a bit)
            if (div.childElementCount == 6 || div.childElementCount == 12+4) {
                for (let j=0; j<4; j++) {
                    div.appendChild(createTile('Blank'))
                    div.lastChild.style.opacity = "0"
                }
            }
            div.appendChild(createTile(tileStrArray[i]))
        }   
    }
    rotateLastTile(pidx, type) {
        let div = (type=='hand') ? this.calls[pidx] : this.discards[pidx]
        div.lastChild.lastChild.classList.add('rotate')
    }
    floatLastTile(pidx) {
        let div = this.calls[pidx]
        div.lastChild.lastChild.classList.add('float')
    }
    addBlankSpace(pidx, narrow) {
        this.addHandTiles(pidx, 'hand', ['Blank'], false)
        this.hands[pidx].lastChild.style.opacity = "0"
        if (narrow) {
            this.hands[pidx].lastChild.classList.add('narrow')
        }
    }
    updateDiscardPond() {
        let event = GS.ge[GS.hand_counter][GS.ply_counter]
        // console.log('updateDiscardPond', event)
        for (let pidx=0; pidx<4; pidx++) {
            for (let tile of GS.gs.discardPond[pidx]) {
                this.addDiscard(pidx, [tenhou2str(tile.tile)], tile.tsumogiri, tile.riichi)
                if (tile.called) {
                    this.lastDiscardWasCalled(pidx)
                }
            }
            if (event.type=='dahai' && pidx==event.actor) {
                this.discards[pidx].lastChild.lastChild.classList.add('last-discard')
            }
        }
    }
    addDiscard(pidx, tileStrArray, tsumogiri, riichi) {
        this.addDiscardTiles(pidx, tileStrArray)
        if (tsumogiri) {
            this.discards[pidx].lastChild.lastChild.classList.add('tsumogiri')
        }
        if (riichi) {
            this.rotateLastTile(pidx, 'discard')
        }
    }
    lastDiscardWasCalled(pidx) {
        this.discards[pidx].lastChild.classList.add('called')
    }
    updateAbout() {
        let table = document.createElement("table")
        let metadata = document.querySelector('.about-metadata')
        metadata.replaceChildren(table)
        addTableRow(table, [i18next.t('Engine'), GS.fullData['engine']])
        addTableRow(table, [i18next.t('Model tag'), GS.fullData['review']['model_tag']])
        addTableRow(table, [i18next.t('Mjai-reviewer version'), GS.fullData['version']])
        addTableRow(table, [i18next.t('Game length'), i18next.t(GS.fullData['game_length'])])
        addTableRow(table, [i18next.t('Loading time'), GS.fullData['loading_time']])
        addTableRow(table, [i18next.t('Review time'), GS.fullData['review_time']])
        addTableRow(table, [i18next.t('Temperature'), GS.fullData['review']['temperature']])
        {
            let m = GS.fullData['review']['total_matches']
            let r = GS.fullData['review']['total_reviewed']
            let p = (m/r*100).toFixed(1)
            let s = `${m}/${r} = ${p}%`
            addTableRow(table, [i18next.t('Matches/total'), s])
        }
        addTableRow(table, [i18next.t('Rating'), (GS.fullData.review.rating*100).toFixed(1)])
    }
    updateResultsTable() {
        let table = document.createElement("table")
        this.infoRoundTable.replaceChildren(table)
        let hand_counter = 0
        let tr = table.insertRow()
        let cell = tr.insertCell()
        cell.textContent = i18next.t('Round')
        for (let i=0; i<2; i++) {
            for (let pidx=0; pidx<4+1; pidx++) {
                cell = tr.insertCell()
                cell.textContent = `${relativeToHeroStr(pidx)}`
            }
            if (i==0) {cell = tr.insertCell()}
        }
        for (let [roundNum, currGeList] of GS.ge.entries()) {
            GS.gs = new GameState(GS.fullData.split_logs[roundNum].log[0])
            let result = currGeList.slice(-1)[0]
            tr = table.insertRow()
            tr.addEventListener('click', () => {
                GS.hand_counter = roundNum
                GS.ply_counter = 0
                this.infoRoundModal.close()
                updateState()
            })
            cell = tr.insertCell()
            cell.textContent = this.roundStr(false)
            for (let pidx=0; pidx<4+1; pidx++) {
                cell = tr.insertCell()
                cell.textContent = pidx==4 ? GS.gs.prevRoundSticks*1000 : `${GS.gs.scores[pidx]}`
            }
            cell = tr.insertCell()
            for (let pidx=0; pidx<4+1; pidx++) {
                cell = tr.insertCell()
                cell.textContent = `${result.scoreChangesPlusSticks[pidx]}`
                if (result.scoreChangesPlusSticks[pidx] < -7000) {
                    cell.classList.add('big-loss')
                } else if (result.scoreChangesPlusSticks[pidx] < -3000) {
                    cell.classList.add('medium-loss')
                } else if (result.scoreChangesPlusSticks[pidx] > 7000) {
                    cell.classList.add('big-win')
                } else if (result.scoreChangesPlusSticks[pidx] > 3000) {
                    cell.classList.add('medium-win')
                }
            }
            hand_counter++
        }
        tr = table.insertRow()
        cell = tr.insertCell()
        cell.textContent = i18next.t("Final")
        let lastResult = GS.ge.slice(-1)[0].slice(-1)[0]
        for (let pidx=0; pidx<4+1; pidx++) {
            let finalScore = lastResult.scoreChangesPlusSticks[pidx]
            finalScore += pidx==4 ? GS.gs.prevRoundSticks*1000 : GS.gs.scores[pidx]
            cell = tr.insertCell()
            cell.textContent = `${finalScore}`
        }
        this.infoRoundModal.addEventListener('click', (event) => {
            this.infoRoundModal.close()
        })
    }
}
function createElemWithText(type, text) {
    let e = document.createElement(type)
    e.append(text)
    return e
}
function createParaElem(text) {
    return createElemWithText("p", text)
}
function createRect(x, width, totHeight, fillRatio, fill) {
    let y = (1-fillRatio)*totHeight
    let rect = document.createElementNS("http://www.w3.org/2000/svg", "rect")
    rect.setAttribute("x", x)
    rect.setAttribute("y", y)
    rect.setAttribute("width", width)
    rect.setAttribute("height", totHeight*fillRatio)
    rect.setAttribute("fill", fill)
    return rect
}
function createSvgText(x, y, text) {
    let svg = document.createElementNS("http://www.w3.org/2000/svg", "text")
    svg.setAttribute("x", x)
    svg.setAttribute("y", y)
    svg.setAttribute("fill", GS.C_colorText)
    svg.textContent = text
    return svg
}
function relativeToHero(pidx) {
    let relIdx = pidx<4 ? (4 + GS.heroPidx - pidx) % 4 : pidx
    return relIdx
}
function relativeToHeroStr(pidx, English=0) {
    let relIdx = relativeToHero(pidx)
    let key = ['Hero', 'Kami', 'Toimen', 'Shimo', 'Pot'][relIdx]
    if (English) {
        return key
    }
    return i18next.t(`position-rel.${key}`)
}

function addTableRow(table, values){
    let tr = table.insertRow()
    for (let v of values) {
        let cell = tr.insertCell()
        if (typeof v == 'object') {
            cell.appendChild(v)
        } else {
            cell.innerHTML = v
        }
    }
}
class Tile {
    constructor(tile) {
        this.tile = tile
        this.tsumogiri = false
        this.riichi = false
        this.rotate = false
        this.called = false
    }
}

//take '2m' and return 2 + 10 etc.
function tm2t(str) { 
    if (str == undefined) {
        console.log('undefined!')
    }
    if (!isNaN(str)) {
        // console.log('already?', str)
        return str
    }
    //tenhou's tile encoding:
    //   11-19    - 1-9 man
    //   21-29    - 1-9 pin
    //   31-39    - 1-9 sou
    //   41-47    - ESWN WGR
    //   51,52,53 - aka 5 man, pin, sou
    const tcon = { m : 1, p : 2, s : 3, z : 4 };
    // handle mortal '5sr' for red 5s
    if (str.length==3) {
        if (str[0] != '5' || str[2] != 'r') {
            throw new Error('Expected something like "5sr"!')
        }
        str = str.substring(0, str.length - 1)
        return 50+tcon[str[1]]
    }
    let num = parseInt(str[0]);
    if (isNaN(num)) {
        //                                                   Pai=White Fa=Green Chun=Red
        const yakuhai = { 'e': 41, 's': 42, 'w': 43, 'n': 44, 'p':45, 'f':46, 'c': 47}
        let tile = yakuhai[str[0].toLowerCase()]
        if (tile == null) {
            throw new Error(`Could not parse ${str}`)
        }
        return tile
    }

    return num ? 10 * tcon[str[1]] + num : 50 + tcon[str[1]];
}

// take 2+10 and return '2m'
function tenhou2str(tileInt) {
    if (tileInt > 50) {
        const akacon = { 51:'0m', 52:'0p', 53:'0s'}
        return akacon[tileInt]
    }
    let suitInt = Math.floor(tileInt / 10)
    tileInt = tileInt % 10
    const tcon = ['m', 'p', 's', 'z']
    let output = tileInt.toString() + tcon[suitInt-1]
    return output
}
// take 51 (0m) and return 15.1 for sorting
function tileInt2Float(tileInt) {
    let f = tileInt == 51 ? 15.1 : tileInt == 52 ? 25.1 : tileInt == 53 ? 35.1 : tileInt
    return f
}

// sort aka red fives
function tileSort(a, b) {
    let a1 = tileInt2Float(a)
    let b1 = tileInt2Float(b)
    return a1-b1
}

function normRedFive(t) {
    return t<51? t : t == 51 ? 15 : t == 52 ? 25 : t == 53 ? 35 : null
}

// 15 == 51, 25 == 52 (aka 5s are equal to normal 5s)
function fuzzyCompareTile(t1, t2) {
    let ft1 = normRedFive(t1)
    let ft2 = normRedFive(t2)
    return ft1 == ft2
}

function removeFromArray(array, value) {
    const indexToRemove = array.indexOf(value)
    if (indexToRemove === -1) { 
        throw new Error(`Value ${value} not in array ${array}`)
    }
    array.splice(indexToRemove, 1)
}

function onlyUpdateState() {
    GS.gs = new GameState(GS.fullData.split_logs[GS.hand_counter].log[0])
    for (let ply=0; ply <= GS.ply_counter; ply++) {
        let event = GS.ge[GS.hand_counter][ply]
        if (event.dora_marker) {
            GS.gs.thisRoundExtraDoras++
        }
        if (event.type == 'tsumo') {
            GS.gs.drawnTile[event.actor] = event.pai
            GS.gs.tilesLeft--
        } else if (event.type == 'chi' || event.type == 'pon' || event.type == 'daiminkan') {
            let dp = GS.gs.discardPond[event.target]
            dp[dp.length-1].called = true
            GS.gs.hands[event.actor].push(event.pai)
            let newCall = []
            let fromIdxRel = (4 + event.actor - event.target - 1) % 4
            let consumed = [...event.consumed]
            consumed.splice(fromIdxRel, 0, event.pai)
            for (let i=0; i<consumed.length; i++) {
                removeFromArray(GS.gs.hands[event.actor], consumed[i])
                newCall.push(consumed[i])
                if (i==fromIdxRel) {
                    newCall.push('rotate')
                }
                if (fromIdxRel+1 == i && event.type == 'daiminkan') {
                    newCall.push('rotate')
                    newCall.push('float')
                }
            }
            GS.gs.calls[event.actor] = newCall.concat(GS.gs.calls[event.actor])
        } else if (event.type == 'kakan') { // added kan
            GS.gs.hands[event.actor].push(GS.gs.drawnTile[event.actor])
            GS.gs.drawnTile[event.actor] = null
            removeFromArray(GS.gs.hands[event.actor], event.pai)
            let rotatedIdx = null
            for (let i=1; i<GS.gs.calls[event.actor].length; i++) {
                if (GS.gs.calls[event.actor][i]=='rotate' && fuzzyCompareTile(GS.gs.calls[event.actor][i-1], event.pai)) {
                    rotatedIdx = i
                    break
                }
            }
            if (rotatedIdx === null) {
                console.log(event, GS.gs.calls[event.actor])
                throw new Error('Cannot find meld to kakan to')
            }
            GS.gs.calls[event.actor].splice(rotatedIdx+1, 0, event.pai, 'rotate', 'float')
        } else if (event.type == 'ankan') { // closed kan
            GS.gs.hands[event.actor].push(GS.gs.drawnTile[event.actor])
            GS.gs.drawnTile[event.actor] = null
            let newCall = []
            for (let i=0; i<event.consumed.length; i++) {
                removeFromArray(GS.gs.hands[event.actor], event.consumed[i])
                if (i==0 || i==3) {
                    newCall.push('back')
                } else {
                    newCall.push(event.consumed[i])
                    newCall.push('rotate')
                    if (i==2) {
                        newCall.push('float')
                    }
                }
            }
            GS.gs.calls[event.actor] = newCall.concat(GS.gs.calls[event.actor])
        } else if (event.type == 'dahai') {
            // for calls there will not be a drawnTile
            if (GS.gs.drawnTile[event.actor]) {
                GS.gs.hands[event.actor].push(GS.gs.drawnTile[event.actor])
                GS.gs.drawnTile[event.actor] = null
            }
            let tile = new Tile(event.pai)
            tile.riichi = GS.ge[GS.hand_counter][ply-1].type == "reach"
            tile.tsumogiri = event.tsumogiri
            GS.gs.discardPond[event.actor].push(tile)
            removeFromArray(GS.gs.hands[event.actor], event.pai)
        } else if (event.type == 'reach') {
            // console.log('reach', GS.ply_counter)
        } else if (event.type == 'reach_accepted') {
            GS.gs.thisRoundSticks[event.actor]++
        } else if (event.type == 'hora' || event.type == 'ryukyoku') {
            GS.gs.handOver = true
        } else {
            console.log(event)
            throw new Error('unknown type')
        }
    }
    for (const hand of GS.gs.hands) {
        hand.sort(tileSort)
    }
}
function updateState() {
    onlyUpdateState()
    GS.ui.reset()
    GS.ui.updateHandInfo()
    GS.ui.updateDiscardPond()
    GS.ui.updateGridInfo()
    // discardOverflowTest()
}

const waitType = {
    ryanmen:0,
    kanchan:1,
    penchan:2,
    tanki:3,
    shanpon:4
}
Object.freeze(waitType)

function doraIndicator2dora(doraIndicator) {
    doraIndicator = normRedFive(doraIndicator)
    if (doraIndicator%10 == 9) {
        return doraIndicator-8
    }
    if (doraIndicator == 44) {
        return 41
    }
    if (doraIndicator == 47) {
        return 45
    }
    return doraIndicator+1
}

function initUnseenTiles(pidx, gs) {
    let allTiles = [11,12,13,14,15,16,17,18,19,21,22,23,24,25,26,27,28,29,31,32,33,34,35,36,37,38,39,41,42,43,44,45,46,47]
    let numT = {}
    for (let t of allTiles) {
        numT[t] = 4
    }
    let seenTiles = []
    seenTiles.push(...gs.hands[pidx])
    seenTiles.push(gs.doraIndicator[0])
    for (let t of seenTiles) {
        numT[normRedFive(t)]--
    }
    return numT
}

function createTile(tileStr) {
    if (!tileStr || tileStr == null || tileStr.length>5) {
        console.log('error', tileStr)
        throw new Error()
    }
    const tileDiv = document.createElement('div')
    const tileImg = document.createElement('img')
    tileDiv.append(tileImg)
    tileDiv.classList.add('tileDiv')
    tileImg.src = `media/Regular_shortnames/${tileStr}.svg`
    tileImg.classList.add('tileImg')
    return tileDiv
}

function incPlyCounter() {
    if (GS.ply_counter < GS.ge[GS.hand_counter].length-1) {
        GS.ply_counter++
    } else {
        incRoundCounter()
    }
}

function decPlyCounter() {
    if (GS.ply_counter > 0) {
        GS.ply_counter--
    } else {
        decRoundCounter()
        GS.ply_counter = GS.ge[GS.hand_counter].length-1
    }
}

function incRoundCounter() {
    GS.hand_counter++
    if (GS.hand_counter >= GS.ge.length) {
        GS.hand_counter = 0
    }
    GS.ply_counter = 0
}

function decRoundCounter() {
    GS.hand_counter--
    if (GS.hand_counter < 0) {
        GS.hand_counter = GS.ge.length-1
    }
    GS.ply_counter = GS.ge[GS.hand_counter].length-1
}

function showModalAndWait(modal) {
    modal.showModal()
    modal.addEventListener('click', (event) => {
        if (event.target == modal) {
            modal.close()
        }
    })
}

// Soften using temperature GS.C_soft_T
// Then normalize so the highest entry is set to 1, others scaled relative to the highest
function normalizeAndSoften(pdfs) {
    const hotter = pdfs.map(x => Math.pow(x, 1/GS.C_soft_T))
    const denom = Math.max(...hotter)
    return hotter.map(x => x/denom)
}