// Initialize the history variable with some sample messages
let history = [];

const messageForm = document.getElementById("message-form");
const messageInput = document.getElementById("message");
const messagesDiv = document.getElementById("messages");

function setInputHeight() {
    const lineHeight = parseInt(getComputedStyle(messageInput).lineHeight);
    const paddingTop = parseInt(getComputedStyle(messageInput).paddingTop);
    const paddingBottom = parseInt(getComputedStyle(messageInput).paddingBottom);
    const border = parseInt(getComputedStyle(messageInput).borderWidth);
    const minHeight = lineHeight + paddingTop + paddingBottom + border * 2;

    messageInput.style.height = `${minHeight}px`;
    const height = Math.max(minHeight, messageInput.scrollHeight);
    messageInput.style.height = `${height}px`;
    const button = document.getElementById("button")
    button.style.height = `${minHeight + parseInt(getComputedStyle(button).borderWidth)}px`
}


function colorQuotes(message) {
    let formattedMessage = '';
    let quote = false;
    for (let i = 0; i < message.length; i++) {
        const character = message[i];
        if (character !== '"') {
            formattedMessage += character;
            continue;
        }
        if (!quote) {
            quote = true;
            formattedMessage += '<span class="quote">"';
        } else {
            quote = false;
            formattedMessage += '"</span>';
        }
    }
    return formattedMessage;
}

function formatMessage(message) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(message, "text/html");
    const text = doc.body.textContent;
    const out = colorQuotes(text).replace(/\n/g, "<br>")
    return out == '' ? '[error]' : out
}


function displayMessage(message) {
    const messageContainer = document.createElement("div");
    messageContainer.classList.add("message");

    if (message.role === "assistant") {
        messageContainer.classList.add("assistant");
    } else if (message.role === "user") {
        messageContainer.classList.add("user");
    }

    // Replace newlines with <br> tags
    const formattedMessage = formatMessage(message.content);
    messageContainer.innerHTML = `<p>${formattedMessage}</p>`;
    messagesDiv.insertBefore(messageContainer, messagesDiv.firstChild);
}


function displayHistory() {
    messagesDiv.innerHTML = "";
    history.forEach(displayMessage);
}

setInputHeight()
history.push({ 'role': 'assistant', 'content': 'Describe the kind of story that you want.' })
displayHistory()

function handleFormSubmit(event) {
    event.preventDefault();
    if (messageInput.disabled) {
        return; // do nothing if message input field is disabled
    }
    const message = messageInput.value.trim();
    if (message) {
        const userMessage = { "role": "user", "content": message };
        history.push(userMessage);
        displayMessage(userMessage);
        messageInput.value = "";
        setInputHeight()

        // Disable the message input field
        messageInput.disabled = true;

        // Send input data to server and handle response
        fetch('https://87f8-72-49-59-104.ngrok.io/getResponse', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ history: history })
        })
            .then(response => response.json())
            .then(data => {
                const response = data.response;
                const message = { "role": "assistant", "content": response }
                history.push(message);
                displayMessage(message);
                //messagesDiv.scrollTop = messagesDiv.scrollHeight; // Scroll to bottom after displaying server response
            })
            .catch(error => {
                console.error(error)
                const errorMessage = { "role": "assistant", "content": error.message }
                displayMessage(errorMessage);
                history.pop()
            })
            .finally(() => {
                // Re-enable the message input field after the server responds or errors
                messageInput.disabled = false;
                messageInput.focus();
            });
    }
}

messageInput.addEventListener('keypress', function (event) {
    if (event.key === 'Enter' && !event.shiftKey && !(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent))) {
        event.preventDefault(); // prevent line break
        handleFormSubmit(event); // process the form submission
    }
});

messageInput.addEventListener('input', function (event) {
    setInputHeight()
})

messageForm.addEventListener("submit", handleFormSubmit);