browser.runtime.onMessage.addListener((message, sender) =>
{
    browser.tabs.remove(sender.tab.id);
});