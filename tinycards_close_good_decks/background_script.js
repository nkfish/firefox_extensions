var tabs_to_load = [];
var loading_tabs = [];
var num_weak_tabs = 0;
var debug_lines = []
var DEBUG = false;

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

browser.runtime.onMessage.addListener(async (message, sender) =>
{
    await onMessage(message, sender);
});

async function onMessage(message, sender)
{
    try
    {
        if (message === "TAB_GOOD")
        {
            add_debug_output_line("received message (" + sender.tab.id + "): " + "TAB_GOOD");

            let idx = loading_tabs.indexOf(sender.tab.id);
            if (idx !== -1)
            {
                add_debug_output_line("closing tab: " + sender.tab.id);

                try
                {
                    await browser.tabs.remove(sender.tab.id);
                }
                catch(error)
                {
                    add_debug_output_line("error, closing tab: " + error );
                }
                
                loading_tabs.splice(idx, 1);
                await load_tab();
            }
            else
            {
                add_debug_output_line("error, good: tab (" + sender.tab.id + ") not in loading_tabs...");
            }

        }
        else if (message === "TAB_WEAK")
        {
            add_debug_output_line("received message (" + sender.tab.id + "): " + "TAB_WEAK");

            let idx = loading_tabs.indexOf(sender.tab.id);
            if (idx !== -1)
            {
                num_weak_tabs++;
                loading_tabs.splice(idx, 1);
                await load_tab();
            }
            else
            {
                add_debug_output_line("error, weak: tab (" + sender.tab.id + ") not in loading_tabs...");
            }
        }
        else if (message == "TAB_LOADED")
        {
            add_debug_output_line("received message (" + sender.tab.id + "): " + "TAB_LOADED");

        }
    }
    catch(error)
    {
        add_debug_output_line("onMessage error: " + error);
    }
}

async function load_tab()
{
    try
    {
        add_debug_output_line("In load_tab...");

        if (num_weak_tabs >= 10)
        {
            tabs_to_load = [];
        }

        if (tabs_to_load.length == 0)
        {
            add_debug_output_line("load_tab: no tabs to load");
            return;
        }

        if ((num_weak_tabs + loading_tabs.length) >= 10)
        {
            add_debug_output_line("load_tab: reached max weak tabs");
            return;
        }

        let url_to_load = tabs_to_load.shift();

        let tab = await browser.tabs.create({
            active: false,
            url: url_to_load,
        });

        loading_tabs.push(tab.id);

        add_debug_output_line("loading tab: " + tab.id + " " + url_to_load);
    }
    catch(error)
    {
        add_debug_output_line("load_tab error: " + error);
    }
}

async function add_tabs_to_load(urls)
{
    add_debug_output_line("In add_tabs_to_load...");
    tabs_to_load = [...urls];
    loading_tabs = [];
    num_weak_tabs = 0;

    for (let i = 0; i < Math.min(5, tabs_to_load.length); i++)
    {
        await load_tab();
    }
}