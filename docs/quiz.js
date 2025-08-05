const quizData = [
    {
        question: "Qual è il soprannome preferito di Ugo?",
        answers: {
            a: "Ughettino",
            b: "Patatone",
            c: "Cicciobello"
        },
        correctAnswer: "a"
    },
    {
        question: "Qual è il gioco preferito di Ugo?",
        answers: {
            a: "La pallina",
            b: "Il kong ripieno",
            c: "Il tira e molla"
        },
        correctAnswer: "b"
    },
    {
        question: "Cosa fa Ugo quando vede un gatto?",
        answers: {
            a: "Abbaia",
            b: "Lo ignora con superiorità",
            c: "Cerca di giocarci"
        },
        correctAnswer: "c"
    }
];

const quizContainer = document.getElementById('quiz');
const resultsContainer = document.getElementById('quiz-results');
const submitButton = document.getElementById('submit-quiz');

function buildQuiz() {
    const output = [];
    quizData.forEach((currentQuestion, questionNumber) => {
        const answers = [];
        for (letter in currentQuestion.answers) {
            answers.push(
                `<label>
                    <input type="radio" name="question${questionNumber}" value="${letter}">
                    ${letter} :
                    ${currentQuestion.answers[letter]}
                </label>`
            );
        }
        output.push(
            `<div class="question"> ${currentQuestion.question} </div>
            <div class="answers"> ${answers.join('')} </div>`
        );
    });
    quizContainer.innerHTML = output.join('');
}

function showResults() {
    const answerContainers = quizContainer.querySelectorAll('.answers');
    let numCorrect = 0;
    quizData.forEach((currentQuestion, questionNumber) => {
        const answerContainer = answerContainers[questionNumber];
        const selector = `input[name=question${questionNumber}]:checked`;
        const userAnswer = (answerContainer.querySelector(selector) || {}).value;
        if (userAnswer === currentQuestion.correctAnswer) {
            numCorrect++;
            answerContainers[questionNumber].style.color = 'lightgreen';
        } else {
            answerContainers[questionNumber].style.color = 'red';
        }
    });
    resultsContainer.innerHTML = `${numCorrect} su ${quizData.length} risposte corrette!`;
}

buildQuiz();
submitButton.addEventListener('click', showResults);
