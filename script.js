let taskList = '';

function getBotIdentity() {
    let botIdentity = "Your name is Baldwin and you are a bald eagle. \
    Your job is to be a study buddy and mental support tool in a browser \
    extension that helps organize tasks, boost productivity, and improve \
    mental health. You follow the teachings of St. Ignatius of Loyola. \
    Inside of the browser extension, in addition to chatting with you, \
    the user has access to a Timer and a Task. Try to keep your responses\
    under five or so sentences if possible, but you can elaborate if it really \
    requires the detail. Do not use any special formatting \
    in your responses. YOU MAY ONLY ANSWER THINGS\
    RELATED TO MENTAL HEALTH, WELLNESS, AND STUDYING. For reference, the user's \
    current tasks are " + taskList;

    return botIdentity;
}

const API_KEY = "Insert API Key";

// Returns string of Chat GPT response
async function getChatGPTResponse(prompt) {
    console.log('API Key:', API_KEY); // Log the API key to verify it's loaded correctly

    if (!API_KEY) {
        throw new Error('API key is not defined. Please check it');
    }

    const url = 'https://api.openai.com/v1/chat/completions';

    const headers = {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
    };

    const data = {
        model: 'gpt-4o-mini',
        messages: [
            { role: 'system', content: getBotIdentity()},
            { role: 'user', content: prompt}
        ],
        temperature: .7
    };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(data)
        });

        const result = await response.json();
        console.log('API Response:', result); // Log the entire API response
        console.log(getBotIdentity());
        if (result.choices && result.choices.length > 0) {
            return result.choices[0].message.content;
        } else {
            throw new Error('Unexpected API response format');
        }
    } catch (error) {
        console.error('Error:', error.message);
        return '';
    }
}

// Updates the quote section
function updateQuote(newQuote) {
    document.getElementById('quote').textContent = newQuote;
}

// Calls to ai and updates quote
async function fetchAndUpdateQuote() {
    try {
        const newQuote = await getChatGPTResponse("Give me a motivational quote");
        console.log('New Quote:', newQuote);
        updateQuote(newQuote);
    } catch (error) {
        console.error('Error fetching and updating quote:', error);
    }
}

// Call the function to fetch and update the quote
document.addEventListener('DOMContentLoaded', fetchAndUpdateQuote);

// Timer functionality
let timer;
let countdown = 1500; // 25 minutes in seconds
let isPaused = false;

function setTimer() {
    const minutes = parseInt(document.getElementById('timer-input-minutes').value);
    const seconds = parseInt(document.getElementById('timer-input-seconds').value);
    if ((!isNaN(minutes) && minutes >= 0) && (isNaN(seconds))) {
        countdown = minutes * 60;
        document.getElementById('timer').textContent = minutes + ":00";
        saveTimerState();
        document.getElementById('timer-input-minutes').placeholder = 'Enter minutes';
        document.getElementById('timer-input-seconds').placeholder = 'Enter seconds';
    } else if ((isNaN(minutes)) && (!isNaN(seconds) && seconds >= 0)) {
        countdown = seconds;
        if (countdown % 60 < 10) {
            document.getElementById('timer').textContent = Math.floor(countdown / 60) + ":0" + countdown % 60;
        } else {
            document.getElementById('timer').textContent = Math.floor(countdown / 60) + ":" + countdown % 60;
        }
        saveTimerState();
        document.getElementById('timer-input-minutes').placeholder = 'Enter minutes';
        document.getElementById('timer-input-seconds').placeholder = 'Enter seconds';
    } else if ((!isNaN(minutes) && minutes >= 0) && (!isNaN(seconds) && seconds >= 0)) {
        countdown = minutes * 60 + seconds;
        if (countdown % 60 < 10) {
            document.getElementById('timer').textContent = Math.floor(countdown / 60) + ":0" + countdown % 60;
        } else {
            document.getElementById('timer').textContent = Math.floor(countdown / 60) + ":" + countdown % 60;
        }
        saveTimerState();
        document.getElementById('timer-input-minutes').placeholder = 'Enter minutes';
        document.getElementById('timer-input-seconds').placeholder = 'Enter seconds';
    } else {
        document.getElementById('timer-input-minutes').value = '';
        document.getElementById('timer-input-seconds').value = '';
        document.getElementById('timer-input-minutes').placeholder = 'Invalid';
        document.getElementById('timer-input-seconds').placeholder = 'Invalid';
    }
}

function startTimer() {
    if (timer) clearInterval(timer);
    isPaused = true;
    saveTimerState();
    timer = setInterval(function() {
        let minutes = Math.floor(countdown / 60);
        let seconds = countdown % 60;
        if (seconds < 10) {
            seconds = '0' + seconds
        }
        document.getElementById('timer').textContent = minutes + ":" + seconds;
        countdown--;
        if (countdown < 0) {
            clearInterval(timer);
            document.getElementById('timer').textContent = "Time's up! Ask Baldwin how you can relax and take a study break!";
        }
        saveTimerState();
    }, 1000);
}

