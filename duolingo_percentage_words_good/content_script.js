console.log("loading duolingo_percentage_words_good extension...");

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
    span.parentElement.removeChild(span);
    console.log("removing old extension span element...");
}

span = document.createElement("span");
span.id = "duolingo_percentage_words_good_id";

let text = document.createTextNode(" (" + percentGood + "% good...)");
span.appendChild(text);

let wordCount = document.getElementById("word-count");
wordCount.parentElement.appendChild(span);