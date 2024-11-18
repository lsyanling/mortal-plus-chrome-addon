{
    const badMoveUpperLimit = JSON.parse(document.getElementById("mortal-plus-result").textContent);

    const GS = MM.GS;
    const review = GS.fullData.review;
    const match = (100 * review.total_matches / review.total_reviewed).toFixed(3);
    const rating = (100 * review.rating).toFixed(3);

    let badMoveCount = 0;
    let actionCount = 0;
    for (const roundActions of GS.ge) {
        for (const action of roundActions) {
            if (action.hasOwnProperty("mortalEval")) {
                ++actionCount;

                const mortalEval = action.mortalEval;
                const detail = mortalEval.details[mortalEval.actual_index];
                if (detail.prob < badMoveUpperLimit / 100) {
                    ++badMoveCount;
                }
            }
        }
    }

    document.getElementById("mortal-plus-result").textContent = JSON.stringify({
        match: match,
        rating: rating,
        badMoveCount: badMoveCount,
        actionCount: actionCount
    });
}