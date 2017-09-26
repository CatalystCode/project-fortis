function fetchTermFromMap(termMap, termLookup, selectedLanguage, defaultLanguage) {
    return termMap.get(termLookup) || { name: termLookup, translatedname: termLookup };
}

function fromMapToArray(termMap, termLookup) {
    const name = termLookup.toLowerCase();

    return Array.from(termMap.values())
        .filter(topic => topic.translatedname.toLowerCase().indexOf(name) > -1);
}

function innerJoin(arr1, arr2) {
    let out = new Set();

    arr1.forEach(item => {
        if (arr2.indexOf(item) > -1) {
            out.add(item);
        }
    });

    return Array.from(out);
}

function getSentimentAttributes(avgsentiment) {
    let color = '#4CAF50', tooltip = 'success', icon = 'sentiment_very_satisfied', style = 'positiveSentiment';

    if (avgsentiment < 0.3) {
        color = '#a43834';
        icon = 'sentiment_very_dissatisfied';
        style = 'negativeSentiment';
        tooltip = 'error';
    } else if (avgsentiment < 0.45) {
        color = '#FF9800';
        icon = 'sentiment_dissatisfied';
        style = 'neutralNegativeSentiment';
        tooltip = 'warning';
    } else if (avgsentiment < 0.60) {
        color = ' #f0c20c';
        icon = 'sentiment_neutral';
        style = 'neutralSentiment';
        tooltip = 'warning';
    } else if (avgsentiment < 0.8) {
        color = ' #FDD835';
        icon = 'sentiment_satisfied';
        style = 'neutralPositiveSentiment';
    }

    return { color, icon, style, tooltip};
}

function hasChanged(prevProps, nextProps) {
    const nextplaceid = nextProps.selectedplace.placeid || "";
    const prevplaceid = prevProps.selectedplace.placeid || "";

    if (prevProps && prevProps.bbox &&
        nextProps.bbox === prevProps.bbox &&
        nextProps.zoomLevel === Math.max(nextProps.defaultZoom, prevProps.zoomLevel) &&
        nextProps.fromDate === prevProps.fromDate &&
        nextProps.toDate === prevProps.toDate &&
        nextProps.language === prevProps.language &&
        nextProps.maintopic === prevProps.maintopic &&
        prevplaceid === nextplaceid &&
        nextProps.externalsourceid === prevProps.externalsourceid &&
        nextProps.conjunctiveTermsLength === prevProps.conjunctiveTermsLength &&
        nextProps.dataSource === prevProps.dataSource) {
        
        return false;
      }

    return true;
}

module.exports = {
    fetchTermFromMap,
    fromMapToArray,
    innerJoin,
    getSentimentAttributes,
    hasChanged
}