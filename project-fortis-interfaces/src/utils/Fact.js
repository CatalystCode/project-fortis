import { contains } from './Utils.js';

// Fact component utils

// get prev and next fact using fact message id
export function getAdjacentArticles(id, facts) {
    let result = {
        "prev": null,
        "next": null,
    };

    if (!facts.length > 0) {
        return result;
    }

    let fact = facts.find(x => x.properties.messageid === id);
    let index = facts.indexOf(fact);
    let l = facts.length;

    if (index - 1 < l) {
        result.prev = facts[index - 1];
    }
    if (index + 1 < l) {
        result.next = facts[index + 1];
    }
    return result;
}

// returns a copy of filtered facts
export function getFilteredResults(facts, tag) {
    if (tag.length === 0) {
        return facts;
    }
    return facts.reduce(function (prev, fact) {
        if (contains(fact.properties.edges, tag)) {
            prev.push({ ...fact });
        }
        return prev;
    }, []);
}

export function arrayToFragment(array) {
    return (array) ? array.join('+') : "";
}

export function fragmentToArray(fragment) {
    return (fragment) ? fragment.split('+') : [];
}

export function changeFactsUrl(siteKey, selectedTags) {
    let url = "/site/{0}/facts/".format(siteKey);
    if (selectedTags.length > 0) {
        const fragment = arrayToFragment(selectedTags);
        url = "/site/{0}/facts/tags/{1}".format(siteKey, fragment.toLowerCase());
    }
    window.location.hash = url;
}
