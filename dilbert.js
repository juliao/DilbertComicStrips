/**
 * Created by Juliao on 21/02/2017.
 */

onload = setTimeout(setup, 0);

// We need date in format yyyy-MM-dd, 'fr-CA' locale provide that.
// And we need time in format hh:mm:ss, 'en-GB' locale provide that.

// Dilbert.com seems to update website at the "America/Chicago" timezone,
// so the math with dates take this in consideration.

function setup() {
  base_url = "http://dilbert.com/strip/";
  var timezone = "America/Chicago";

  today_comic_cached = false;
  var next = document.querySelector("#next");
  var previous = document.querySelector("#previous");
  var comic_date_form = document.querySelector("#comic-date-form");
  var loading = document.querySelector("#loading");

  next.addEventListener("click", function (e) {
    var current_date = comic_date_form.value;
    previous.removeAttribute("style");

    if (current_date === max_date) {
      next.style.color = "lightgray";
      next.style.cursor = "default";

      return;
    }

    // increment 1 day of current_date
    var c_time = new Date().toLocaleString('en-GB', {timeZone: timezone}).slice(10);
    var c_date = new Date(current_date + c_time);
    c_date.setDate(c_date.getDate() + 1);
    comic_date = c_date.toLocaleString('fr-CA');

    comic_date_form.value = comic_date;
    loading.style.display = "block";
    init();
  });

  previous.addEventListener("click", function (e) {
    var current_date = comic_date_form.value;
    next.removeAttribute("style");

    if (current_date === min_date) {
      previous.style.color = "lightgray";
      previous.style.cursor = "default";

      return;
    }

    // decrement 1 day of current_date
    var c_time = new Date().toLocaleString('en-GB', {timeZone: timezone}).slice(10);
    var c_date = new Date(current_date + c_time);
    c_date.setDate(c_date.getDate() - 1);
    comic_date = c_date.toLocaleString('fr-CA');

    comic_date_form.value = comic_date;
    loading.style.display = "block";
    init();
  });

  comic_date_form.addEventListener("change", function (e) {
    next.removeAttribute("style");
    previous.removeAttribute("style");
    
    comic_date = e.target.value;
    loading.style.display = "block";
    init();
  });

  var today = new Date().toLocaleString('fr-CA', {timeZone: timezone}).slice(0, -9);
  min_date = "1989-04-16";  // First available at dilbert.com
  max_date = today;
  comic_date_form.setAttribute("min", min_date);
  comic_date_form.setAttribute("max", max_date);
  comic_date_form.value = today;
  comic_date = today;

  init();
}

function init() {
  // Cache just the comic from the day
  cache_name_base = "dilbert-" + comic_date;
  comic_url = base_url + comic_date;

  var comic_cached = localStorage.getItem(cache_name_base + ".data");

  if (!comic_cached)
    getPage();
  else {
    today_comic_cached = true;
    showImage();
  }
}

function getPage() {
  var xhr = new XMLHttpRequest();
  xhr.open('GET', comic_url);
  xhr.onload = function () {
    var div = document.createElement("div");
    div.innerHTML = xhr.responseText;
    var img = div.querySelector(".img-comic");
    var link = div.querySelector(".img-comic-link");

    if (link != comic_url)
      return;

    // Cache only the comic of the day
    if (comic_date === max_date)
      cacheImageData(img);
    else
      showImage(img);
  };
  xhr.onerror = connectionError;
  xhr.send();
}

function showImage(img_tag) {
  var link = document.querySelector("#comic-link");
  var image = document.querySelector("#comic-image");
  var title = document.querySelector("#comic-title");
  var nav = document.querySelector("#comic-nav");
  var loading = document.querySelector("#loading");
  link.href = comic_url;
  link.target = "_blank";
  image.width = 760;
  nav.style.display = "flex";

  // Only the comic of the day will come from cache
  if (comic_date === max_date) {
    image.src = localStorage.getItem(cache_name_base + ".data");
    title.innerHTML = comic_date + " - " + localStorage.getItem(cache_name_base + ".desc");
  } else {
    image.src = img_tag.src;
    title.innerHTML = comic_date + " - " + img_tag.alt;
  }

  image.addEventListener("load", function () {
    loading.removeAttribute("style");
    loading.innerHTML = "Loading...";
    loading.style.display = "none";
  });
}

function cacheImageData(img_tag) {
  // We will cache only one comic, so this is the easy way to clear the old one
  localStorage.clear();

  localStorage.setItem(cache_name_base + ".desc", img_tag.alt);

  toDataUrl(img_tag.src, function (img_data) {
    localStorage.setItem(cache_name_base + ".data", img_data);
    showImage();
  });

  today_comic_cached = true;
}

function toDataUrl(url, callback) {
  var xhr = new XMLHttpRequest();
  xhr.onload = function () {
    var reader = new FileReader();
    reader.onloadend = function () {
      callback(reader.result);
    }
    reader.readAsDataURL(xhr.response);
  };
  xhr.open('GET', url);
  xhr.responseType = 'blob';
  xhr.send();
}

function connectionError() {
  var message = "Error while loading, your internet connection does not seem to be working.";

  if (today_comic_cached) {
    var loading = document.querySelector("#loading");

    loading.style.backgroundColor = "red";
    loading.style.width = "550px";
    loading.innerHTML = message;
  } else {
    var title = document.querySelector("#comic-title");

    title.style.width = "550px";
    title.innerHTML = message;
  }
}
