console.log("extension: loaded...");

var timeout = null;

function callback()
{
    console.log("extension: in callback...");

    if (timeout !== null)
    {
        console.log("extension: reset timeout");
        clearTimeout(timeout);
        timeout = null;
    }

    if (document.readyState !== "complete")
    {
        console.log("extension: readyState is " + document.readyState);
        timeout = setTimeout(callback, 2000);
        return;
    }
    else
    {
        observer.disconnect();
    }

    let strengthOne = document.querySelectorAll(".strength-1").length - 1;
    let strengthTwo = document.querySelectorAll(".strength-2").length - 1;
    let strengthThree = document.querySelectorAll(".strength-3").length - 1;
    let strengthFour = document.querySelectorAll(".strength-4").length - 1;


    let percentGood = 100 * (strengthFour + strengthThree )
                        / (strengthFour + strengthThree + strengthTwo + strengthOne);

    percentGood = percentGood.toFixed(3);

    let span = document.getElementById("duolingo_percentage_words_good_id");
    if (span !== null)
    {
        console.log("extension: span already present...");
        return;
    }

    span = document.createElement("span");
    span.id = "duolingo_percentage_words_good_id";

    let text = document.createTextNode(" (" + percentGood + "% good...)");
    span.appendChild(text);

    let wordCount = document.getElementById("word-count");
    wordCount.parentElement.appendChild(span);
}

var targetNode = document.getElementById("app");
var config = {childList: true, subtree: true};
var observer = new MutationObserver(callback);
observer.observe(targetNode, config);

window.addEventListener("load", function()
{
    console.log("extension: in window load event listener...");
    callback();
})

callback();

