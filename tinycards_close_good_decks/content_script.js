var start = Date.now();

var targetNode = document.getElementById("root");
var config = {childList: true, subtree: true};

var timeout = null;

var checkForWeakSets = function()
{
    // if (document.readyState == "complete")
    // {
    //     browser.runtime.sendMessage("TAB_LOADED");
    // }

    // click lesson tab/button...
    [...document.querySelectorAll("div > div > div > div > div > div > div")]
                .filter((item) => item.innerHTML==="Lessons")[0]
                .click();

    if (timeout !== null)
    {
        console.log(Date.now() - start + "ms - " + "extension: reset timeout");
        clearTimeout(timeout);
        timeout = null;
    }

    let weakSets = document.querySelectorAll("div > div > div > div > div > div > div > div > div > span");
    
    if (weakSets.length > 0)
    {
        console.log(Date.now() - start + " ms - " + "extension: weak");

        browser.runtime.sendMessage("TAB_WEAK");

        observer.disconnect();
    }
    else
    {
        console.log(Date.now() - start + " ms - " + "extension: good");

        timeout = setTimeout(timeoutCallback, 1000*5);        
    }
}

var timeoutCallback = function()
{
    console.log(Date.now() - start + " ms - " + "extension, timeout: " + document.readyState)
    console.log(Date.now() - start + " ms - " + "extension: call closeTab...");
    
    if (document.readyState == "complete")
    {
        let weakSets = document.querySelectorAll("div > div > div > div > div > div > div > div > div > span");
        if (weakSets.length == 0)
        {
            browser.runtime.sendMessage("TAB_GOOD");
            observer.disconnect();
            console.log(Date.now() - start + " ms - " + "extension: closing tab...");
            return;
        }
    }
    
    checkForWeakSets();
}

var mutationObserverCallback = function(mutationsList)
{
    console.log(Date.now() - start + " ms - " + "extension, callback: " + document.readyState);
    checkForWeakSets();
}

var observer = new MutationObserver(mutationObserverCallback);

observer.observe(targetNode, config);
checkForWeakSets();

window.addEventListener("load", function()
{
    console.log(Date.now() - start + " ms - " + "extension, window load: " + document.readyState);
    checkForWeakSets();
});

// click lesson tab/button...
[...document.querySelectorAll("div > div > div > div > div > div > div")]
                .filter((item) => item.innerHTML==="Lessons")[0]
                .click();

console.log(Date.now() - start + " ms - " + "extension, end: " + document.readyState);
