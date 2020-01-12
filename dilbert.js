/**
 *
 * This script is part of "Dilbert Comic Strips" Chrome Web Browser Extension, available at:
 * https://chrome.google.com/webstore/detail/dilbert-comic-strips/gpjlhjgiccobkcodaeimjbcjckpcnbjp
 *
 * "Dilbert Comic Strips" fetches and displays the daily Dilbert's comic in the Chrome Web Browser.
 *
 *
 * Extension main flux:
 *
 *  --> setupUI() --> loadComic(todayDate)
 *                        |
 *                        |
 *                    isCached? --NO--> fetchComicPage() --> isTodaysComic? --YES--> cacheTodayComicImage(image)
 *                        |                                      |                           |
 *                        |YES                                   |NO                         |
 *                        |                                      |                           |
 *                 showComicImage() <----------------------------|<--------------------------|
 *                        |
 *                        |
 *                       END
 *
 *
 *
 * Some observations:
 *
 * => Dilbert.com seems to delivery the daily comic at midnight in the "America/Chicago" timezone,
 *    so the math with dates takes this in consideration.
 *
 * => Dilbert.com supports a mix of different date formats to fetch the comics, but here we choose
 *    to use the date in the format yyyy-MM-dd, the 'fr-CA' locale provides that. And we also need
 *    the time in the format hh:mm:ss for date's math, 'en-GB' locale provides that.
 *
 */


// onLoad run:
setTimeout(runExtension, 0);

const dilbertWebsite = "https://dilbert.com";
const dilbertTimezone = "America/Chicago";
const todayDate = new Date().toLocaleDateString('fr-CA', {timeZone: dilbertTimezone});
const minDate = "1989-04-16";  // First comic available at dilbert.com
const maxDate = todayDate;
let selectedDate = null;
let todayComicIsCached = false;
let cacheNameBase = null;
let comicUrl = null;
let popupMsgBanner = null;
let popupComicLink = null;
let popupComicImage = null;
let popupComicTitle = null;
let popupNavButtons = null;


/** Sets the user interface and load today's comic from Dilbert.com */
function runExtension() {
  setupUI();
  loadComic(todayDate);
}

/** Assign action events to buttons and set defaults */
function setupUI() {
  popupMsgBanner = document.querySelector("#message-banner");
  popupComicLink = document.querySelector("#comic-link");
  popupComicImage = document.querySelector("#comic-image");
  popupComicTitle = document.querySelector("#comic-title");
  popupNavButtons = document.querySelector("#comic-nav");

  const popupNextButton = document.querySelector("#next");
  const popupPreviousButton = document.querySelector("#previous");
  const popupDateFormPicker = document.querySelector("#comic-date-form");

  // Disables the Next button since the extension loads the comic of the current day
  popupNextButton.style.color = "lightgray";
  popupNextButton.style.cursor = "default";

  popupNextButton.addEventListener("click", function () {
    let currentDate = popupDateFormPicker.value;

    // Don't try to load a comic if the nextDate will be off the range
    if (currentDate >= maxDate) {
      return;
    }

    // Calc the next day of the currentDate
    let nextDate = getDateAfterNDays(currentDate, +1);
    popupDateFormPicker.value = nextDate;

    // Restores the button style if it was previously disabled
    if (popupPreviousButton.style.color === "lightgray") {
      popupPreviousButton.removeAttribute("style");
    }

    // Disables the Next button if the max limit date will be hit
    if (nextDate === maxDate) {
      popupNextButton.style.color = "lightgray";
      popupNextButton.style.cursor = "default";
    }

    popupMsgBanner.style.display = "block";
    loadComic(nextDate);
  });

  popupPreviousButton.addEventListener("click", function (e) {
    let currentDate = popupDateFormPicker.value; // Format: AAAA-MM-DD

    // Don't try to load a comic if the previousDate will be off the range
    if (currentDate <= minDate) {
      return;
    }

    // Calc the previous day of the currentDate
    let previousDate = getDateAfterNDays(currentDate, -1);
    popupDateFormPicker.value = previousDate;

    // Restores the button style if it was previously disabled
    if (popupNextButton.style.color === "lightgray") {
      popupNextButton.removeAttribute("style");
    }

    // Disables the Previous button if the min limit date is hit
    if (previousDate === minDate) {
      popupPreviousButton.style.color = "lightgray";
      popupPreviousButton.style.cursor = "default";
    }

    popupMsgBanner.style.display = "block";
    loadComic(previousDate);
  });

  popupDateFormPicker.addEventListener("change", function (e) {
    popupNextButton.removeAttribute("style");
    popupPreviousButton.removeAttribute("style");

    let currentDate = e.target.value;

    // Disables the Previous button or the Next button if some limit date is hit
    if (currentDate === maxDate) {
      popupNextButton.style.color = "lightgray";
      popupNextButton.style.cursor = "default";
    } else if (currentDate === minDate) {
      popupPreviousButton.style.color = "lightgray";
      popupPreviousButton.style.cursor = "default";
    }

    popupMsgBanner.style.display = "block";
    loadComic(currentDate);
  });

  popupDateFormPicker.setAttribute("min", minDate);
  popupDateFormPicker.setAttribute("max", maxDate);
  popupDateFormPicker.value = todayDate;
}

