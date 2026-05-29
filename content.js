/**
 * ThatsThem hides email local-parts with CSS but stores full addresses in
 * base64-encoded x-href paths like /email/user@domain.com
 */

const EMAIL_PATH_PREFIX = "/email/";

function decodeXHref(encoded) {
  if (!encoded || typeof encoded !== "string") return null;
  try {
    const normalized = encoded.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized + "===".slice((normalized.length + 3) % 4);
    return atob(padded);
  } catch {
    return null;
  }
}

function emailFromPath(path) {
  if (!path || !path.startsWith(EMAIL_PATH_PREFIX)) return null;
  const raw = path.slice(EMAIL_PATH_PREFIX.length);
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

function emailFromElement(el) {
  const encoded = el.getAttribute("x-href");
  const path = decodeXHref(encoded);
  return emailFromPath(path);
}

function getRecordName(record) {
  const heading = record.querySelector("h2");
  if (!heading) return "Unknown";
  return heading.textContent.replace(/\s+/g, " ").trim() || "Unknown";
}

function extractEmails() {
  const allSet = new Set();
  const byPerson = [];

  document.querySelectorAll(".record").forEach((record) => {
    const emails = [];
    const seen = new Set();
    record.querySelectorAll("[x-href]").forEach((el) => {
      const email = emailFromElement(el);
      if (email && !seen.has(email)) {
        seen.add(email);
        emails.push(email);
        allSet.add(email);
      }
    });
    if (emails.length > 0) {
      byPerson.push({ name: getRecordName(record), emails });
    }
  });

  if (byPerson.length === 0) {
    document.querySelectorAll("[x-href]").forEach((el) => {
      const email = emailFromElement(el);
      if (email) allSet.add(email);
    });
  }

  return {
    url: location.href,
    extractedAt: new Date().toISOString(),
    emails: [...allSet].sort((a, b) => a.localeCompare(b)),
    byPerson,
  };
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.action === "extractEmails") {
    sendResponse({ ok: true, data: extractEmails() });
  }
  return true;
});
