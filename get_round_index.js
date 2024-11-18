{
    document.getElementById("mortal-plus-result").textContent = JSON.stringify({
        roundIndex: MM.GS.hand_counter,
        actionIndex: MM.GS.ply_counter
    });
}