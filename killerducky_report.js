{
    self.Flatted = function (n) { "use strict"; function t(n) { return t = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (n) { return typeof n } : function (n) { return n && "function" == typeof Symbol && n.constructor === Symbol && n !== Symbol.prototype ? "symbol" : typeof n }, t(n) } var r = JSON.parse, e = JSON.stringify, o = Object.keys, u = String, f = "string", i = {}, c = "object", a = function (n, t) { return t }, l = function (n) { return n instanceof u ? u(n) : n }, s = function (n, r) { return t(r) === f ? new u(r) : r }, y = function n(r, e, f, a) { for (var l = [], s = o(f), y = s.length, p = 0; p < y; p++) { var v = s[p], S = f[v]; if (S instanceof u) { var b = r[S]; t(b) !== c || e.has(b) ? f[v] = a.call(f, v, b) : (e.add(b), f[v] = i, l.push({ k: v, a: [r, e, b, a] })) } else f[v] !== i && (f[v] = a.call(f, v, S)) } for (var m = l.length, g = 0; g < m; g++) { var h = l[g], O = h.k, d = h.a; f[O] = a.call(f, O, n.apply(null, d)) } return f }, p = function (n, t, r) { var e = u(t.push(r) - 1); return n.set(r, e), e }, v = function (n, e) { var o = r(n, s).map(l), u = o[0], f = e || a, i = t(u) === c && u ? y(o, new Set, u, f) : u; return f.call({ "": i }, "", i) }, S = function (n, r, o) { for (var u = r && t(r) === c ? function (n, t) { return "" === n || -1 < r.indexOf(n) ? t : void 0 } : r || a, i = new Map, l = [], s = [], y = +p(i, l, u.call({ "": n }, "", n)), v = !y; y < l.length;)v = !0, s[y] = e(l[y++], S, o); return "[" + s.join(",") + "]"; function S(n, r) { if (v) return v = !v, r; var e = u.call(this, n, r); switch (t(e)) { case c: if (null === e) return e; case f: return i.get(e) || p(i, l, e) }return e } }; return n.fromJSON = function (n) { return v(e(n)) }, n.parse = v, n.stringify = S, n.toJSON = function (n) { return r(S(n)) }, n }({});
    let badMoveUpperLimit = 5;
    let badMoveUpperLimit2 = 10;
    let server = "http://localhost:12139";

    let ratingExists = false;
    let rating = "";
    let match = "";
    let badMove = "";
    let reportTime = "";
    let badMoveCount = 0;
    let badMoveCount2 = 0;
    let actionCount = 0;

    let lang = "en";

    const roundPreview = {
        element: null,
        pointer: null,
        round: 0,
        actionIndex: 0,
        actionElements: [],

        createElement() {
            const main = document.getElementsByTagName("main")[0];

            const element = document.createElement("div");
            element.id = "round-preview";

            const pointerLine = document.createElement("div");
            pointerLine.style.height = "11px";
            element.appendChild(pointerLine);

            const actionLine = document.createElement("div");
            element.appendChild(actionLine);

            const pointer = document.createElementNS("http://www.w3.org/2000/svg", "svg");
            document.body.appendChild(pointer);
            pointer.setAttribute("width", "16");
            pointer.setAttribute("height", "11");
            pointer.style.position = "absolute";
            pointer.style.width = "16px";
            pointer.style.height = "11px";
            pointer.innerHTML = "<polygon points=\"0,0 16,0 8,11\" style=\"fill:white\" />";

            main.appendChild(element);

            this.element = actionLine;
            this.pointer = pointer;
        },

        tryUpdate() {
            evalMain("get_round_index.js", null, data => {
                if (data.roundIndex !== this.round) {
                    this.updateRound(data.roundIndex);
                    this.tryUpdate();
                }
                else if (data.actionIndex !== this.actionIndex) {
                    // 防止未加载完成时点击
                    if (this.actionElements.length === 0)
                        this.tryUpdate();
                    else
                        this.updateActionIndex(data.actionIndex);
                }
            });
        },

        updateRound(roundIndex) {
            this.round = roundIndex;
            this.element.innerHTML = "";
            this.actionElements.length = 0;

            evalMain("get_round_data.js", roundIndex, (data) => {
                const roundActions = data;
                if (roundActions === undefined || roundActions.entries === undefined) {
                    // 等待数据加载完成
                    setTimeout(() => this.updateRound(roundIndex), 100);
                    return;
                }
                for (const [i, action] of roundActions.entries()) {
                    const actionElement = document.createElement("span");
                    actionElement.className = "action";
    
                    // 根据权重计算颜色
                    let color;
                    if (action.hasOwnProperty("mortalEval")) {
                        const actualIndex = action.mortalEval.actual_index;
                        if (actualIndex !== 0) {
                            const actualAction = action.mortalEval.details[actualIndex];
                            if (actualAction.prob < badMoveUpperLimit / 100) {
                                color = "#ff0000";
                            } else if (actualAction.prob < badMoveUpperLimit2 / 100) {
                                color = "#ffff00";
                            } else {
                                color = "#ffffff";
                            }
                        } else {
                            color = "#ffffff4d";
                        }
                    } else {
                        color = "#ffffff4d";
                    }
                    actionElement.style.borderLeftColor = color;
    
                    actionElement.addEventListener("click", e => {
                        evalMain("set_action_index.js", i, _ => {
                            this.updateActionIndex(i);
                        });
                    })
                    this.element.appendChild(actionElement);
    
                    this.actionElements.push(actionElement);
                }
    
                this.updateActionIndex(0);
            });
        },

        updateActionIndex(actionIndex) {
            this.actionIndex = actionIndex;
            const actionElement = this.actionElements[actionIndex];
            const rect = actionElement.getBoundingClientRect();
            this.pointer.style.left = `${rect.left - 8}px`;
            this.pointer.style.top = `${rect.top - 11}px`;
        }
    };

    chrome.storage.sync.get(
        {
            badMoveUpperLimit: 5,
            badMoveUpperLimit2: 10,
            port: 12139
        }, (items) => {
            badMoveUpperLimit = items.badMoveUpperLimit;
            badMoveUpperLimit2 = items.badMoveUpperLimit2;
            server = `http://localhost:${items.port}`;

            // 总是把宽松的放在2号位
            if (badMoveUpperLimit2 < badMoveUpperLimit) {
                [badMoveUpperLimit, badMoveUpperLimit2] = [badMoveUpperLimit2, badMoveUpperLimit];
            }

            const resultElem = document.createElement("div");
            resultElem.id = "mortal-plus-result";
            resultElem.style.display = "none";
            document.body.appendChild(resultElem);

            // 等待 Mortal 危险度计算
            setTimeout(() => evalMain("reviewer_index.js", null, () => {
                getReportData();
            }), 2000);
        }
    );

    function getReportData() {
        // 获取报告数据中的一致率和评分
        evalMain("get_report_data.js", [badMoveUpperLimit, badMoveUpperLimit2], function (data) {
            match = data.match;
            rating = data.rating;
            badMoveCount = data.badMoveCount;
            badMoveCount2 = data.badMoveCount2;
            actionCount = data.actionCount;

            addBadMove();
            addButton();
            roundPreview.createElement();
            roundPreview.updateRound(0);
            addListener();
            addTenhouButton();
        });
    }

    function addBadMove() {

        const badMoveVal = badMoveCount / actionCount;
        badMove = (100 * badMoveVal).toFixed(3);

        // 创建恶手率节点
        const badMoveTr = document.createElement("tr");
        const badMoveTd = document.createElement("td");
        badMoveTr.appendChild(badMoveTd);
        const badMoveValueTd = document.createElement("td");
        badMoveValueTd.textContent = `${badMoveCount}/${actionCount} = ${(100 * badMoveCount / actionCount).toPrecision(3)}%`;
        badMoveTr.appendChild(badMoveValueTd);

        // 搜索一致率节点
        const metadata = document.getElementsByClassName("about-metadata")[0];
        const table = metadata.children[0];
        const tbody = table.children[0];
        let matchRatioTr;
        for (let trIndex = 0, count = tbody.children.length; trIndex !== count; ++trIndex) {
            const tr = tbody.children[trIndex];
            const td = tr.children[0];
            // 大小写导致的
            if (td.textContent === "Matches/total") {
                badMoveTd.textContent = badMoveUpperLimit + "% Bad moves/total";
                matchRatioTr = tr;
            }
            // 不认语言导致的
            else if (td.textContent === "AI 一致率") {
                lang = "zh-CN";
                badMoveTr.children[0].textContent = badMoveUpperLimit + "% 恶手率";
                matchRatioTr = tr;
            }
        }
        // 把恶手率节点添加到一致率后
        tbody.insertBefore(badMoveTr, matchRatioTr.nextSibling);

        if (badMoveUpperLimit2 !== badMoveUpperLimit) {
            const badMoveVal2 = badMoveCount2 / actionCount;
            badMove2 = (100 * badMoveVal2).toFixed(3);

            // 创建恶手率节点
            const badMoveTr2 = document.createElement("tr");
            const badMoveTd2 = document.createElement("td");
            badMoveTr2.appendChild(badMoveTd2);
            const badMoveValueTd2 = document.createElement("td");
            badMoveValueTd2.textContent = `${badMoveCount2}/${actionCount} = ${(100 * badMoveCount2 / actionCount).toPrecision(3)}%`;
            badMoveTr2.appendChild(badMoveValueTd2);

            if (lang === "zh-CN") {
                badMoveTd2.textContent = badMoveUpperLimit2 + "% 恶手率";
            } else {
                badMoveTd2.textContent = badMoveUpperLimit2 + "% Bad moves/total";
            }

            tbody.insertBefore(badMoveTr2, badMoveTr.nextSibling);
        }
    }

    // 保存到excel按钮
    function addButton() {
        const metadata = document.getElementsByClassName("about-metadata")[0];

        // 创建按钮和状态信息
        const p = document.createElement("p");
        metadata.parentNode.insertBefore(p, metadata.nextSibling);

        const saveButton = document.createElement("button");
        saveButton.textContent = i18nText.saveToExcel;
        metadata.parentNode.insertBefore(saveButton, p.nextSibling);

        const saveStatus = document.createElement("span");
        metadata.parentNode.insertBefore(saveStatus, saveButton.nextSibling);

        saveButton.addEventListener("click", _ => {
            const request = new XMLHttpRequest();
            request.open("POST", `${server}/api/saveToExcel`);
            request.onload = _ => {
                const result = JSON.parse(request.responseText);
                if (result.win) {
                    saveStatus.textContent = i18nText.saved;
                } else {
                    saveStatus.textContent = `${i18nText.error}: ${result.error}`;
                }
            };
            const now = new Date();
            reportTime = now.toLocaleString();
            request.send(JSON.stringify({
                ratingExists: ratingExists,
                rating: rating,
                match: match,
                badMove: badMove,
                reportTime: reportTime
            }));

            saveStatus.textContent = i18nText.processing;
        });
    }

    function addListener() {
        document.addEventListener("click", e => {
            if (e.target.matches("#round-dec, #round-inc, #prev-mismatch, #next-mismatch, #ply-dec2, #ply-inc2, #ply-dec, #ply-inc")) {
                roundPreview.tryUpdate();
            }
        });
        document.addEventListener("keydown", e => {
            roundPreview.tryUpdate();
        });
        document.addEventListener("wheel", e => {
            roundPreview.tryUpdate();
        });
    }

    function evalMain(path, param, callback) {
        if (param !== null) {
            document.getElementById("mortal-plus-result").textContent = Flatted.stringify(param);
        }

        const script = document.createElement("script");
        script.src = chrome.runtime.getURL(path);
        script.onload = function () {
            if (callback !== null) {
                const resultJson = document.getElementById("mortal-plus-result").textContent;
                let result = undefined;
                if (resultJson !== "") {
                    result = Flatted.parse(resultJson);
                }
                callback(result);
            }
            this.remove();
        };
        document.documentElement.appendChild(script);
    }

    function getRoundIndex(callback) {
        return evalMain("get_round_index.js", null, callback);
    }

    function addTenhouButton() {
        const killerCallDiv = document.getElementsByClassName("killer-call-div")[0];

        const tenhouButton = document.createElement("button");
        if(lang === "en") {
            tenhouButton.textContent = "Link to Tenhou 牌理";
        }
        else{
            tenhouButton.textContent = "跳转到 天凤牌理";
        }
        killerCallDiv.insertBefore(tenhouButton, killerCallDiv.lastChild);

        tenhouButton.addEventListener("click", _ => {
            evalMain("get_hand.js", null, function(data){
                let handtile = removeDuplicates(data);
                const url = `https://tenhou.net/2/?q=${handtile}`;
                window.open(url, "_blank");
            });
        });
    }

    function removeDuplicates(str) {
        // 要去除重复的字符集合
        const charsToRemove = ['m', 'p', 's', 'z'];
        
        // 使用 Set 来记录已出现的字符
        const seen = new Set();
        
        // 逆序遍历字符串，最后一个出现的字符会被保留
        let result = '';
        for (let i = str.length - 1; i >= 0; i--) {
            let char = str[i];
            
            // 如果字符在要删除的字符集合内，并且之前没有出现过，则保留
            if (charsToRemove.includes(char) && !seen.has(char)) {
                seen.add(char);  // 记录该字符
                result = char + result;  // 添加到结果字符串的开头
            } else if (!charsToRemove.includes(char)) {
                result = char + result;  // 其他字符直接添加
            }
        }
        
        return result;
    }
    
}