function pauseTimer() {
    if (timer) {
        clearInterval(timer);
        timer = null;
        isPaused = true;
    }
}

function resetTimer() {
    clearInterval(timer);
    timer = null;
    countdown = 1500;
    isPaused = false;
    document.getElementById('timer').textContent = "25:00";
    saveTimerState();
}

// Save and load timer info
function saveTimerState() {
    chrome.storage.local.set({
        countdown: countdown,
        isPaused: isPaused
    }, function() {
        console.log('Timer state saved');
    });
}

function loadTimerState() {
    chrome.storage.local.get(['countdown', 'isPaused'], function(result) {
        if (result.countdown !== undefined) {
            countdown = result.countdown;
        }
        if (result.isPaused !== undefined) {
            isPaused = result.isPaused;
        }

        // Update the UI
        let minutes = Math.floor(countdown / 60);
        let seconds = countdown % 60;
        if (seconds < 10) {
            seconds = '0' + seconds;
        }
        document.getElementById('timer').textContent = minutes + ":" + seconds;
    });
}

// Task storage and retrieval
function saveTasks() {
    let tasks = [];
    document.querySelectorAll("#goals-list li").forEach((taskItem) => {
        let taskText = taskItem.querySelector('span').textContent.trim();
        let isCompleted = taskItem.querySelector('span').classList.contains('completed');
        tasks.push({ text: taskText, completed: isCompleted });
    });
    chrome.storage.local.set({ tasks: tasks }, function() {
        // Saves tasks to give ai
        taskList = tasks.map(task => task.completed ? `${task.text} [Completed]` : task.text).join(", ");
        console.log('Tasks saved');
    });
}

// Load tasks from chrome.storage
function loadTasks() {
    chrome.storage.local.get(['tasks'], function(result) {
        if (result.tasks) {
            taskList = result.tasks.map(task => task.completed ? `${task.text} [Completed]` : task.text).join(", ");
            result.tasks.forEach((task) => {
                let listItem = document.createElement("li");
                listItem.innerHTML = `
                    <span>${task.text}</span>
                    <div class="button-container">
                        <button class="completeGoalButton">Complete</button>
                        <button class="removeGoalButton">Remove</button>
                    </div>
                `;
                if (task.completed) {
                    listItem.querySelector('span').classList.add('completed');
                }
                document.getElementById("goals-list").appendChild(listItem);
            });
        }
    });
}

// To-Do list functionality
function addTask() {
    let taskText = document.getElementById("new-task").value;
    if (taskText === "") return;

    let listItem = document.createElement("li");
    listItem.innerHTML = `
        <span>${taskText}</span>
        <div class="button-container">
            <button class="completeGoalButton">Complete</button>
            <button class="removeGoalButton">Remove</button>
        </div>
    `;
    document.getElementById("goals-list").appendChild(listItem);
    document.getElementById("new-task").value = "";

    saveTasks();
}

function removeTask(event) {
    event.target.closest('li').remove();
    saveTasks();
}

function completeTask(event) {
    let listItem = event.target.closest('li');
    let taskTextElement = listItem.querySelector('span');
    if (!taskTextElement.classList.contains('completed')) {
        taskTextElement.classList.add('completed');
    }
    saveTasks();
}

// Chat bot input
async function callChatBot() {
    console.log('Called chat bot function')
    try {
        let userText = await getChatGPTResponse(document.getElementById("chat-user-input").value);
        if (userText === "") return;
        document.getElementById('bot-output-text').textContent = userText;
        document.getElementById("chat-user-input").value = '';
    } catch (error) {
        console.error('Error fetching chat bot response:', error);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // Loads all saved tasks from last time
    loadTasks()
    
    // Timer buttons
    document.getElementById('timerStartButton').addEventListener('click', startTimer);
    document.getElementById('timerPauseButton').addEventListener('click', pauseTimer);
    document.getElementById('timerResetButton').addEventListener('click', resetTimer);

    //Enter time
    document.getElementById('enterTimeButton').addEventListener('click', setTimer);
    document.getElementById('timer-input-minutes').addEventListener('keydown', function(event) {
        if (event.key === 'Enter') {
            setTimer();
        }
    });
    document.getElementById('timer-input-seconds').addEventListener('keydown', function(event) {
        if (event.key === 'Enter') {
            setTimer();
        }
    });

    // Load timer
    loadTimerState();
    
    // Add task button
    document.getElementById('addTaskButton').addEventListener('click', addTask);
    document.getElementById('new-task').addEventListener('keydown', function(event) {
        if (event.key === 'Enter') {
            addTask();
        }
    });


    // Add and complete buttons for added tasks
    document.getElementById('goals-list').addEventListener('click', (event) => {
        if (event.target.classList.contains('removeGoalButton')) {
            removeTask(event);
        } else if (event.target.classList.contains('completeGoalButton')) {
            completeTask(event)
        }
    });
    
    // Call to chat bot
    document.getElementById('askQuestionButton').addEventListener('click', callChatBot);
    document.getElementById('chat-user-input').addEventListener('keydown', function(event) {
        if (event.key === 'Enter') {
            callChatBot();
        }
    });
})