let lastData = null;

const statusEl = document.getElementById("status");
const summaryEl = document.getElementById("summary");
const resultsEl = document.getElementById("results");
const extractBtn = document.getElementById("extractBtn");
const copyBtn = document.getElementById("copyBtn");
const downloadBtn = document.getElementById("downloadBtn");

function setStatus(text, type = "") {
  statusEl.textContent = text;
  statusEl.className = `status${type ? ` ${type}` : ""}`;
}

function renderResults(data) {
  resultsEl.innerHTML = "";
  const total = data.emails.length;
  summaryEl.textContent = `${total} email${total === 1 ? "" : "s"} found`;
  summaryEl.classList.remove("hidden");

  if (data.byPerson?.length > 0) {
    data.byPerson.forEach((person) => {
      const block = document.createElement("section");
      block.className = "person-block";
      const title = document.createElement("h2");
      title.textContent = person.name;
      const list = document.createElement("ul");
      list.className = "email-list";
      person.emails.forEach((email) => {
        const li = document.createElement("li");
        li.textContent = email;
        list.appendChild(li);
      });
      block.append(title, list);
      resultsEl.appendChild(block);
    });
    return;
  }

  const block = document.createElement("section");
  block.className = "flat-list";
  const list = document.createElement("ul");
  list.className = "email-list";
  data.emails.forEach((email) => {
    const li = document.createElement("li");
    li.textContent = email;
    list.appendChild(li);
  });
  block.appendChild(list);
  resultsEl.appendChild(block);
}

async function getActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

async function extractFromTab(tab) {
  if (!tab?.id) throw new Error("No active tab.");
  if (!tab.url?.includes("thatsthem.com")) {
    throw new Error("Open a ThatsThem page first (e.g. a name search results page).");
  }

  try {
    const response = await chrome.tabs.sendMessage(tab.id, { action: "extractEmails" });
    if (response?.ok) return response.data;
  } catch {
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["content.js"],
    });
    const response = await chrome.tabs.sendMessage(tab.id, { action: "extractEmails" });
    if (response?.ok) return response.data;
  }

  throw new Error("Could not read the page. Refresh and try again.");
}

extractBtn.addEventListener("click", async () => {
  extractBtn.disabled = true;
  copyBtn.disabled = true;
  downloadBtn.disabled = true;
  setStatus("Extracting…");

  try {
    const tab = await getActiveTab();
    lastData = await extractFromTab(tab);

    if (!lastData.emails.length) {
      setStatus("No emails found on this page.", "error");
      summaryEl.classList.add("hidden");
      resultsEl.innerHTML = "";
      return;
    }

    renderResults(lastData);
    copyBtn.disabled = false;
    downloadBtn.disabled = false;
    setStatus("Done.", "success");
  } catch (err) {
    lastData = null;
    setStatus(err.message || "Extraction failed.", "error");
    summaryEl.classList.add("hidden");
    resultsEl.innerHTML = "";
  } finally {
    extractBtn.disabled = false;
  }
});

copyBtn.addEventListener("click", async () => {
  if (!lastData?.emails?.length) return;
  const text = lastData.emails.join("\n");
  await navigator.clipboard.writeText(text);
  setStatus(`Copied ${lastData.emails.length} emails.`, "success");
});

downloadBtn.addEventListener("click", () => {
  if (!lastData) return;
  const blob = new Blob([JSON.stringify(lastData, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `thatsthem-emails-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
  setStatus("Download started.", "success");
});

document.addEventListener("DOMContentLoaded", async () => {
  const tab = await getActiveTab();
  if (tab?.url?.includes("thatsthem.com")) {
    setStatus("Ready — click Extract emails.");
  } else {
    setStatus("Navigate to thatsthem.com, then extract.", "error");
  }
});
