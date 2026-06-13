const STORAGE_KEY = "retire-radar-plan";
const TABLE_NAME = "retirement_plans";

const defaults = {
  name: "Future You",
  birthDate: "1987-06-12",
  retirementAge: 62,
  currentSavings: 145000,
  monthlyContribution: 850,
  desiredSpending: 70000,
  annualReturn: 6,
  inflationRate: 2.5,
  withdrawalRate: 4,
  fixedIncome: 22000,
};

const fields = [
  "name",
  "birthDate",
  "retirementAge",
  "currentSavings",
  "monthlyContribution",
  "desiredSpending",
  "annualReturn",
  "inflationRate",
  "withdrawalRate",
  "fixedIncome",
];

const form = document.querySelector("#plannerForm");
const toast = document.querySelector("#toast");
const config = window.RETIRE_RADAR_SUPABASE || {};
const hasSupabaseConfig = Boolean(config.url && config.anonKey && window.supabase);
const db = hasSupabaseConfig ? window.supabase.createClient(config.url, config.anonKey) : null;
let currentUser = null;
let state = loadState();
let saveTimer;

function loadState() {
  try {
    return { ...defaults, ...JSON.parse(localStorage.getItem(STORAGE_KEY)) };
  } catch {
    return { ...defaults };
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  scheduleCloudSave();
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

function parseBirthDate() {
  const date = new Date(`${state.birthDate}T12:00:00`);
  return Number.isNaN(date.getTime()) ? new Date(`${defaults.birthDate}T12:00:00`) : date;
}

function currentAge() {
  const today = new Date();
  const birth = parseBirthDate();
  let age = today.getFullYear() - birth.getFullYear();
  const birthdayThisYear = new Date(today.getFullYear(), birth.getMonth(), birth.getDate());
  if (today < birthdayThisYear) age -= 1;
  return Math.max(0, age);
}

function retirementDate() {
  const birth = parseBirthDate();
  const date = new Date(birth);
  date.setFullYear(birth.getFullYear() + Math.max(0, state.retirementAge));
  date.setHours(17, 0, 0, 0);
  return date;
}

function monthsUntilRetirement(target) {
  const now = new Date();
  return Math.max(0, (target.getFullYear() - now.getFullYear()) * 12 + target.getMonth() - now.getMonth());
}

function projectNestEgg(months) {
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
  const months = monthsUntilRetirement(target);
  const yearsToRetire = months / 12;
  const nestEgg = projectNestEgg(months);
  const portfolioIncome = nestEgg * (Math.max(0, state.withdrawalRate) / 100);
  const annualIncome = portfolioIncome + Math.max(0, state.fixedIncome);
  const inflatedSpending = Math.max(0, state.desiredSpending) * Math.pow(1 + Math.max(0, state.inflationRate) / 100, yearsToRetire);
  const incomeGap = annualIncome - inflatedSpending;
  const readiness = inflatedSpending > 0 ? Math.min(140, Math.round((annualIncome / inflatedSpending) * 100)) : 0;

  return {
    target,
    years,
    days,
    hours,
    seconds,
    months,
    nestEgg,
    annualIncome,
    monthlyIncome: annualIncome / 12,
    inflatedSpending,
    incomeGap,
    readiness,
    age: currentAge(),
  };
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
  const gapWord = plan.incomeGap >= 0 ? "surplus" : "shortfall";

  document.querySelector("#heroTitle").textContent = `${name}, your retirement countdown is live.`;
  document.querySelector("#yearsLeft").textContent = whole(plan.years);
  document.querySelector("#daysLeft").textContent = whole(plan.days);
  document.querySelector("#hoursLeft").textContent = whole(plan.hours);
  document.querySelector("#secondsLeft").textContent = whole(plan.seconds);
  document.querySelector("#retireDateText").textContent = `Estimated retirement day: ${dateLabel} at 5:00 PM.`;
  document.querySelector("#annualIncome").textContent = money(plan.annualIncome);
  document.querySelector("#monthlyIncome").textContent = money(plan.monthlyIncome);
  document.querySelector("#nestEgg").textContent = money(plan.nestEgg);
  document.querySelector("#incomeSubtitle").textContent = `${plan.readiness}% of your inflation-adjusted spending target.`;
  document.querySelector("#meterFill").style.width = `${Math.min(100, plan.readiness)}%`;

  document.querySelector("#readinessTitle").textContent =
    plan.incomeGap >= 0 ? "Your plan has breathing room." : "Your plan needs a little more fuel.";
  document.querySelector("#targetInsight").textContent =
    `At age ${state.retirementAge}, your countdown points to ${dateLabel}. You are about ${plan.age} today.`;
  document.querySelector("#gapInsight").textContent =
    `Estimated ${gapWord}: ${money(Math.abs(plan.incomeGap))} per year versus your future spending target of ${money(plan.inflatedSpending)}.`;

  document.querySelector("#shareBadge").textContent = plan.readiness >= 100 ? "On track" : "Retirement gap";
  document.querySelector("#shareHeadline").textContent = `${whole(plan.years)} years, ${whole(plan.days)} days`;
  document.querySelector("#shareText").textContent =
    plan.incomeGap >= 0
      ? `I am tracking a ${money(plan.incomeGap)} yearly retirement cushion. What does your freedom clock say?`
      : `I am ${money(Math.abs(plan.incomeGap))} per year away from my retirement target. Challenge accepted.`;
}

function syncFromInputs() {
  state = {
    name: document.querySelector("#name").value || defaults.name,
    birthDate: document.querySelector("#birthDate").value || defaults.birthDate,
    retirementAge: getNumber("retirementAge"),
    currentSavings: getNumber("currentSavings"),
    monthlyContribution: getNumber("monthlyContribution"),
    desiredSpending: getNumber("desiredSpending"),
    annualReturn: getNumber("annualReturn"),
    inflationRate: getNumber("inflationRate"),
    withdrawalRate: getNumber("withdrawalRate"),
    fixedIncome: getNumber("fixedIncome"),
  };
  saveState();
  updateView();
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("is-visible");
  window.setTimeout(() => toast.classList.remove("is-visible"), 2200);
}

async function copyShareCard() {
  const plan = calculatePlan();
  const name = state.name?.trim() || "Future Me";
  const text = [
    `${name}'s Retire Radar`,
    `I retire in ${whole(plan.years)} years, ${whole(plan.days)} days, ${whole(plan.hours)} hours, and ${whole(plan.seconds)} seconds.`,
    `Estimated annual retirement income: ${money(plan.annualIncome)}.`,
    plan.incomeGap >= 0
      ? `Projected cushion: ${money(plan.incomeGap)} per year.`
      : `Retirement gap: ${money(Math.abs(plan.incomeGap))} per year.`,
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
    birthDate: "1992-04-18",
    retirementAge: 55,
    currentSavings: 220000,
    monthlyContribution: 1450,
    desiredSpending: 78000,
    annualReturn: 6.5,
    inflationRate: 2.5,
    withdrawalRate: 4,
    fixedIncome: 18000,
  };
  saveState();
  updateForm();
  updateView();
}

function updateAccountStatus(message) {
  const status = document.querySelector("#accountStatus");
  status.textContent = message || (hasSupabaseConfig ? "Cloud save is ready." : "Browser-only mode is on until Supabase is configured.");
  document.querySelector("#dataInsight").textContent = hasSupabaseConfig
    ? "Sign in to save this plan to your private Supabase profile."
    : "Your info is saved in this browser. Add Supabase credentials to enable accounts and cloud saving.";
}

async function getSessionUser() {
  if (!db) return;
  const { data } = await db.auth.getUser();
  currentUser = data?.user || null;
  updateAccountStatus(currentUser ? `Signed in as ${currentUser.email}.` : "Cloud save is ready. Sign in to sync your plan.");
  if (currentUser) await loadCloudPlan();
}

async function signUp() {
  if (!db) return showToast("Add Supabase credentials first.");
  const email = document.querySelector("#email").value;
  const password = document.querySelector("#password").value;
  const { data, error } = await db.auth.signUp({ email, password });
  if (error) return showToast(error.message);
  currentUser = data?.user || currentUser;
  updateAccountStatus("Check your email to confirm the account, then sign in.");
}

async function signIn() {
  if (!db) return showToast("Add Supabase credentials first.");
  const email = document.querySelector("#email").value;
  const password = document.querySelector("#password").value;
  const { data, error } = await db.auth.signInWithPassword({ email, password });
  if (error) return showToast(error.message);
  currentUser = data.user;
  updateAccountStatus(`Signed in as ${currentUser.email}.`);
  await loadCloudPlan();
  await saveCloudPlan();
}

async function signOut() {
  if (!db) return showToast("Browser-only mode is active.");
  await db.auth.signOut();
  currentUser = null;
  updateAccountStatus("Signed out. Browser-only saving is still active.");
}

function scheduleCloudSave() {
  window.clearTimeout(saveTimer);
  saveTimer = window.setTimeout(saveCloudPlan, 700);
}

async function saveCloudPlan() {
  if (!db || !currentUser) return;
  const payload = {
    user_id: currentUser.id,
    plan: state,
    updated_at: new Date().toISOString(),
  };
  const { error } = await db.from(TABLE_NAME).upsert(payload, { onConflict: "user_id" });
  if (error) updateAccountStatus(`Cloud save issue: ${error.message}`);
}

async function loadCloudPlan() {
  if (!db || !currentUser) return;
  const { data, error } = await db.from(TABLE_NAME).select("plan").eq("user_id", currentUser.id).maybeSingle();
  if (error) return updateAccountStatus(`Cloud load issue: ${error.message}`);
  if (data?.plan) {
    state = { ...defaults, ...data.plan };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    updateForm();
    updateView();
    showToast("Cloud plan loaded.");
  }
}

form.addEventListener("input", syncFromInputs);
document.querySelector("#shareButton").addEventListener("click", copyShareCard);
document.querySelector("#sampleButton").addEventListener("click", useSample);
document.querySelector("#resetButton").addEventListener("click", () => {
  localStorage.removeItem(STORAGE_KEY);
  state = { ...defaults };
  updateForm();
  updateView();
  saveCloudPlan();
  showToast("Plan reset.");
});
document.querySelector("#signUpButton").addEventListener("click", signUp);
document.querySelector("#signInButton").addEventListener("click", signIn);
document.querySelector("#signOutButton").addEventListener("click", signOut);

updateForm();
updateView();
updateAccountStatus();
getSessionUser();
window.setInterval(updateView, 1000);
