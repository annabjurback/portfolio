let response;
let json;

// Get the form element from HTML.
const form = document.querySelector("form");
const questionContainer = form.querySelector('#questions');

// Get the option template from the HTML.
const optionTemplate = document.getElementById("option-template");
// Remove option template from DOM.
optionTemplate.remove();
// Remove id attribute from saved optionTemplate
optionTemplate.removeAttribute('id');

// Get question template from HTML, remove from DOM (see above)
const questionTemplate = document.getElementById("question-template");
questionTemplate.remove();
questionTemplate.removeAttribute('id');

// States to maintain for each click
let score;
let guesses;

form.onsubmit = event => {
    event.preventDefault();
    score = 0;
    guesses = 0;
    empty(form.querySelector('#questions'));
    let category = form.categorySelection.value;
    let difficulty = form.difficultySelection.value;
    start(category, difficulty);
};

function empty(element) {
    element.replaceChildren();
}

// Call open trivia db API.
async function collectQuestions(category, difficulty) {
    let url = 'https://opentdb.com/api.php?';
    let queryString = new URLSearchParams({
        amount: 10,
    });
    if (difficulty !== 'any') {
        queryString.append('difficulty', difficulty);
    }
    if (category !== 'any') {
        queryString.append('category', category);
    }
    url += queryString;
    response = await fetch(url);
    json = await response.json();
    let b = 7;
}

// Get random integer between 0 and max.
function getRandomInt(max) {
    return Math.floor(Math.random() * max);
}

// Decode HTML encoded text.
function decode(encoded) {
    let parser = new DOMParser();
    let doc = parser.parseFromString(encoded, "text/html");
    let decodedString = doc.documentElement.textContent;
    return decodedString;
}

async function start(category, difficulty) {
    await collectQuestions(category, difficulty);

    // For each question in the json:
    json.results.forEach((result, resultIndex) => {
        // Clone question element.
        const questionElement = questionTemplate.cloneNode(true);

        // Insert question into cloned template.
        questionElement.querySelector(".prompt").textContent = decode(result.question);

        // Get optionList element from cloned question template.
        const optionList = questionElement.querySelector(".option-list");
        // Create empty array to put options in.
        let allOptions = [];

        // Push all incorrect options into the array.
        result.incorrect_answers.forEach((option) => {
            allOptions.push(option);
        });

        // Create random integer.
        let correctAnswerIndex = getRandomInt(result.type === "boolean" ? 2 : 4);
        // Add correct answer to array at random integer index position
        allOptions.splice(correctAnswerIndex, 0, decode(result.correct_answer));

        // For each option in the array: 
        allOptions.forEach((option, optionIndex) => {
            const optionElement = createOptionElement(option, optionIndex, resultIndex);
            // Append optionElement to optionList element.
            optionList.appendChild(optionElement);
            // Add "correct" class to correct answer
            if (optionIndex === correctAnswerIndex) {
                optionElement.classList.add("correct");
            }
        });
        // Append questionElement to form
        questionContainer.appendChild(questionElement);

        // make use of event propagation (or "bubbling"): whenever a
        // "change" event occurs anywhere in the element (including descendants)
        questionElement.onchange = () => {
            Array.from(questionElement.querySelectorAll("input")).forEach(input => input.disabled = true); // disable further clicking, once an option has been chosen
            if (guesses === json.results.length) {
                document.getElementById("score").hidden = false;
                document.getElementById("score").scrollIntoView({behavior: "smooth"});
                document.getElementById("result-score").textContent = score + " / " + json.results.length;
                // alert("Final score: " + score + " / " + json.results.length);
            }
        };
    });
}

function createOptionElement(option, optionIndex, resultIndex) {
    // Clone option element.
    const optionElement = optionTemplate.cloneNode(true);
    // Get optionInput element.
    const optionInput = optionElement.querySelector("input");
    // Get optionLabel element.
    const optionLabel = optionElement.querySelector("label");
    // Set text content of label to current option.
    optionLabel.textContent = decode(option);

    // make sure inputs and labels have IDs and names
    const questionName = "question-" + resultIndex;
    const optionId = "question-" + resultIndex + "-option-" + optionIndex;
    optionInput.id = optionId;
    optionInput.name = questionName;
    optionLabel.htmlFor = optionId;

    // count guesses and take care of scores
    optionInput.onchange = () => {
        guesses += 1;
        // optionInput.parentElement.classList.add('selected');
        if (optionInput.parentElement.classList.contains('correct')) {
            score += 1;
        }
        else {
            // add class to correct option in order to css it
            optionInput.parentElement.parentElement.querySelector('.correct').classList.add('not-chosen');
        }
    };

    return optionElement;
}