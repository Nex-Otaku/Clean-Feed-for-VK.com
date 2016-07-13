/*global chrome, MutationObserver, scroll, NodeList */
/*jslint browser: true, devel: true */

(function () {
    "use strict";

    var qAndALinks = [
            "ask.fm",
            "askbook.me",
            "askfm.im",
            "askfm.su",
            "askmes.ru",
            "askzone.su",
            "my-truth.ru",
            "nekto.me",
            "otvechayu.ru",
            "qroom.ru",
            "sprashivai.by",
            "sprashivai.ru",
            "sprashivaii.ru",
            "sprashivalka.com",
            "spring.me",
            "sprosimenya.com",
            "sprosi.name",
            "vopros.me",
            "voprosmne.ru"
        ],
        selectorsToFind = {

            links: qAndALinks
                .map(function (qAndALink) {
                    return ".wall_text [href*='" + qAndALink + "']";
                })
                .join(),

            apps: ".wall_post_source_default",
            instagram: ".wall_post_source_instagram",
            group_share: ".group_share",
            mem_link: ".mem_link[mention_id^='club']",
            event_share: ".event_share",
            external_links:
                    ".wall_text [href^='/away.php?to=']" +
                    ":not(.wall_post_source_icon)",
            wall_post_more: ".wall_post_more",
            likes: ".post_like_icon.no_likes",
            comments: ".reply_link",
            ads_news: ".ads_ads_news_wrap",
            promoted_post: ".wall_text_name_explain_promoted_post"
        },
        keywordsToFind = {
            please_share : 1,
            freebie : 1,
            ask : 1,
            pets : 1,
            anon : 1,
            other : 1
        },
        contentFilters = {
            without_pic: function (index, row) { 
                var $row = $(row);
                var questionUserIgnore = $row.has(".feed_ignore_label").length > 0;
                var hasPicture = $row.has(".page_post_sized_thumbs").length > 0;
                return !questionUserIgnore && !hasPicture;
            },
            without_text: function (index, row) { 
                var $row = $(row);
                var questionUserIgnore = $row.has(".feed_ignore_label").length > 0;
                var hasText = ($row.has(".wall_post_text").length > 0) && ($.trim($row.find(".wall_post_text").first().text()).length > 0);
                return !questionUserIgnore && !hasText; 
            },
            short_text : function (index, row) { 
                var $row = $(row);
                return ($row.has(".wall_post_text").length > 0) && ($.trim($row.find(".wall_post_text").first().text()).length < 80); 
            },
        },
        feed = document.querySelector("#feed_rows"),
        url = location.href,
        observer,
        settings;

    function processFeedItem(elem, setting, newClassName) {
        if (elem === feed) {
            return;
        }

        if (!elem.classList.contains("feed_row")) {
            return processFeedItem(elem.parentNode, setting, newClassName);
        }

        if (setting) {
            return elem.classList.add(newClassName);
        }

        elem.classList.remove(newClassName);
    }

    function findSelector(settingName) {
        var selector = selectorsToFind[settingName],
            els = feed.querySelectorAll(selector),
            newClassName = "cffvk-" + settingName;

        els.forEach(function (el) {
            processFeedItem(el, settings[settingName], newClassName);
        });
    }
    
    function findKeywords(settingName) {
        var keywordsInputName = settingName + "_keywords";
        // Если ключевые слова не заданы, игнорируем настройку.
        if (!(keywordsInputName in settings)) {
            return;
        }
        var keywords = settings[keywordsInputName];
        var isEnabled = settings[settingName];
        // Выбираем текстовые блоки постов.
        // Позже, функция "processFeedItem" сама "пройдётся вверх"
        // и определит корневой блок поста ".feed_row",
        // к которому относится текст ".wall_post_text".
        var $feedRowsText = $(feed).find(".feed_row .wall_post_text");
        var els = (keywords.match(/[^\s]+/g) === null) 
                ? $feedRowsText.search(keywords)
                : $feedRowsText.orSearch(keywords);
        var newClassName = "cffvk-" + settingName;
        
        $.each(els, function (index, el) {
            processFeedItem(el, isEnabled, newClassName);
        });
    }
    
    function findContentFilter(settingName) {
        var contentFilter = contentFilters[settingName];
        var isEnabled = settings[settingName];
        var $feedRows = $(feed).find(".feed_row");
        var els = $feedRows.filter(contentFilter);
        var newClassName = "cffvk-" + settingName;
        
        $.each(els, function (index, el) {
            processFeedItem(el, isEnabled, newClassName);
        });
    }

    function clean(receivedSettings) {
        if (receivedSettings) {
            settings = receivedSettings;
        }
        Object.keys(selectorsToFind).forEach(findSelector);
        Object.keys(keywordsToFind).forEach(findKeywords);
        Object.keys(contentFilters).forEach(findContentFilter);
        console.log("CFFVK: your feed has been cleaned");
    }

    function removeInlineStyles() {
        var posts = feed.querySelectorAll(".feed_row");

        posts.forEach(function (post) {
            post.removeAttribute("style");
        });

        scroll(0, 0);
    }

    function checkUrl() {
        if (url !== location.href) {
            url = location.href;
            chrome.runtime.sendMessage({
                action: "activate"
            });
        }
    }

    NodeList.prototype.forEach = NodeList.prototype.forEach ||
            Array.prototype.forEach;

    observer = new MutationObserver(function (mutations) {
        if (mutations[0].addedNodes.length > 0) {
            clean();
            console.log("             by the MutationObserver");
        }
    });

    chrome.runtime.onMessage.addListener(function (message) {
        if (message.action === "clean") {
            feed = document.querySelector("#feed_rows");
            observer.disconnect();
            observer.observe(feed, {
                childList: true,
                subtree: true
            });
            document.querySelector("#feed_new_posts")
                .addEventListener("click", removeInlineStyles);

            return clean(message.settings);
        }

        if (message.action === "disable") {
            observer.disconnect();
            console.log("CFFVK: cleaning disabled");
        }
    });

    chrome.runtime.sendMessage({
        action: "activate"
    });
    setInterval(checkUrl, 100);
}());
