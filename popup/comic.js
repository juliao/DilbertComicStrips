// onLoad run:
setTimeout(runExtension, 0);

var browser = browser || chrome;  // Workaround for browser.* API in Chrome
const backgroundPage = browser.extension.getBackgroundPage();
const comicUpdateTimezone = "America/Chicago";
const todayDate = new Date().toLocaleDateString('fr-CA', {timeZone: comicUpdateTimezone});
const minDate = "1989-04-16";  // First comic available at comicWebsite
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


/** Sets the user interface and load today's comic from comicWebsite */
function runExtension() {
  browser.browserAction.setBadgeText({text: ""});
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

    // Don't try to load a comic if the nextDate is off the range
    if (currentDate >= maxDate) {
      return;
    }

    // Calc the next day from the currentDate
    let nextDate = getDateAfterNDays(currentDate, +1);
    popupDateFormPicker.value = nextDate;

    // Restores the button style if it was previously disabled
    if (popupPreviousButton.style.color === "lightgray") {
      popupPreviousButton.removeAttribute("style");
    }

    // Disables the Next button if the max limit date is hit
    if (nextDate === maxDate) {
      popupNextButton.style.color = "lightgray";
      popupNextButton.style.cursor = "default";
    }

    popupMsgBanner.style.display = "block";
    loadComic(nextDate);
  });

  popupPreviousButton.addEventListener("click", function () {
    let currentDate = popupDateFormPicker.value; // Format: AAAA-MM-DD

    // Don't try to load a comic if the previousDate is the range
    if (currentDate <= minDate) {
      return;
    }

    // Calc the previous day from the currentDate
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

    if (currentDate === "" || currentDate < minDate || currentDate > maxDate) {
      popupDateFormPicker.value = maxDate;
      currentDate = maxDate;
    }

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

/** Load the comic image */
function loadComic(date) {
  selectedDate = date;
  cacheNameBase = "dilbert-" + selectedDate;
  let isCached = localStorage.getItem(cacheNameBase + ".desc");

  if (isCached != null) {
    todayComicIsCached = true;
    showComicImage();
  } else {
    backgroundPage.getComicImageData(selectedDate).then((comicImageData) => {
      showComicImage(comicImageData);
    }).catch(() => {
      errorFetching("Error while fetching the comic image, please check your internet connection.");
    });
  }
}

/** Shows the comic image in the popup window */
function showComicImage(imgTag = null) {
  // Only the comic of the day will come from cache
  if ((selectedDate === maxDate) && todayComicIsCached) {
    popupComicImage.src = localStorage.getItem(cacheNameBase + ".data");
  } else {
    popupComicImage.src = imgTag.src;
  }

  // Remove the "loading message" after the image is loaded and update the Comic Title.
  // Restrict the event to run only "once", to prevent the cumulative repeat.
  popupComicImage.addEventListener("load", function () {
    popupMsgBanner.removeAttribute("style");
    popupMsgBanner.textContent = "Loading comic image...";
    popupMsgBanner.style.display = "none";

    if ((selectedDate === maxDate) && todayComicIsCached) {
      popupComicTitle.textContent = selectedDate + " - " + localStorage.getItem(cacheNameBase + ".desc");
      popupComicLink.href = localStorage.getItem(cacheNameBase + ".url");
    } else {
      popupComicTitle.textContent = selectedDate + " - " + imgTag.alt;
      popupComicLink.href = imgTag.comicUrl;
    }
  }, {once: true});
}

/** Returns the date increased/decreased by nDays in the format AAAA-MM-DD */
function getDateAfterNDays(todayDate, nDays) {
  // Get the time part of the date in the 'en-GB' format ("HH:MM:SS"), adjusted to comicUpdateTimezone to form the new date
  let currentTime = new Date().toLocaleString('en-GB', {timeZone: comicUpdateTimezone}).slice(12);
  let newDate = new Date(todayDate + 'T' + currentTime);
  newDate.setDate(newDate.getDate() + nDays);

  return newDate.toLocaleDateString('fr-CA');
}

/** Shows a message on fetch error */
function errorFetching(message) {
  popupMsgBanner.style.backgroundColor = "red";
  popupMsgBanner.style.width = "600px";
  popupMsgBanner.textContent = message;
}
