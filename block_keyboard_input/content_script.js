function onKeyboardEvent(event) {
    event.preventDefault();
    event.stopPropagation();
}

function blockKeyboard() {
    window.addEventListener("keydown", onKeyboardEvent);
    window.addEventListener("keyup", onKeyboardEvent);
    window.addEventListener("keypress", onKeyboardEvent);
}

function unblockKeyboard() {
    window.removeEventListener("keydown", onKeyboardEvent);
    window.removeEventListener("keyup", onKeyboardEvent);
    window.removeEventListener("keypress", onKeyboardEvent);
}

function onMessage(message) {
    if (message == true) {
        blockKeyboard();
    } else {
        unblockKeyboard();
    }
}

window.addEventListener("load", function() {
    let myPort = browser.runtime.connect();
    myPort.onMessage.addListener(onMessage);
});