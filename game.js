// game.js

const classButtons = document.querySelectorAll(".class-btn");
const submitBtn = document.getElementById("submit-btn");
const questionBox = document.getElementById("question");
const answerInput = document.getElementById("answer");
const feedback = document.getElementById("feedback");
const scoreDisplay = document.getElementById("score");
const streakDisplay = document.getElementById("streak");
const binaryPracticeBtn = document.getElementById("binary-practice-btn");
const binaryReverseBtn = document.getElementById("binary-reverse-btn");

let currentClass = "C"; // default
let score = 0;
let streak = 0;
let currentQuestion = {};

const classRanges = {
  A: { base: "10", prefixRange: [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30] },
  B: { base: "172", prefixRange: [16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30] },
  C: { base: "192", prefixRange: [24, 25, 26, 27, 28, 29, 30] }
};

function randomPrivateIP(classType) {
  switch (classType) {
    case "A": return `10.${rand(0, 255)}.${rand(0, 255)}.${rand(0, 255)}`;
    case "B": return `172.${rand(16, 31)}.${rand(0, 255)}.${rand(0, 255)}`;
    case "C": return `192.168.${rand(0, 255)}.${rand(0, 255)}`;
  }
}

function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function prefixToMask(prefix) {
  let mask = [];
  let bits = "1".repeat(prefix).padEnd(32, "0");
  for (let i = 0; i < 32; i += 8) mask.push(parseInt(bits.slice(i, i + 8), 2));
  return mask.join(".");
}

function usableHosts(prefix) {
  const hostBits = 32 - prefix;
  return hostBits <= 1 ? 0 : Math.pow(2, hostBits) - 2;
}

function networkInfo(ip, prefix) {
  const ipParts = ip.split(".").map(Number);
  const maskParts = prefixToMask(prefix).split(".").map(Number);
  const network = ipParts.map((octet, i) => octet & maskParts[i]);
  const broadcast = ipParts.map((octet, i) => (octet & maskParts[i]) | (~maskParts[i] & 255));
  
  return {
    network: network.join("."),
    broadcast: broadcast.join("."),
    firstHost: network.slice(0,3).concat([network[3] + 1]).join("."),
    lastHost: broadcast.slice(0,3).concat([broadcast[3] - 1]).join(".")
  };
}

function generateQuestion() {
  const classData = classRanges[currentClass];
  const randomPrefix = classData.prefixRange[rand(0, classData.prefixRange.length - 1)];
  const ip = randomPrivateIP(currentClass);
  const type = ["subnetMask", "hostCount", "networkAddr", "broadcastAddr", "firstHost", "lastHost"][rand(0, 5)];
  
  const info = networkInfo(ip, randomPrefix);

  switch (type) {
    case "subnetMask":
      currentQuestion = { question: `What is the subnet mask for ${ip}/${randomPrefix}?`, answer: prefixToMask(randomPrefix) };
      break;
    case "hostCount":
      currentQuestion = { question: `How many usable hosts in ${ip}/${randomPrefix}?`, answer: String(usableHosts(randomPrefix)) };
      break;
    case "networkAddr":
      currentQuestion = { question: `What is the network address of ${ip}/${randomPrefix}?`, answer: info.network };
      break;
    case "broadcastAddr":
      currentQuestion = { question: `What is the broadcast address of ${ip}/${randomPrefix}?`, answer: info.broadcast };
      break;
    case "firstHost":
      currentQuestion = { question: `What is the first usable host of ${ip}/${randomPrefix}?`, answer: info.firstHost };
      break;
    case "lastHost":
      currentQuestion = { question: `What is the last usable host of ${ip}/${randomPrefix}?`, answer: info.lastHost };
      break;
  }
}

let currentMode = "class"; // "class" | "binary-dec" | "binary-bin"

binaryPracticeBtn.addEventListener("click", () => {
  currentMode = "binary-dec";
  generateBinaryQuestion();

  updateScoreDisplay();
});

binaryReverseBtn.addEventListener("click", () => {
  currentMode = "binary-bin";
  generateBinaryReverseQuestion();

  updateScoreDisplay();
});


function generateBinaryQuestion() {
  const randomDecimal = rand(0, 255);
  currentQuestion = {
    type: "binary-dec",
    question: `Convert ${randomDecimal} to binary (8 bits):`,
    answer: randomDecimal.toString(2).padStart(8, "0")
  };
  questionBox.textContent = currentQuestion.question;
  answerInput.value = "";
  answerInput.classList.remove("hidden");
  submitBtn.classList.remove("hidden");
}

