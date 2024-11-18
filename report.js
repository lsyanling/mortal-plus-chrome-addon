{
    let badMoveUpperLimit = 5;
    let server = "http://localhost:12139";

    let ratingExists = false;
    let rating = "";
    let match = "";
    let badMove = "";
    let reportTime = "";

    chrome.storage.sync.get(
        {
            badMoveUpperLimit: 5,
            port: 12139
        }, (items) => {
            badMoveUpperLimit = items.badMoveUpperLimit;
            server = `http://localhost:${items.port}`;

            addBadMove();
            addButton();
        }
    );

    function addButton() {
        // 添加存入 Excel 按钮
        const saveToExcel = document.createElement("button");
        saveToExcel.textContent = i18nText.saveToExcel;

        const saveStatus = document.createElement("span");

        saveToExcel.addEventListener("click", _ => {
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
            request.send(JSON.stringify({
                ratingExists: ratingExists,
                rating: rating,
                match: match,
                badMove: badMove,
                reportTime: reportTime
            }));
            
            saveStatus.textContent = i18nText.processing;
        });

        const panel = document.getElementById("panel");
        panel.appendChild(document.createElement("br"));
        panel.appendChild(saveToExcel);
        panel.appendChild(saveStatus);
    }

    function addBadMove() {

        let badChooseNum = 0;

        const orderLosses = document.getElementsByClassName("order-loss");
        for (let i = 0, length = orderLosses.length; i !== length; ++i) {
            const orderLoss = orderLosses[i];
            const chosenIndex = parseInt(orderLoss.innerText.substring(2));

            const turnInfo = orderLoss.parentElement;
            const summary = turnInfo.parentElement;
            const collapseEntry = summary.parentElement;

            const details = collapseEntry.lastChild;
            const table = details.firstChild;
            const tbody = table.lastChild;

            const chosenTr = tbody.childNodes[chosenIndex - 1];
            const weightTd = chosenTr.lastChild;
            const intSpan = weightTd.firstChild;

            const chosenWeight = parseInt(intSpan.textContent);

            if (chosenWeight < badMoveUpperLimit) {
                const badChooseNode = document.createElement("span");
                badChooseNode.innerHTML = ` \u00A0\u00A0\u00A0${i18nText.badMove}`;
                badChooseNode.style.color = "#f55";
                turnInfo.appendChild(badChooseNode);

                badChooseNum++;
            }
        }

        let metaData;
        const detailsElements = document.getElementsByTagName("details");
        for (let i = 0, length = detailsElements.length; i !== length; ++i) {
            const details = detailsElements[i];
            const summary = details.firstChild;
            if (summary.firstChild.textContent === i18nText.metaData) {
                metaData = details;
                break;
            }
        }
        const metaDataDl = metaData.lastChild;

        let matchRatioDd = null;
        let version = null;
        for (let i = 0, length = metaDataDl.childNodes.length; i !== length; ++i) {
            const metaDataChild = metaDataDl.childNodes[i];
            if (metaDataChild.nodeName === "DT") {
                const content = metaDataChild.textContent;
                if (content === i18nText.rating) {
                    ratingExists = true;
                    const ratingDd = metaDataDl.childNodes[i + 1];
                    rating = ratingDd.textContent;
                } else if (content === i18nText.matchRatio) {
                    matchRatioDd = metaDataDl.childNodes[i + 1];
                    version = metaDataDl.childNodes[i + 2];
                } else if (content === i18nText.reportTime) {
                    const reportTimeDd = metaDataDl.childNodes[i + 1];
                    reportTime = reportTimeDd.textContent;
                }
            }
        }
        const matchRatioText = matchRatioDd.textContent;
        // 找出总手数
        const chooseNumStr = matchRatioText.substring(matchRatioText.indexOf("/") + 1);
        const chooseNum = parseInt(chooseNumStr);

        // 找出一致率值
        const matchRatioStr = matchRatioText.substring(matchRatioText.indexOf("=") + 1).trim();
        match = matchRatioStr.substring(0, matchRatioStr.length - 1);

        // 计算恶手率
        const badMoveRatio = (100 * badChooseNum / chooseNum).toFixed(3);
        badMove = badMoveRatio.toString();

        const badChooseRatioDt = document.createElement("dt");
        badChooseRatioDt.innerHTML = i18nText.badMoveRatio;
        const badChooseRatioDd = document.createElement("dd");
        badChooseRatioDd.innerHTML = `${badChooseNum}/${chooseNum} = ${badMoveRatio}%`;
        metaDataDl.insertBefore(badChooseRatioDd, version);
        metaDataDl.insertBefore(badChooseRatioDt, badChooseRatioDd);
    }
}