/** Load comic */
function loadComic(date) {
  selectedDate = date;
  cacheNameBase = "dilbert-" + selectedDate;
  comicUrl = dilbertWebsite + "/strip/" + selectedDate;
  let isCached = localStorage.getItem(cacheNameBase + ".desc");

  if (isCached) {
    todayComicIsCached = true;
    showComicImage();
  } else {
    fetchComicPage();
  }
}

/** Shows the comic image in the user interface */
function showComicImage(imgTag=null) {
  popupComicLink.href = comicUrl;
  popupComicLink.target = "_blank";
  popupComicImage.width = 760;
  popupNavButtons.style.display = "flex";

  // Only the comic of the day will come from cache
  if (selectedDate === maxDate) {
    popupComicImage.src = localStorage.getItem(cacheNameBase + ".data");
    popupComicTitle.innerHTML = selectedDate + " - " + localStorage.getItem(cacheNameBase + ".desc");
  } else {
    popupComicImage.src = imgTag.src;
    popupComicTitle.innerHTML = selectedDate + " - " + imgTag.alt;
  }

  // While the image is loading, show message.
  popupComicImage.addEventListener("load", function () {
    popupMsgBanner.removeAttribute("style");
    popupMsgBanner.innerHTML = "Loading comic image...";
    popupMsgBanner.style.display = "none";
  });
}

/** Loads the HTML page for the selected comic */
function fetchComicPage() {
  fetch(comicUrl).then(function (response) {
    response.text().then(function (text) {
      let div = document.createElement("div");
      div.innerHTML = text;
      let img = div.querySelector(".img-comic");
      let link = div.querySelector(".img-comic-link");

      if (link != comicUrl) {
        return;
      }

      // 2018-11-18 Fix for the incorrect URL address, since dilbert.com migrated to https,
      // now the img.src starts with "//", not "https://", so Chrome will replace src
      // addresses starting with "//" with "chrome-extension//", I don't know why.
      img.src = img.src.replace("chrome-extension", "https");

      // Cache just the today's comic
      if (selectedDate === maxDate) {
        cacheTodayComicImage(img);
      } else {
        showComicImage(img);
      }
    })
  }).catch(function (err) {
    errorFetching('Error while fetching the page: ' + comicUrl);
  });
}

/** Caches the today's comic */
function cacheTodayComicImage(imgTag) {
  // We will cache only one comic, so this is the easy way to clear the old one
  localStorage.clear();

  localStorage.setItem(cacheNameBase + ".desc", imgTag.alt);

  fetchAndCacheTodayComicImage(imgTag.src, function (imgData) {
    localStorage.setItem(cacheNameBase + ".data", imgData);
    showComicImage();
  });

  todayComicIsCached = true;
}

/** Fetches and cache the today's comic image */
function fetchAndCacheTodayComicImage(url, cacheImageCallback) {
  fetch(url).then(function (response) {
    return response.blob();
  }).then(function (imageBlob) {
    imageBlobToBase64(imageBlob, cacheImageCallback);
  }).catch(function (err) {
    errorFetching('Error while fetching the today\'s comic image from: ' + url);
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

/** Returns the date increased/decreased by nDays in the format AAAA-MM-DD */
function getDateAfterNDays(todayDate, nDays) {
  // Get the time part of the date in the 'en-GB' format (", HH:MM:SS"), adjusted to dilbertTimezone to form the new date
  let currentTime = new Date().toLocaleString('en-GB', {timeZone: dilbertTimezone}).slice(10);
  let newDate = new Date(todayDate + currentTime);
  newDate.setDate(newDate.getDate() + nDays);

  return newDate.toLocaleDateString('fr-CA');
}

/** Shows a message on fetch error */
function errorFetching(message) {
  console.debug(message);

  // If none image is cached, can't show the error in popupMsgBanner easily, need to use popupComicTitle.
  if (todayComicIsCached) {
    popupMsgBanner.style.backgroundColor = "red";
    popupMsgBanner.style.width = "550px";
    popupMsgBanner.innerHTML = message;
  } else {
    popupComicTitle.style.color = "red";
    popupComicTitle.style.width = "550px";
    popupComicTitle.innerHTML = message;
  }
}
