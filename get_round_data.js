{
    const roundIndex = JSON.parse(document.getElementById("mortal-plus-result").textContent);

    document.getElementById("mortal-plus-result").textContent = JSON.stringify(MM.GS.ge[roundIndex].map(v => {
        if (v.hasOwnProperty("danger")) {
            delete v.danger;
        }
        return v;
    }));
}