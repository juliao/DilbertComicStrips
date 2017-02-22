/**
 * Created by Juliao on 21/02/2017.
 */

onload = setTimeout(setup, 0);

function setup() {
  base_url = "http://dilbert.com/strip/";
  var timezone = "America/Chicago";

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
    var c_time = new Date().toLocaleString('fr-CA').slice(10);
    var c_date = new Date(current_date + c_time);
    c_date.setDate(c_date.getDate() + 1);
    comic_date = c_date.toLocaleString('fr-CA', {timeZone: timezone}).slice(0, -9);

    comic_date_form.value = comic_date;
    loading.style.display = "block";
    getPage();
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
    var c_time = new Date().toLocaleString('fr-CA').slice(10);
    var c_date = new Date(current_date + c_time);
    c_date.setDate(c_date.getDate() - 1);
    comic_date = c_date.toLocaleString('fr-CA', {timeZone: timezone}).slice(0, -9);

    comic_date_form.value = comic_date;
    loading.style.display = "block";
    getPage();
  });

  comic_date_form.addEventListener("change", function (e) {
    comic_date = e.target.value;
    loading.style.display = "block";
    getPage();
  });

  // fr-CA format is yyyy-MM-dd
  var today = new Date().toLocaleString('fr-CA', {timeZone: timezone}).slice(0, -9);
  min_date = "1989-04-16";  // First available at dilbert.com
  max_date = today;
  comic_date_form.setAttribute("min", min_date);
  comic_date_form.setAttribute("max", max_date);
  comic_date_form.value = today;
  comic_date = today;

  getPage();
}

function getPage() {
  comic_url = base_url + comic_date;

  var xhr = new XMLHttpRequest();
  xhr.open('GET', comic_url);
  xhr.onload = function () {
    var div = document.createElement("div");
    div.innerHTML = xhr.responseText;
    var img = div.querySelector(".img-comic");
    var link = div.querySelector(".img-comic-link");

    if (link != comic_url)
      return;

    showImage(img);
  };
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
  image.src = img_tag.src;
  title.innerHTML = comic_date + " - " + img_tag.alt;
  nav.style.display = "flex";

  image.addEventListener("load", function () {
    loading.style.display = "none";
  });
}
