const ROOT_FOLDER_TITLE = "tinycards_close_good_decks";
const DEBUG = false;

function debug_write(text)
{
    if (!DEBUG)
    {
        return;
    }

    let page = browser.extension.getBackgroundPage();
    page.add_debug_output_line(text);

    display_debug_write();
}

function display_debug_write()
{
    if (!DEBUG)
    {
        return;
    }

    let page = browser.extension.getBackgroundPage();
    let lines = page.get_debug_output_lines();

    let debug_div = document.getElementById("debug-output");
    
    while(debug_div.hasChildNodes())
    {
        debug_div.removeChild(debug_div.lastChild);
    }

    for (line of lines)
    {
        let nextLineDiv = document.createElement("div");
        let nextLineText = document.createTextNode(line);
        nextLineDiv.appendChild(nextLineText);
        debug_div.appendChild(nextLineDiv);
    }
}

btnText = ["Keyboard blocked...", "Keyboard unblocked..."];

window.addEventListener("load", function() {
    let btn = document.getElementById("toggleButton");
    let page = browser.extension.getBackgroundPage();
    btn.innerHTML = btnText[page.is_keyboard_blocked() ? 0 : 1];

    btn.addEventListener("click", function() {
        page.toggle_keyboard_blocked();
    })
});

display_debug_write();
