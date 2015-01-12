/*global chrome */
/*jslint browser: true, devel: true, indent: 2 */

(function () {
  "use strict";

  var settings = {},
    css = {
      groups: "[id^='feed_repost-'], [id^='feed_reposts_'] { display: none; }",
      myGroups: "[id^='post-'].post_copy { display: none; }",
      groupsAndPeople: "[id^='feed_repost'] { display: none; }",
      filters: [
        ".cffvk-links",
        ".cffvk-wall_post_source_default",
        ".cffvk-group_share",
        ".cffvk-mem_link",
        ".cffvk-event_share",
        ".cffvk-wall_post_more",
        ".cffvk-post_like_icon-no_likes",
        ".cffvk-reply_link"
      ].join() + "{ display: none; }",

      show: function show(rule) {
        return rule.replace(/none/g, "block");
      }
    };

  // The main function
  function execute(tabId) {
    var cssCode = "";

    if (settings.groups === "checked") {

      if (settings.people === "checked") {
        cssCode += css.groupsAndPeople;
      } else {
        cssCode += css.show(css.groupsAndPeople) + css.groups;
      }

      if (settings.mygroups === "checked") {
        cssCode += css.myGroups;
      } else {
        cssCode += css.show(css.myGroups);
      }

    } else {
      cssCode += css.show(css.groupsAndPeople + css.myGroups);
    }

    chrome.tabs.insertCSS(tabId, {code: cssCode});
    chrome.tabs.executeScript(tabId, {
      code: "CFFVK.clean(" + JSON.stringify(settings) + ");"
    });
  }

  function setUpTheSettingsPage() {

    // Do things with the second and the third checkboxes:
    function hideOrShowCheckboxes2and3() {
      var labels2and3 = [
          document.settingsForm.children[2],
          document.settingsForm.children[3]
        ],
        newSettings = {};

      // If the first checkbox (`groups`) is unchecked
      // then uncheck the second and the third, hide them,
      // and reset their settings in storage:
      labels2and3.forEach(function (label) {
        var checkbox = label.children[0];

        if (settings.groups !== "checked") {
          label.style.display = "none";
          checkbox.checked = false;
          settings[checkbox.name] = newSettings[checkbox.name] = "";
        } else {
          label.style.display = "block";
        }
      });

      if (Object.keys(newSettings).length > 0) {
        chrome.storage.sync.set(settings);
      }
    }

    // Catch clicks on checkboxes and remember the values ("checked"),
    // reapply the main function:
    function handleClick(event) {
      var name = event.target.name,
        value = event.target.value;

      settings[name] = settings[name] === value ? "" : value;

      chrome.storage.sync.set(settings, function () {
        hideOrShowCheckboxes2and3();
        execute();
      });
    }

    if (document.settingsForm) {
      var checkboxes = [].slice.call(
          document.settingsForm.getElementsByTagName("input")
        );

      hideOrShowCheckboxes2and3();

      checkboxes.forEach(function (checkbox) {
        checkbox.addEventListener("click", handleClick);
        if (settings[checkbox.name] === "checked") {
          checkbox.checked = true;
        }
      });
    }
  }

  // Launch the main function only on certain pages of VK:
  function checkForValidUrl(tabId, changeInfo, tab) {
    if (changeInfo.status === "loading") {
      var url = tab.url;

      if (url.indexOf("vk.com/feed") > -1) {
        if (!/photos|articles|likes|notifications|comments|updates|replies/
            .test(url)) {
          if (!/\/feed\?[wz]=/.test(url)) {

            // We have to get the settings on every page load because
            // `handleClick` works in a different context (popup) and it
            // doesn't update our `settings` variable
            chrome.storage.sync.get(null, function (loadedSettings) {
              settings = loadedSettings;
              chrome.tabs.executeScript(
                tabId,
                {file: "content-script.js"},
                function () { execute(tabId); }
              );
            });

            chrome.pageAction.show(tabId);

            chrome.tabs.insertCSS(tabId, {code: css.filters});
          }
        } else {
          chrome.pageAction.hide(tabId);

          // Show all the divs that have been hidden, stop observing:
          chrome.tabs.insertCSS(tabId, {
            code: css.show(css.groupsAndPeople + css.myGroups + css.filters)
          });
          chrome.tabs.executeScript(tabId, {
            code:
              "if (window.CFFVK && CFFVK.observer) {" +
              "  CFFVK.observer.disconnect();" +
              "  console.log('CFFVK: cleaning disabled');" +
              "};"
          });
        }
      } else {
        chrome.pageAction.hide(tabId);
      }
    }
  }

  if (localStorage.length > 0) {

    // For older versions: convert localStorage to chrome.storage.sync
    Object.keys(localStorage).forEach(function (key) {
      settings[key] = localStorage[key];
    });

    setUpTheSettingsPage();

    chrome.storage.sync.set(settings, function () {
      localStorage.clear();
    });
  } else {

    // Load settings. If there are none, set them to defaults
    // (check only the first checkbox):
    chrome.storage.sync.get(null, function (loadedSettings) {
      if (Object.keys(loadedSettings).length === 0) {
        settings = {groups: "checked"};
        chrome.storage.sync.set(settings);
      } else {
        settings = loadedSettings;
      }
      setUpTheSettingsPage();
    });
  }

  chrome.tabs.onUpdated.addListener(checkForValidUrl);
}());
