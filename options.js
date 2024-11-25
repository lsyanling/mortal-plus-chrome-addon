const saveOptions = () => {
    const serverPortInput = document.getElementById("serverPortInput");
    const detectClipboardInput = document.getElementById("detectClipboardInput");
    const modelNameInput = document.getElementById("modelNameInput");
    const uiSelect = document.getElementById("uiSelect");
    const temperatureInput = document.getElementById("temperatureInput");
    const showRatingInput = document.getElementById("showRatingInput");
    const badMoveUpperLimit = document.getElementById("badMoveUpperLimitInput");
    const badMoveUpperLimit2 = document.getElementById("badMoveUpperLimitInput2");

    chrome.storage.sync.set(
        {
            port: serverPortInput.valueAsNumber,
            detectClipboard: detectClipboardInput.checked,
            mortalModelName: modelNameInput.value,
            ui: uiSelect.value,
            temperatureExists: temperatureInput.value !== "",
            temperature: temperatureInput.valueAsNumber,
            showRating: showRatingInput.checked,
            badMoveUpperLimit: badMoveUpperLimit.value,
            badMoveUpperLimit2: badMoveUpperLimit2.value
        }, () => { }
    );
}

const restoreOptions = () => {
    const serverPortInput = document.getElementById("serverPortInput");
    const detectClipboardInput = document.getElementById("detectClipboardInput");
    const modelNameInput = document.getElementById("modelNameInput");
    const uiSelect = document.getElementById("uiSelect");
    const temperatureInput = document.getElementById("temperatureInput");
    const showRatingInput = document.getElementById("showRatingInput");
    const badMoveUpperLimit = document.getElementById("badMoveUpperLimitInput");
    const badMoveUpperLimit2 = document.getElementById("badMoveUpperLimitInput2");

    chrome.storage.sync.get(
        {
            port: 12139,
            detectClipboard: true,
            mortalModelName: "4.1b",
            ui: "KillerDucky",
            temperatureExists: false,
            temperature: 0,
            showRating: true,
            badMoveUpperLimit: 5,
            badMoveUpperLimit2: 10
        }, (items) => {
            serverPortInput.valueAsNumber = items.port;
            detectClipboardInput.checked = items.detectClipboard;
            modelNameInput.value = items.mortalModelName;
            uiSelect.value = items.ui;
            if (items.temperatureExists) {
                temperatureInput.valueAsNumber = items.temperature;
            }
            showRatingInput.checked = items.showRating;
            badMoveUpperLimit.value = items.badMoveUpperLimit.toString();
            badMoveUpperLimit2.value = items.badMoveUpperLimit2.toString();
        }
    );
}

document.addEventListener("DOMContentLoaded", restoreOptions);
document.getElementById("saveButton").addEventListener("click", saveOptions);