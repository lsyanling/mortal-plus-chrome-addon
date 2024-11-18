{
    const actionIndex = JSON.parse(document.getElementById("mortal-plus-result").textContent);

    MM.GS.ply_counter = actionIndex;
    updateState();
}