function generateBinaryReverseQuestion() {
  const randomDecimal = rand(0, 255);
  const binaryString = randomDecimal.toString(2).padStart(8, "0");
  currentQuestion = {
    type: "binary-bin",
    question: `Convert ${binaryString} to decimal:`,
    answer: String(randomDecimal)
  };
  questionBox.textContent = currentQuestion.question;
  answerInput.value = "";
  answerInput.classList.remove("hidden");
  submitBtn.classList.remove("hidden");
}

function nextQuestion() {
  // If we are in binary mode, stay in binary mode
  if (currentMode === "binary-dec") {
    generateBinaryQuestion();
    return;
  }
  if (currentMode === "binary-bin") {
    generateBinaryReverseQuestion();
    return;
  }
  
  // Otherwise, continue normal Class A/B/C questions
  generateQuestion();
  questionBox.textContent = currentQuestion.question;
  feedback.textContent = "";
  answerInput.value = "";
}

classButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    currentMode = "class"; // switch back to class-based mode
    currentClass = btn.dataset.class;
    updateScoreDisplay();
    answerInput.classList.remove("hidden");
    submitBtn.classList.remove("hidden");
    nextQuestion();
  });
});

const modeLabel = document.getElementById("mode-label");

function updateScoreDisplay() {
  scoreDisplay.textContent = `Score: ${score}`;
  streakDisplay.textContent = streak > 0 ? `🔥 Streak: ${streak}` : "";

  let modeText = "";
  switch(currentMode) {
    case "binary-dec":
      modeText = "Decimal → Binary";
      break;
    case "binary-bin":
      modeText = "Binary → Decimal";
      break;
    case "class":
    default:
      modeText = `Class ${currentClass}`;
      break;
  }
  modeLabel.textContent = `— ${modeText}`;
}

submitBtn.addEventListener("click", () => {
  // Disable button to prevent spamming
  submitBtn.disabled = true;
  submitBtn.classList.add("opacity-50", "cursor-not-allowed");

  if (answerInput.value.trim() === currentQuestion.answer) {
    streak++;
    score += 10 * (1 + (streak >= 5 ? 0.5 : 0));
    feedback.textContent = `✅ Correct! (+${streak >= 5 ? "15" : "10"} pts)`;
  } else {
    feedback.textContent = `❌ Wrong! Correct: ${currentQuestion.answer}`;
    streak = 0;
  }

  updateScoreDisplay();

  setTimeout(() => {
    nextQuestion();

    // Re-enable button after next question is shown
    submitBtn.disabled = false;
    submitBtn.classList.remove("opacity-50", "cursor-not-allowed");
  }, 1500);
});




// ----- SCENARIO MODE -----

const scenarioBox = document.getElementById("scenario-box");
const scenarioBtn = document.getElementById("scenario-mode-btn");
const scenarioText = document.getElementById("scenario-text");
const scenarioMaskInput = document.getElementById("scenario-mask");
const scenarioSubnetsInput = document.getElementById("scenario-subnets");
const scenarioHostsInput = document.getElementById("scenario-hosts");
const scenarioNetworksInput = document.getElementById("scenario-networks");
const scenarioBroadcastsInput = document.getElementById("scenario-broadcasts");
const scenarioSubmit = document.getElementById("scenario-submit");
const scenarioFeedback = document.getElementById("scenario-feedback");

let scenarioAnswer = {};

scenarioBtn.addEventListener("click", () => {
  document.getElementById("question-box").classList.add("hidden");
  scenarioBox.classList.remove("hidden");
  generateScenario();
});

