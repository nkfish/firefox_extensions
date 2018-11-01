let tabs_to_load = [];
let loading_tabs = [];
let num_weak_tabs = 0;
let debug_lines = []
let DEBUG = false;

function add_debug_output_line(line)
{
    if (!DEBUG)
    {
        return;
    }
    
    debug_lines.push(line);
}

function get_debug_output_lines()
{
    return debug_lines;
}


let ports = [];

function connected(p) {
    ports[p.sender.tab.id] = p;
}

browser.runtime.onConnect.addListener(connected);


//TODO
function onTabRemoved(tabId) {
    ports[tabId] = undefined;
}
browser.tabs.onRemoved.addListener(onTabRemoved);


let keyboard_blocked = false;

function toggle_keyboard_blocked() {
    keyboard_blocked = !keyboard_blocked;

    ports.forEach(p => {
        p.postMessage(keyboard_blocked);
    })
}

function is_keyboard_blocked() {
    return keyboard_blocked;
}