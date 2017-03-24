import moment from 'moment';

function InvalidPropException(propName) {
   this.propName = propName;
   this.name = "InvalidPropException";
}

export function guid (){
    function _p8(s) {
        var p = (Math.random().toString(16)+"000000000").substr(2,8);
        return s ? "-" + p.substr(0,4) + "-" + p.substr(4,4) : p ;
    }
    return _p8() + _p8(true) + _p8(true) + _p8();
}

export function momentToggleFormats(dateString, fromFormat, targetFormat){
      return moment(dateString, fromFormat).format(targetFormat);
 }

 export function momentGetFromToRange(dateString, fromFormat, rangeType){
      let sourceMoment = moment(dateString, fromFormat);
      
      return {
          fromDate: sourceMoment.startOf(rangeType).format(),
          toDate: sourceMoment.endOf(rangeType).format(),
      };
 }

 export function momentLastMonths(months=1) {
      return {
          fromDate: moment().subtract(months, 'months').format("MM/DD/YYYY"),
          toDate: moment().format("MM/DD/YYYY"),
      };
 }

function GetSitePrefixKey(siteKey){
     let propNamePrefix;

     if(process.env.REACT_APP_SITES){
         let sitePrefixes = process.env.REACT_APP_SITES.split(',');

         if(sitePrefixes.length > 0){
             let site = sitePrefixes.find(site=>site.startsWith(siteKey+":"));
             let siteSplit = site.split(':');

             if(siteSplit.length === 2){
                 propNamePrefix = siteSplit[1];
             }
         }
     }
     
     if(!propNamePrefix){
         throw new InvalidPropException(siteKey);
     }

     return propNamePrefix;
} 

export function getEnvPropValue(siteKey, propValueJSONStr){
     let propertyJSON = JSON.parse(propValueJSONStr);
     let sitePrefix = GetSitePrefixKey(siteKey);

     if(Object.keys(propertyJSON).length === 0){
         throw new InvalidPropException(propValueJSONStr);
     }

     let propValue = propertyJSON[sitePrefix];

     if(!propValue){
         throw new InvalidPropException(sitePrefix);
     }

     return propValue;
 }

// converts date string using date format
export function getHumanDate(dateString, dateFormat="YYYY-MM-DD", newDateFormat="ddd MMM Do YY") {
     var dateStr = (dateFormat === "YYYY-MM-DD") ? dateString.substr(0,10) : dateString ;
     return moment(dateStr, dateFormat).format(newDateFormat);
}

export function getHumanDateFromNow(dateString, dateFormat="MM/DD/YYYY HH:mm:s A") {
    return moment(dateString, dateFormat).fromNow();
}

// array helpers
export function flatten(arr){
	return [].concat(...arr);
}

export function unique(arr){
	return [...new Set(arr)];
}

export function flattenUnique(arr){
	return unique(flatten(arr));
}

// NB: case sensitive
export function contains(arr, tag) {
	// array matches
	if (Array.isArray(tag)) {
		return tag.some(x => arr.indexOf(x) > -1);
	}
	// string match
	return arr.indexOf(tag) > -1;
}

export function containsEqualValues(a, b, isCaseSensitive=false) {
    return (!isCaseSensitive) ? a.length === b.length && a.every( (i,j) => i.toLowerCase() === b[j].toLowerCase() ) : a.length === b.length && a.every( (i,j) => i === b[j] );
}

// filter array of objects using array of keys
export function filterValues(arrayOfObjects, arrayOfKeys, key="RowKey", caseSensitive=true) {
    if (caseSensitive) {
         return arrayOfObjects.filter(o => arrayOfKeys.indexOf(o[key]) > -1);
    }
    const keys = arrayOfKeys.map(x => x.toLowerCase());
    return arrayOfObjects.filter(o => keys.indexOf(o[key].toLowerCase()) > -1);
}

export function getValues(arrayOfObjects, key) {
    return arrayOfObjects.reduce((prev,curr) => {
	    prev.push(curr[key]);
	    return prev;
    }, []);
}

// Material UI helper: Returns label from selected checkbox
export function getCheckedLabel(e) {
    let label = e.target.getAttribute('data-reactid');
    let matches = label.match(/\$([a-zA-Z0-9\s\-_]+)/);
    return matches
}

// String formating helper: Returns string as Uppercase Words.
export function UCWords(str) {
    return str.split(' ').map(w => w[0].toUpperCase() + w.substring(1) ).join(' ');
}

// Opens link in new windows
export function open(url) {
    if (url.substring(0, 4) !== "http") {
        window.open("http://" + url);
    } else {
        window.open(url);
    }
}