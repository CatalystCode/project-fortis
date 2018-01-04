import url from 'url';

function fetchTermFromMap(termMap, termLookup, selectedLanguage, defaultLanguage) {
    return termMap.get(termLookup) || { name: termLookup, translatedname: termLookup };
}

function fromMapToArray(termMap, termLookup) {
    const name = termLookup.toLowerCase();

    return Array.from(termMap.values())
        .filter(topic => topic.translatedname.toLowerCase().indexOf(name) > -1);
}

function extractHostnameIfExists(name){
    const urlParts = url.parse(name);

    return urlParts.hostname ? urlParts.hostname.replace(/(www\.)|(\.com)/g,'') : name;
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

function getSentimentAttributes(sentiment) {
    let color;
    let icon;
    let style;
    let tooltip;

    if (sentiment < 0.3) {
        color = '#a43834';
        icon = 'sentiment_very_dissatisfied';
        style = 'negativeSentiment';
        tooltip = 'error';
    } else if (sentiment < 0.45) {
        color = '#ff9800';
        icon = 'sentiment_dissatisfied';
        style = 'neutralNegativeSentiment';
        tooltip = 'warning';
    } else if (sentiment < 0.60) {
        color = ' #f0c20c';
        icon = 'sentiment_neutral';
        style = 'neutralSentiment';
        tooltip = 'warning';
    } else if (sentiment < 0.8) {
        color = ' #fdd835';
        icon = 'sentiment_satisfied';
        style = 'neutralPositiveSentiment';
        tooltip = 'success';
    } else {
        color = '#4caf50';
        icon = 'sentiment_very_satisfied';
        style = 'positiveSentiment';
        tooltip = 'success';
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
    extractHostnameIfExists,
    hasChanged
}