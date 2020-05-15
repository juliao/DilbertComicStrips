/**
 *
 * This script is part of "Dilbert Comic Strips" Web Browser Extension, available at:
 * Chrome: https://chrome.google.com/webstore/detail/dilbert-comic-strips/gpjlhjgiccobkcodaeimjbcjckpcnbjp
 * Firefox: https://addons.mozilla.org/en-US/firefox/addon/dilbert-comic-strips/
 *
 * "Dilbert Comic Strips" fetches and displays the daily Dilbert's comic in the Chrome and Firefox Web Browsers.
 *
 * Some observations:
 *
 * => For a better user experience the background.js script will periodically checks and cache the
 *    today's comic and notify the user about it, showing the number "1" inside a blue box over the
 *    extension's toolbar icon.
 *
 * => Dilbert.com seems to delivery the daily comic at midnight in the "America/Chicago" timezone,
 *    so the math with dates takes this in consideration.
 *
 * => Dilbert.com supports a mix of different date formats to fetch the comics, but here we choose
 *    to use the date in the format yyyy-MM-dd, the 'fr-CA' locale provides that. And we also need
 *    the time in the format hh:mm:ss for date's math, 'en-GB' locale provides that.
 *
 *
 */

// onLoad run:
setTimeout(updateCachedComic, 0);

var browser = browser || chrome;  // Workaround for browser.* API in Chrome
const dilbertWebsite = "https://dilbert.com";
const dilbertTimezone = "America/Chicago";
let todayDate = null;
let cacheNameBase = null;

// Set up an alarm to update the cached comic
browser.alarms.onAlarm.addListener(updateCachedComic);
browser.alarms.create('updateCachedComic', {periodInMinutes: 15});


/** Update the cache of the today's comic and notify the user thru the extension's toolbar icon */
function updateCachedComic() {
  todayDate = new Date().toLocaleDateString('fr-CA', {timeZone: dilbertTimezone});
  cacheNameBase = "dilbert-" + todayDate;
  let isCached = localStorage.getItem(cacheNameBase + ".desc");

  if (isCached == null) {
    getComicImageData(todayDate).then((comicImageData) => {
      cacheTodayComicImage(comicImageData)
    }).then(() => {
      browser.browserAction.setBadgeBackgroundColor({color: '#0000FF'});
      browser.browserAction.setBadgeText({text: '1'});
    }).catch((err) => {
      console.debug("Error while fetching and caching Dilbert today's comic: " + err);
    });
  }
}

/** Returns the image tag containing the image src, the image alt and the comic url */
async function getComicImageData(date) {
  let comicUrl = dilbertWebsite + "/strip/" + date;
  let responseText = await fetchComicPage(comicUrl);

  let imgTag = responseText.querySelector(".img-comic");
  let imgLink = responseText.querySelector(".img-comic-link");

  if (imgLink != comicUrl) {
    return;
  }

  // 2018-11-18 Fix for the incorrect URL address, since dilbert.com migrated to https,
  // now the img.src starts with "//", not "https://", so Chrome will replace src addresses
  // starting with "//" with "chrome-extension//", and Firefox will use "moz-extension//".
  imgTag.src = imgTag.src.replace(/^.*\/\//, "https://");
  imgTag.comicUrl = comicUrl;

  return imgTag;
}

/** Returns the HTML text for the selected comic URL */
async function fetchComicPage(comicUrl) {
  var responseText;

  try {
    const response = await fetch(comicUrl);
    responseText = document.createElement("div");
    responseText.innerHTML = await response.text();
  } catch (err) {
    console.debug("Error while fetching the page: " + comicUrl + " (" + err + ")");
  }

  return responseText;
}

/** Caches the today's comic */
function cacheTodayComicImage(imgTag) {
  // We will cache only one comic, so this is the easy way to clear the old one
  localStorage.clear();

  fetchAndCacheTodayComicImage(imgTag.src, function (imgData) {
    localStorage.setItem(cacheNameBase + ".data", imgData);
    localStorage.setItem(cacheNameBase + ".desc", imgTag.alt);
    localStorage.setItem(cacheNameBase + ".url", imgTag.comicUrl);
  });
}

/** Fetches and cache the today's comic image */
function fetchAndCacheTodayComicImage(imageSrc, cacheImageCallback) {
  fetch(imageSrc).then(function (response) {
    return response.blob();
  }).then(function (imageBlob) {
    imageBlobToBase64(imageBlob, cacheImageCallback);
  }).catch(function (err) {
    console.debug("Error while fetching the today's comic image from: " + imageSrc + " (" + err + ")");
  });
}

/** Convert a image blob to base64 */
function imageBlobToBase64(imageBlob, cacheImageCallback) {
  let reader = new FileReader();
  reader.onloadend = function () {
    cacheImageCallback(reader.result);
  };
  reader.readAsDataURL(imageBlob);
}
