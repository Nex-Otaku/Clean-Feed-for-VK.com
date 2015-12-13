// Сохраняем настройки в локальное хранилище "chrome.storage".
function save_options(options_list) {
    var optionsValues = {};
    for (var i = 0; i < options_list.length; i++) {
        var optionName = options_list[i];
        var inputId = 'input#' + optionName;
        optionsValues[optionName] = $(inputId).val();
    }
    chrome.storage.sync.set(
        optionsValues, 
        function() {
            // Обновляем статус. Уведомляем пользователя, что настройки были сохранены.
            renderStatus('Настройки сохранены.');
        }
    );
}

// Загружаем настройки из локального хранилища "chrome.storage".
function restore_options(options_list) {
    var optionsDefaults = {};
    for (var i = 0; i < options_list.length; i++) {
        var optionName = options_list[i];
        var inputId = 'input#' + optionName;
        optionsDefaults[optionName] = $(inputId).attr("placeholder");
    }
    chrome.storage.sync.get(
        optionsDefaults, 
        function(items) {
            for (var i = 0; i < options_list.length; i++) {
                var optionName = options_list[i];
                var inputId = 'input#' + optionName;
                $(inputId).val(items[optionName]);
            }
        }
    );
}

$(function() {
    var options_list = [
        "please_share_keywords",
        "freebie_keywords",
        "ask_keywords",
        "pets_keywords",
        "anon_keywords",
        "other_keywords"
    ];

    restore_options(options_list);
    $('#save').click(function() {
        save_options(options_list);
    });
});
