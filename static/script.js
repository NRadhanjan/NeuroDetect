// ─── QUESTIONS ───────────────────────────────────────────────
const questions = [
  { id: "A1", text: "Does your child look at you when you call his/her name?" },
  { id: "A2", text: "Is it easy for you to get eye contact with your child?" },
  { id: "A3", text: "Does your child point to indicate that s/he wants something?" },
  { id: "A4", text: "Does your child point to share interest with you?" },
  { id: "A5", text: "Does your child pretend? (e.g. care for dolls, talk on toy phone)" },
  { id: "A6", text: "Does your child follow where you're looking?" },
  { id: "A7", text: "If you or someone in the family is visibly upset, does your child show signs of wanting to comfort them?" },
  { id: "A8", text: "Would you describe your child's first words as typical?" },
  { id: "A9", text: "Does your child use simple gestures? (e.g. wave goodbye)" },
  { id: "A10", text: "Does your child stare at nothing with no apparent purpose?" },
];

// ─── RENDER QUESTIONS ─────────────────────────────────────────
function renderQuestions() {
  const q1to5 = document.getElementById("questions1to5");
  const q6to10 = document.getElementById("questions6to10");

  questions.forEach((q, i) => {
    const html = `
      <div class="question-item">
        <p>Q${i + 1}. ${q.text}</p>
        <div class="question-options">
          <label><input type="radio" name="${q.id}" value="1"/> Yes</label>
          <label><input type="radio" name="${q.id}" value="0"/> No</label>
        </div>
      </div>`;
    if (i < 5) q1to5.innerHTML += html;
    else q6to10.innerHTML += html;
  });
}

renderQuestions();

// ─── STEP NAVIGATION ──────────────────────────────────────────
function showStep(step) {
  document.querySelectorAll(".step").forEach(s => s.classList.remove("active"));
  document.getElementById(`step${step}`).classList.add("active");

  const fill = document.getElementById("progressFill");
  const text = document.getElementById("progressText");
  fill.style.width = `${step * 25}%`;
  text.textContent = `Step ${step} of 4`;
}

function nextStep(step) {
  if (step === 2 && !validateStep1()) return;
  if (step === 3 && !validateStep2()) return;
  showStep(step);
}

function prevStep(step) { showStep(step); }

// ─── VALIDATION ───────────────────────────────────────────────
function validateStep1() {
  const age = document.getElementById("age").value;
  const sex = document.getElementById("sex").value;
  const jaundice = document.getElementById("jaundice").value;
  const family = document.getElementById("family").value;
  const who = document.getElementById("who").value;
  const ethnicity = document.getElementById("ethnicity").value;

  if (!age || !sex || !jaundice || !family || !who || !ethnicity) {
    alert("Please fill in all fields before proceeding.");
    return false;
  }
  if (age < 12 || age > 48) {
    alert("Please enter a valid age between 12 and 48 months.");
    return false;
  }
  return true;
}

function validateStep2() {
  for (let i = 0; i < 5; i++) {
    const q = questions[i];
    const answered = document.querySelector(`input[name="${q.id}"]:checked`);
    if (!answered) {
      alert(`Please answer Question ${i + 1} before proceeding.`);
      return false;
    }
  }
  return true;
}

function validateStep3() {
  for (let i = 5; i < 10; i++) {
    const q = questions[i];
    const answered = document.querySelector(`input[name="${q.id}"]:checked`);
    if (!answered) {
      alert(`Please answer Question ${i + 1} before submitting.`);
      return false;
    }
  }
  return true;
}

// ─── SUBMIT SCREENING ─────────────────────────────────────────
async function submitScreening() {
  if (!validateStep3()) return;

  const payload = {
    Age_Mons: parseInt(document.getElementById("age").value),
    Sex: parseInt(document.getElementById("sex").value),
    Jaundice: parseInt(document.getElementById("jaundice").value),
    Family_mem_with_ASD: parseInt(document.getElementById("family").value),
    Who_completed_test: parseInt(document.getElementById("who").value),
    Ethnicity: parseInt(document.getElementById("ethnicity").value),
  };

  questions.forEach(q => {
    payload[q.id] = parseInt(
      document.querySelector(`input[name="${q.id}"]:checked`).value
    );
  });

  try {
    const res = await fetch("/predict", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (data.error) {
      alert("Error: " + data.error);
      return;
    }

    showResults(data);
    showStep(4);

  } catch (err) {
    alert("Could not connect to server. Make sure Flask is running.");
  }
}

// ─── SHOW RESULTS ─────────────────────────────────────────────
function showResults(data) {
  const isYes = data.prediction === "Yes";

  document.getElementById("resultIcon").textContent = isYes ? "⚠️" : "✅";
  document.getElementById("resultTitle").textContent = isYes
    ? "ASD Traits Detected"
    : "No ASD Traits Detected";
  document.getElementById("resultText").textContent = isYes
    ? "Our model has detected behavioral patterns associated with ASD. We strongly recommend consulting a pediatric specialist for a professional evaluation."
    : "Our model did not detect significant ASD traits. However, continue monitoring your child's development and consult a doctor if you have concerns.";

  document.getElementById("confidenceVal").textContent = data.confidence + "%";
  document.getElementById("riskVal").textContent = data.risk_level;

  const riskEl = document.getElementById("riskVal");
  riskEl.style.color =
    data.risk_level === "High" ? "#e24b4a" :
    data.risk_level === "Moderate" ? "#ba7517" : "#1d9e75";
}

// ─── RESET ────────────────────────────────────────────────────
function resetScreening() {
  document.getElementById("age").value = "";
  document.getElementById("sex").value = "";
  document.getElementById("jaundice").value = "";
  document.getElementById("family").value = "";
  document.getElementById("who").value = "";
  document.getElementById("ethnicity").value = "";

  questions.forEach(q => {
    const radios = document.querySelectorAll(`input[name="${q.id}"]`);
    radios.forEach(r => r.checked = false);
  });

  showStep(1);
}

// ─── CHATBOT ──────────────────────────────────────────────────
async function sendChat() {
  const input = document.getElementById("chatInput");
  const msg = input.value.trim();
  if (!msg) return;

  appendMessage(msg, "user");
  input.value = "";

  appendMessage("Thinking...", "bot", "typing");

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 300,
        system: `You are NeuroBot, a compassionate AI assistant on NeuroDetect — 
        an early autism detection platform for parents. Answer questions about 
        autism symptoms, early signs, Q-CHAT screening, therapies, and next steps 
        after diagnosis. Be warm, concise, and always remind users to consult a 
        healthcare professional for medical advice. Never diagnose.`,
        messages: [{ role: "user", content: msg }],
      }),
    });

    const data = await res.json();
    const reply = data.content?.[0]?.text || "I'm sorry, I couldn't process that.";

    removeTyping();
    appendMessage(reply, "bot");

  } catch (err) {
    removeTyping();
    appendMessage("Sorry, I'm having trouble connecting right now. Please try again.", "bot");
  }
}

function appendMessage(text, sender, id = "") {
  const box = document.getElementById("chatMessages");
  const div = document.createElement("div");
  div.className = `chat-msg ${sender}`;
  if (id) div.id = id;
  div.innerHTML = `<div class="chat-bubble">${text}</div>`;
  box.appendChild(div);
  box.scrollTop = box.scrollHeight;
}

function removeTyping() {
  const t = document.getElementById("typing");
  if (t) t.remove();
}