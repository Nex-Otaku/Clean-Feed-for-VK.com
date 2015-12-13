// Сохраняем настройки в локальное хранилище "chrome.storage".
function save_options() {
    var email = $('input#email').val();
    var pass1 = $('input#pass1').val();
    var pass2 = $('input#pass2').val();
    var pass3 = $('input#pass3').val();
    chrome.storage.sync.set({
        email: email,
        pass1: pass1,
        pass2: pass2,
        pass3: pass3
    }, function() {
        // Обновляем статус. Уведомляем пользователя, что настройки были сохранены.
        renderStatus('Настройки сохранены.');
        /*
        var status = document.getElementById('status');
        status.textContent = 'Настройки сохранены.';
        */
    });
}

// Загружаем настройки из локального хранилища "chrome.storage".
function restore_options() {
        chrome.storage.sync.get({
        email: '',
        pass1: '',
        pass2: '',
        pass3: ''
    }, function(items) {
        $('input#email').val(items.email);
        $('input#pass1').val(items.pass1);
        $('input#pass2').val(items.pass2);
        $('input#pass3').val(items.pass3);
    });
}

$(function() {
    restore_options();
    $('#save').click(function() {
        save_options();
    });
});
