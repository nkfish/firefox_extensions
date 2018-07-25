var start = Date.now();

var timeout = null;

var checkForWeakSets = function()
{
    doPreCheckWork();

    if (timeout !== null)
    {
        console.log(Date.now() - start + "ms - " + "extension: reset timeout");
        clearTimeout(timeout);
        timeout = null;
    }

    if (checkWeak())
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
        if (!checkWeak())
        {
            browser.runtime.sendMessage("TAB_GOOD");
            observer.disconnect();
            console.log(Date.now() - start + " ms - " + "extension: closing tab...");
            return;
        }
    }
    
    checkForWeakSets();
}

var doPreCheckWork = function()
{
    let hostname = window.location.hostname;
    if (hostname == "tinycards.duolingo.com")
    {
        // click lesson tab/button...
        [...document.querySelectorAll("div > div > div > div > div > div > div > div")]
            .filter((item) => item.innerHTML==="Lessons")[0]
            .click();
    }
    else if (hostname == "www.memrise.com")
    {
        return;
    }
    else
    {
        return;
    }
}

var checkWeak = function()
{
    let hostname = window.location.hostname;
    if (hostname == "tinycards.duolingo.com")
    {
        return checkWeakTinycards();
    }
    else if (hostname == "www.memrise.com")
    {
        return checkWeakMemrise();
    }
    else
    {
        console.log(Date.now() - start + " ms - " + "extension, checkWeak: unknown website...");
        return true;
    }
}

var checkWeakTinycards = function()
{
    console.log(Date.now() - start + " ms - " + "extension: in checkWeakTinycards");
    let weakSets = document.querySelectorAll("div > div > div > div > div > div > div > div > div > div > div > span:not(.SVGInline)");
    return weakSets.length > 0;
}

var checkWeakMemrise = function()
{
    console.log(Date.now() - start + " ms - " + "extension: in checkWeakMemrise");

    let reviewSpan = [...document.querySelectorAll("div > div > div > div > a > span")]
                        .filter((item) => item.textContent.trim().startsWith("Review"))[0]
                        .textContent.trim();

    if (reviewSpan.length > 6)
    {
        console.log(Date.now() - start + " ms - " + "extension, checkWeakMemrise: have review words");
        return true;
    }

    let match = document.getElementsByClassName("progress-box-title")[0]
                        .innerHTML
                        .match(/(\d+) \/ (\d+) words learned \((\d+) in long term memory\)/)

    let learned = Number(match[1])
    let total = Number(match[2])
    let longTerm = Number(match[3])

    if (learned < total)
    {
        console.log(Date.now() - start + " ms - " + "extension, checkWeakMemrise: have new words");
        return true;
    }
    else if (longTerm < total)
    {
        console.log(Date.now() - start + " ms - " + "extension, checkWeakMemrise: have words not in long term memory");
        return true;
    }

    return false;
}

var mutationObserverCallback = function(mutationsList)
{
    console.log(Date.now() - start + " ms - " + "extension, callback: " + document.readyState);
    checkForWeakSets();
}

var observer = new MutationObserver(mutationObserverCallback);

var targetNode = document.body; //document.getElementById("root");
var config = {childList: true, subtree: true};
observer.observe(targetNode, config);

checkForWeakSets();

window.addEventListener("load", function()
{
    console.log(Date.now() - start + " ms - " + "extension, window load: " + document.readyState);
    checkForWeakSets();
});

doPreCheckWork();

console.log(Date.now() - start + " ms - " + "extension, end: " + document.readyState);