function generateScenario(selectedClass = null) {
  // If no class was selected manually, pick random
  const classChoice = selectedClass ?? ["A", "B", "C"][rand(0, 2)];

  let baseIP;
  switch (classChoice) {
    case "A":
      baseIP = `10.${rand(0, 255)}.${rand(0, 255)}.0`;
      break;
    case "B":
      baseIP = `172.${rand(16, 31)}.${rand(0, 255)}.0`;
      break;
    case "C":
    default:
      baseIP = `192.168.${rand(0, 255)}.0`;
      break;
  }

  const neededHosts = [10, 20, 30, 40, 50, 100, 200][rand(0, 6)];
  const neededSubnets = [2, 4, 8, 16][rand(0, 3)];

  const hostBitsNeeded = Math.ceil(Math.log2(neededHosts + 2));
  const subnetBitsNeeded = Math.ceil(Math.log2(neededSubnets));
  const prefix = 32 - Math.max(hostBitsNeeded, subnetBitsNeeded);
  const mask = prefixToMask(prefix);

  const step = Math.pow(2, 32 - prefix); // addresses per subnet
  let baseParts = baseIP.split(".").map(Number);
  let baseInt = (baseParts[0] << 24) | (baseParts[1] << 16) | (baseParts[2] << 8);

  let networks = [];
  let broadcasts = [];
  for (let i = 0; i < neededSubnets; i++) {
    const netInt = baseInt + (i * step);
    const bcastInt = netInt + step - 1;
    networks.push(intToIP(netInt));
    broadcasts.push(intToIP(bcastInt));
  }

  scenarioAnswer = {
    mask,
    prefix,
    subnets: neededSubnets,
    hosts: step - 2,
    networks,
    broadcasts
  };

  scenarioText.textContent = `The corporation wants you to create ${neededSubnets} networks with ${neededHosts} hosts each using the address ${baseIP}. Fill in all fields.`;
  scenarioFeedback.textContent = "";
  [scenarioMaskInput, scenarioSubnetsInput, scenarioHostsInput, scenarioNetworksInput, scenarioBroadcastsInput].forEach(input => input.value = "");
}


function intToIP(num) {
  return [
    (num >>> 24) & 255,
    (num >>> 16) & 255,
    (num >>> 8) & 255,
    num & 255
  ].join(".");
}

scenarioSubmit.addEventListener("click", () => {
  let feedbackMessages = [];

  if (scenarioMaskInput.value.trim() === scenarioAnswer.mask || scenarioMaskInput.value.trim() === `/${scenarioAnswer.prefix}`) {
    feedbackMessages.push("✅ Subnet mask correct");
  } else {
    feedbackMessages.push(`❌ Subnet mask wrong (Answer: ${scenarioAnswer.mask} or /${scenarioAnswer.prefix})`);
  }

  if (parseInt(scenarioSubnetsInput.value) === scenarioAnswer.subnets) {
    feedbackMessages.push("✅ Subnet count correct");
  } else {
    feedbackMessages.push(`❌ Subnet count wrong (Answer: ${scenarioAnswer.subnets})`);
  }

  if (parseInt(scenarioHostsInput.value) === scenarioAnswer.hosts) {
    feedbackMessages.push("✅ Hosts per subnet correct");
  } else {
    feedbackMessages.push(`❌ Hosts per subnet wrong (Answer: ${scenarioAnswer.hosts})`);
  }

  const userNetworks = scenarioNetworksInput.value.split(",").map(x => x.trim());
  if (JSON.stringify(userNetworks) === JSON.stringify(scenarioAnswer.networks)) {
    feedbackMessages.push("✅ Network addresses correct");
  } else {
    feedbackMessages.push(`❌ Network addresses wrong (Answer: ${scenarioAnswer.networks.join(", ")})`);
  }

  const userBroadcasts = scenarioBroadcastsInput.value.split(",").map(x => x.trim());
  if (JSON.stringify(userBroadcasts) === JSON.stringify(scenarioAnswer.broadcasts)) {
    feedbackMessages.push("✅ Broadcast addresses correct");
  } else {
    feedbackMessages.push(`❌ Broadcast addresses wrong (Answer: ${scenarioAnswer.broadcasts.join(", ")})`);
  }

  scenarioFeedback.innerHTML = feedbackMessages.join("<br>");
});

const scenarioBack = document.getElementById("scenario-back");

scenarioBack.addEventListener("click", () => {
  scenarioBox.classList.add("hidden");
  document.getElementById("question-box").classList.remove("hidden");

  // Keep score and streak display intact
  updateScoreDisplay();

  // If the player had already selected a class, continue questions
  if (currentClass) {
    answerInput.classList.remove("hidden");
    submitBtn.classList.remove("hidden");
    nextQuestion();
  } else {
    // Otherwise, prompt them to select a class
    questionBox.textContent = "Select a class to start!";
    answerInput.classList.add("hidden");
    submitBtn.classList.add("hidden");
  }

  feedback.textContent = "";
});

document.querySelectorAll("#scenario-class-buttons button").forEach(btn => {
  btn.addEventListener("click", () => {
    const selectedClass = btn.getAttribute("data-class");
    generateScenario(selectedClass);
  });
});
