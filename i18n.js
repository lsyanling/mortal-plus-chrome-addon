let i18nText = {};
{
    // 设置语言
    const lang = document.documentElement.lang;

    if (lang == "zh-CN") {
        i18nText.badMove = "恶手";
        i18nText.badMoveRatio = "恶手率";
        i18nText.rating = "rating";
        i18nText.matchRatio = "AI 一致率";
        i18nText.reportTime = "生成时间";

        i18nText.metaData = "元数据";
        i18nText.saveToExcel = "存入 Excel";
        i18nText.processing = "正在处理...";
        i18nText.saved = "已保存";
        i18nText.error = "错误";
    } else if (lang == "ja") {
        i18nText.badMove = "Bad move";
        i18nText.badMoveRatio = "bad moves/total";
        i18nText.rating = "rating";
        i18nText.matchRatio = "AI一致率";
        i18nText.reportTime = "生成日時";

        i18nText.metaData = "メタデータ";
        i18nText.saveToExcel = "Save to Excel";
        i18nText.processing = "Processing...";
        i18nText.saved = "Saved";
        i18nText.error = "Error";
    } else {
        i18nText.badMove = "Bad move";
        i18nText.badMoveRatio = "bad moves/total";
        i18nText.rating = "rating";
        i18nText.matchRatio = "matches/total";
        i18nText.reportTime = "generated at";
        
        i18nText.metaData = "Metadata";
        i18nText.saveToExcel = "Save to Excel";
        i18nText.processing = "Processing...";
        i18nText.saved = "Saved";
        i18nText.error = "Error";
    }
}