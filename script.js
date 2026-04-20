const chatForm = document.getElementById("chatForm");
const userInput = document.getElementById("userInput");
const chatWindow = document.getElementById("chatWindow");
const latestQuestion = document.getElementById("latestQuestion");
const sendBtn = document.getElementById("sendBtn");

const WORKER_URL = "https://loreal-api-worker.akapil1.workers.dev";

const SYSTEM_PROMPT = `
You are L’Oréal Product Advisor, a premium beauty assistant.

You only answer questions related to:
- L’Oréal products
- skincare
- makeup
- haircare
- fragrance
- beauty routines
- beauty recommendations
- general beauty-related topics

Rules:
1. Stay focused on beauty and product guidance.
2. If the question is unrelated, politely refuse and redirect the user to beauty topics.
3. Do not provide unsafe medical advice.
4. Keep responses clear, friendly, elegant, and concise.
5. When useful, suggest routines in steps.
6. Prefer practical and stylish answers that feel premium.
`;

const messages = [
  {
    role: "system",
    content: SYSTEM_PROMPT,
  },
];

function formatMessage(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\n/g, "<br>");
}

function scrollChatToBottom() {
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

function createMessageRow(role) {
  const row = document.createElement("div");
  row.className = `message-row ${role}`;

  const bubble = document.createElement("div");
  bubble.className = "message-bubble";

  row.appendChild(bubble);
  chatWindow.appendChild(row);

  return bubble;
}

function addMessage(role, text) {
  const bubble = createMessageRow(role);
  bubble.innerHTML = formatMessage(text);
  scrollChatToBottom();
}

function typeAssistantMessage(text) {
  const bubble = createMessageRow("assistant");
  let index = 0;
  let rendered = "";

  function typeNextCharacter() {
    if (index >= text.length) {
      bubble.innerHTML = formatMessage(text);
      scrollChatToBottom();
      return;
    }

    const char = text[index];
    rendered += char === "\n" ? "<br>" : char;
    bubble.innerHTML = rendered;
    index += 1;
    scrollChatToBottom();

    setTimeout(typeNextCharacter, 8);
  }

  typeNextCharacter();
}

function setLatestQuestion(text) {
  latestQuestion.textContent = `Latest question: ${text}`;
  latestQuestion.classList.remove("hidden");
}

function setLoadingState(isLoading) {
  sendBtn.disabled = isLoading;
  userInput.disabled = isLoading;
  sendBtn.setAttribute("aria-busy", String(isLoading));
}

function showWelcomeMessage() {
  addMessage(
    "assistant",
    "Hello — I’m your L’Oréal beauty advisor. Ask me about skincare, makeup, haircare, fragrance, or routines."
  );
}

async function getAssistantReply() {
  const response = await fetch(WORKER_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ messages }),
  });

  const rawText = await response.text();

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${rawText}`);
  }

  const data = JSON.parse(rawText);

  return (
    data?.choices?.[0]?.message?.content ||
    "Sorry, I could not generate a response right now."
  );
}

chatForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const text = userInput.value.trim();
  if (!text) return;

  addMessage("user", text);
  setLatestQuestion(text);

  messages.push({
    role: "user",
    content: text,
  });

  userInput.value = "";
  setLoadingState(true);

  try {
    const reply = await getAssistantReply();

    typeAssistantMessage(reply);

    messages.push({
      role: "assistant",
      content: reply,
    });
  } catch (error) {
    console.error("Frontend fetch error:", error);
    addMessage(
      "assistant",
      "Sorry, something went wrong while connecting to the assistant. Please try again."
    );
  } finally {
    setLoadingState(false);
    userInput.focus();
  }
});

showWelcomeMessage();