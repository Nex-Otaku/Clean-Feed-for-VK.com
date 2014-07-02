"use strict";
//The main function
function apply(tabId) {
  chrome.storage.sync.get(null, function (data) {
    var cssCode = "",
      scriptCode = "function nkchgApply() { 'use strict';";

    if (data.groups === "checked") {

      if (data.people === "checked")
          cssCode += "div[class^='feed_repost'] {display: none;}";
      else
          cssCode +=
            "div[class^='feed_repost'] {display: block;}" +
            "div[class^='feed_repost-'], div[class^='feed_reposts_'] {display: none;}";

      if (data.mygroups === "checked")
          cssCode += "div[id^=post-].post_copy {display: none;}";
      else
          cssCode += "div[id^=post-].post_copy {display: block;}";

    }
    else
        cssCode += "div[class^='feed_repost'], div[id^=post-].post_copy {display: block;}";

    scriptCode +=
      "var els = nkchgWall.getElementsByTagName('a');" +
      "for (var i = 0, l = els.length; i < l; i++) {" +
      "  var el = els[i];" +
      "  if (el.href.search(/sprashivai.ru|spring.me|nekto.me|ask.fm/) !== -1)" +
      "    nkchgClosestEl(el, '" + data.links + "', ' nkchgLinks');" +
      "}" +
      "nkchgFind('group_share', '" + data.group_share + "', 'nkchgGroup_share');" +
      "nkchgFind('event_share', '" + data.event_share + "', 'nkchgEvent_share');" +
      "nkchgFind('wall_post_source_default', '" + data.apps + "', 'nkchgApps');" +
      "nkchgFind('wall_post_more', '" + data.wall_post_more + "', 'nkchgWall_post_more');" +
      "nkchgFind('post_like_icon no_likes', '" + data.likes + "', 'nkchgLikes');" +
      "nkchgFind('reply_link', '" + data.comments + "', 'nkchgComments');" +
      "}";

    chrome.tabs.insertCSS(tabId, {code: cssCode});

    chrome.tabs.executeScript(tabId, {code:
      scriptCode +
      "nkchgApply();" +
      "console.log('Чистые новости для VK.com: your wall has been cleaned');"
    });
  });
}

//Do things with the second and the third checkbox:
function checkboxes() {
  var select = document.settingsForm,
    child;
  chrome.storage.sync.get(null, function (data) {
    //Show/hide the second and the third checkbox depending on the state of the first checkbox ("groups"):
    var dataObj = {};
    for (var i = 3; i < 5; i++) {
      child = select.children[i];
      //If the first checkbox ("groups") is unchecked then uncheck the second and the third and reset their settings in storage:
      if (data.groups !== "checked") {
        child.style.display = 'none';
        child = child.children[0];
        child.checked = false;
        dataObj[child.name] = "";
      } else {
        child.style.display = 'block';
      }
    }
    if (Object.keys(dataObj).length !== 0)
      chrome.storage.sync.set(dataObj, function () {});
  });
}

document.addEventListener('DOMContentLoaded', function () {
  //For older versions: convert localStorage to chrome.storage.sync
  var dataObj = {};
  for (var i = 0, l = localStorage.length; i < l; i++) {
    var name = localStorage.key(i);
    dataObj[name] = localStorage[name];
  }
  if (Object.keys(dataObj).length !== 0) {
    chrome.storage.sync.set(dataObj, function () {
      localStorage.clear();
    });
  }
  //If there is no saved settings then set them to defaults (check only the first checkbox):
  chrome.storage.sync.get(null, function (data) {
    if (Object.keys(data).length === 0) {
      chrome.storage.sync.set({"groups": "checked"}, function () {});
    }
  });
  var select = document.settingsForm;
  if (select) {
    checkboxes();
    select = select.getElementsByTagName("input");
    chrome.storage.sync.get(null, function (data) {
      for (var i = 0; i < select.length; i++) {
        var child = select[i];
        child.addEventListener('click', clickHandler);
        if (data[child.name] === "checked")
          child.checked = true;
      }
    });
  }
});

