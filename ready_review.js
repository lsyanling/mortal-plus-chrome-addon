{
    let server = "http://localhost:12139";

    function detectLogUrl() {
        // 识别剪贴板上牌谱链接，自动填入
        navigator.clipboard.readText().then(
            text => {
                if (text.match(/game.maj-soul.com\/1\/\?paipu=/)) {
                    // 填入链接
                    const logUrls = document.getElementsByName("log-url");
                    if (logUrls.length !== 0) {
                        const logUrlInput = logUrls[0];
                        logUrlInput.value = text;
    
                        // 添加提示信息
                        let promptText = document.getElementById("mortalPlusPromptText");
                        if (promptText === null) {
                            promptText = document.createElement("div");
                            promptText.id = "mortalPlusPromptText";
                            promptText.textContent = "Mortal Plus: 来自剪贴板";
                            const parent = logUrlInput.parentNode;
                            parent.appendChild(promptText);
                        }
                    }
                }
            }
        );
    }

    function selectOption(select, text) {
        const children = select.children;
        let detected = null;
        // 搜索符合条件的选项
        for (let i = 0; i !== children.length; ++i) {
            const child = children[i];
            if (!child.hasAttribute("disabled") && child.textContent.indexOf(text) !== -1) {
                detected = child;
                select.value = child.value;
            }
        }
        if (detected !== null) {
            // 更改选择
            for (let i = 0; i !== children.length; ++i) {
                const child = children[i];
                if (child !== detected) {
                    child.removeAttribute("selected");
                } else {
                    child.setAttribute("selected", "selected");
                }
            }
        }
    }

    // 自动填入其他选项
    chrome.storage.sync.get(
        {
            port: 12139,
            detectClipboard: false,
            mortalModelName: "4.1b",
            ui: "KillerDucky",
            temperatureExists: false,
            temperature: 0,
            showRating: true
        }, items => {
            server = `http://localhost:${items.port}`;

            // 添加提交按钮监听，发送牌谱链接
            const submitBtns = document.getElementsByName("submitBtn");
            if (submitBtns.length !== 0) {
                const submitBtn = submitBtns[0];
                submitBtn.addEventListener("click", _ => {
                    // 读取提交的牌谱链接
                    const logUrls = document.getElementsByName("log-url");
                    if (logUrls.length !== 0) {
                        const logUrl = logUrls[0];

                        const request = new XMLHttpRequest();
                        request.open("POST", `${server}/api/updateLogUrl`);
                        request.send(JSON.stringify({
                            url: logUrl.value
                        }));
                    }
                });
            }

            if (items.detectClipboard) {
                // 读取剪贴板
                detectLogUrl();
                window.addEventListener("focus", _ => detectLogUrl());
            }

            // 选择模型
            const mortalModelTagSelect = document.getElementById("mortal-model-tag");
            if (mortalModelTagSelect !== null) {
                selectOption(mortalModelTagSelect, items.mortalModelName);
            }

            // 选择界面
            const ui = document.getElementById("ui");
            if (ui !== null) {
                selectOption(ui.children[0], items.ui);
            }

            // 填入温度
            if (items.temperatureExists) {
                const temperatures = document.getElementsByName("temperature");
                if (temperatures.length !== 0) {
                    const temperatureInput = temperatures[0];
                    temperatureInput.valueAsNumber = items.temperature;
                }
            }

            // 填入显示 rating
            const showRatings = document.getElementsByName("show-rating");
            if (showRatings.length !== 0) {
                const showRatingInput = showRatings[0];
                showRatingInput.checked = items.showRating;
            }
        }
    );
}