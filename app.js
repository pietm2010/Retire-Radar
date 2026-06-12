const STORAGE_KEY = "retire-radar-plan";

const defaults = {
  name: "Future You",
  currentAge: 39,
  retirementAge: 62,
  currentSavings: 145000,
  monthlyContribution: 850,
  annualReturn: 6,
  withdrawalRate: 4,
  fixedIncome: 22000,
};

const fields = [
  "name",
  "currentAge",
  "retirementAge",
  "currentSavings",
  "monthlyContribution",
  "annualReturn",
  "withdrawalRate",
  "fixedIncome",
];

const form = document.querySelector("#plannerForm");
const toast = document.querySelector("#toast");
let state = loadState();

function loadState() {
  try {
    return { ...defaults, ...JSON.parse(localStorage.getItem(STORAGE_KEY)) };
  } catch {
    return { ...defaults };
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function money(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(value) ? value : 0);
}

function whole(value) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(
    Math.max(0, Number.isFinite(value) ? value : 0),
  );
}

function getNumber(id) {
  const value = Number(document.querySelector(`#${id}`).value);
  return Number.isFinite(value) ? value : 0;
}

function retirementDate() {
  const yearsToRetire = Math.max(0, state.retirementAge - state.currentAge);
  const date = new Date();
  date.setFullYear(date.getFullYear() + yearsToRetire);
  date.setHours(17, 0, 0, 0);
  return date;
}

function projectNestEgg() {
  const years = Math.max(0, state.retirementAge - state.currentAge);
  const months = Math.round(years * 12);
  const monthlyRate = Math.max(0, state.annualReturn) / 100 / 12;
  let balance = Math.max(0, state.currentSavings);

  for (let month = 0; month < months; month += 1) {
    balance = balance * (1 + monthlyRate) + Math.max(0, state.monthlyContribution);
  }

  return balance;
}

function calculatePlan() {
  const target = retirementDate();
  const now = new Date();
  const diffMs = Math.max(0, target - now);
  const totalSeconds = Math.floor(diffMs / 1000);
  const years = Math.floor(totalSeconds / 31557600);
  const days = Math.floor((totalSeconds % 31557600) / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const seconds = totalSeconds % 60;
  const nestEgg = projectNestEgg();
  const portfolioIncome = nestEgg * (Math.max(0, state.withdrawalRate) / 100);
  const annualIncome = portfolioIncome + Math.max(0, state.fixedIncome);

  return { target, years, days, hours, seconds, nestEgg, annualIncome, monthlyIncome: annualIncome / 12 };
}

function updateForm() {
  fields.forEach((id) => {
    document.querySelector(`#${id}`).value = state[id];
  });
}

function updateView() {
  const plan = calculatePlan();
  const name = state.name?.trim() || "Future You";
  const dateLabel = plan.target.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  document.querySelector("#heroTitle").textContent = `${name}, your retirement countdown is live.`;
  document.querySelector("#yearsLeft").textContent = whole(plan.years);
  document.querySelector("#daysLeft").textContent = whole(plan.days);
  document.querySelector("#hoursLeft").textContent = whole(plan.hours);
  document.querySelector("#secondsLeft").textContent = whole(plan.seconds);
  document.querySelector("#retireDateText").textContent = `Estimated retirement day: ${dateLabel} at 5:00 PM.`;
  document.querySelector("#annualIncome").textContent = money(plan.annualIncome);
  document.querySelector("#monthlyIncome").textContent = money(plan.monthlyIncome);
  document.querySelector("#nestEgg").textContent = money(plan.nestEgg);

  const readiness = Math.min(100, Math.round((plan.annualIncome / 85000) * 100));
  document.querySelector("#meterFill").style.width = `${readiness}%`;

  const yearsToRetire = Math.max(0, state.retirementAge - state.currentAge);
  document.querySelector("#readinessTitle").textContent =
    yearsToRetire > 0 ? `${yearsToRetire} years to shape the next chapter.` : "You are at your retirement target.";

  document.querySelector("#targetInsight").textContent =
    yearsToRetire > 0
      ? `At age ${state.retirementAge}, your countdown points to ${dateLabel}.`
      : "Your target retirement age is now or earlier, so the clock is ready whenever you are.";

  const monthlyBoost = state.monthlyContribution * 12;
  document.querySelector("#momentumInsight").textContent =
    `You are adding ${money(monthlyBoost)} per year before growth. Raising that amount is the fastest lever in this model.`;
}

function syncFromInputs() {
  state = {
    name: document.querySelector("#name").value || defaults.name,
    currentAge: getNumber("currentAge"),
    retirementAge: getNumber("retirementAge"),
    currentSavings: getNumber("currentSavings"),
    monthlyContribution: getNumber("monthlyContribution"),
    annualReturn: getNumber("annualReturn"),
    withdrawalRate: getNumber("withdrawalRate"),
    fixedIncome: getNumber("fixedIncome"),
  };
  saveState();
  updateView();
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("is-visible");
  window.setTimeout(() => toast.classList.remove("is-visible"), 1800);
}

async function copyShareCard() {
  const plan = calculatePlan();
  const name = state.name?.trim() || "Future Me";
  const text = [
    `${name}'s Retire Radar`,
    `I retire in ${whole(plan.years)} years, ${whole(plan.days)} days, ${whole(plan.hours)} hours, and ${whole(plan.seconds)} seconds.`,
    `Estimated annual retirement income: ${money(plan.annualIncome)}.`,
    "What does your freedom clock say?",
  ].join("\n");

  try {
    await navigator.clipboard.writeText(text);
    showToast("Share card copied.");
  } catch {
    showToast(text);
  }
}

function useSample() {
  state = {
    name: "Avery",
    currentAge: 34,
    retirementAge: 55,
    currentSavings: 220000,
    monthlyContribution: 1450,
    annualReturn: 6.5,
    withdrawalRate: 4,
    fixedIncome: 18000,
  };
  saveState();
  updateForm();
  updateView();
}

form.addEventListener("input", syncFromInputs);
document.querySelector("#shareButton").addEventListener("click", copyShareCard);
document.querySelector("#sampleButton").addEventListener("click", useSample);
document.querySelector("#resetButton").addEventListener("click", () => {
  localStorage.removeItem(STORAGE_KEY);
  state = { ...defaults };
  updateForm();
  updateView();
  showToast("Plan reset.");
});

updateForm();
updateView();
window.setInterval(updateView, 1000);