//Catch clicks on checkboxes and remember the values ("checked"), reapply the main function:
function clickHandler() {
  var name = this.name,
    value = this.value,
    dataObj = {};
  chrome.storage.sync.get(name, function (data) {
    dataObj[name] = data[name] === value ? "" : value;
    chrome.storage.sync.set(dataObj, function () {
      checkboxes();
      apply();
    });
  });
}

//Launch the main function only on certain pages of VK:
function checkForValidUrl(tabId, changeInfo, tab) {
  if (changeInfo.status === "loading") {
    var url = tab.url;
    if (url.indexOf('vk.com/feed') > -1) {
      if (url.search(/photos|articles|likes|notifications|comments|updates|replies/) === -1) {
        if (url.search(/\/feed\?[wz]=/) === -1) {
          chrome.pageAction.show(tabId);
          //<div>s with these classes will be hidden:
          chrome.tabs.insertCSS(tabId, {code:
            ".nkchgGroups, .nkchgPeople, .nkchgMygroups, .nkchgLinks, .nkchgGroup_share, .nkchgEvent_share, .nkchgApps, .nkchgWall_post_more, .nkchgLikes, .nkchgComments {display: none;}"
          });
          chrome.tabs.executeScript(tabId, {code:
            "var nkchgWall = document.getElementById('feed_rows');" +
            "if (!nkchgObserver)" +
            "  var nkchgObserver = new MutationObserver(function (mutations) {" +
            "    'use strict';" +
            "    if (mutations[0].addedNodes.length !== 0) {" +
            "      nkchgApply();" +
            "      console.log('Чистые новости для VK.com: your wall has been cleaned by the MutationObserver');" +
            "    }" +
            "  });" +
            "nkchgObserver.observe(nkchgWall, {childList: true});" +
            "function nkchgClosestEl(elem, action, nkchgClass) {" +
            "  'use strict';" +
            "  var parent = elem.parentNode;" +
            "  while (parent != nkchgWall) {" +
            "    if (parent.className.indexOf('feed_row') !== -1) {" +
            "      var re = new RegExp(nkchgClass, 'g');" +
            "      if (action === 'checked') {" +
            "        if (parent.className.indexOf(nkchgClass) === -1)" +
            "          parent.className += nkchgClass;" +
            "        return;" +
            "      } else {" +
            "        parent.className = parent.className.replace(re, '');" +
            "        return;" +
            "      }" +
            "    }" +
            "    else" +
            "      parent = parent.parentNode;" +
            "  }" +
            "}" +
            "function nkchgFind(className, action, newClassName) {" +
            "  'use strict';" +
            "  var els = nkchgWall.getElementsByClassName(className);" +
            "  for (var i = 0, l = els.length; i < l; i++) {" +
            "    var el = els[i];" +
            "    if (newClassName === 'nkchgApps' && el.href.indexOf('app3698024') !== -1)" +
            "      continue;" +
            "    nkchgClosestEl(el, action, ' ' + newClassName);" +
            "  }" +
            "}"
          });
          apply(tabId);
        }
      } else {
        //Show all the <div>s that have been hidden, stop observing:
        chrome.tabs.insertCSS(tabId, {code:
          "div[class^='feed_repost'], div[id^=post-].post_copy, .nkchgGroups, .nkchgPeople, .nkchgMygroups, .nkchgLinks, .nkchgGroup_share, .nkchgEvent_share, .nkchgApps, .nkchgWall_post_more, .nkchgLikes, .nkchgComments {display: block;}"
        });
        chrome.tabs.executeScript(tabId, {code:
          "if (nkchgObserver) nkchgObserver.disconnect();" +
          "console.log('Чистые новости для VK.com: cleaning disabled');"
        });
      }
    }
  }
}

chrome.tabs.onUpdated.addListener(checkForValidUrl);