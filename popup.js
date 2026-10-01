const cutoffInput = document.getElementById("cutoff");
const analyzeButton = document.getElementById("analyze");
const statusText = document.getElementById("status");
const beforeTitle = document.getElementById("beforeTitle");
const afterTitle = document.getElementById("afterTitle");
const beforeNames = document.getElementById("beforeNames");
const afterNames = document.getElementById("afterNames");
const copyBefore = document.getElementById("copyBefore");
const copyAfter = document.getElementById("copyAfter");
const beforeMessage = document.getElementById("beforeMessage");
const afterMessage = document.getElementById("afterMessage");
let currentBefore = [];
let currentAfter = [];
analyzeButton.addEventListener("click", analyzeThread);
copyBefore.addEventListener("click", () => copyList(currentBefore, beforeMessage));
copyAfter.addEventListener("click", () => copyList(currentAfter, afterMessage));

async function analyzeThread() {
  if (!cutoffInput.value) {
    statusText.textContent = "Please choose a cutoff date and time.";
    return;
  }
  const cutoff = new Date(cutoffInput.value);
  if (Number.isNaN(cutoff.getTime())) {
    statusText.textContent = "Invalid cutoff time.";
    return;
  }
  statusText.textContent = "Reading thread...";
  try {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true
    });
    const results = await chrome.scripting.executeScript({
      target: {tabId: tab.id},
      func: extractReplyData
    });
    const replies = results[0].result;
    const validReplies = replies.filter(reply => reply.timestamp !== null);
    const missingTimeCount = replies.length - validReplies.length;
    const beforeSet = new Set(
      validReplies
        .filter(reply => reply.timestamp < cutoff.getTime())
        .map(reply => reply.name)
    );
    const afterSet = new Set(
      validReplies
        .filter(reply => reply.timestamp >= cutoff.getTime())
        .map(reply => reply.name)
    );
    for (const name of beforeSet) {
      afterSet.delete(name);
    }
    currentBefore = [...beforeSet].sort((a, b) => a.localeCompare(b));
    currentAfter = [...afterSet].sort((a, b) => a.localeCompare(b));
    beforeNames.value = currentBefore.join("\n");
    afterNames.value = currentAfter.join("\n");
    beforeTitle.textContent = `Before (${currentBefore.length})`;
    afterTitle.textContent = `After only (${currentAfter.length})`;
    statusText.textContent =
      `Read ${validReplies.length} timed replies.` +
      (missingTimeCount
        ? ` ${missingTimeCount} ${missingTimeCount === 1 ? "reply" : "replies"} had no readable timestamp.`
        : "");
  } catch (error) {
    console.error(error);
    statusText.textContent = "Could not read this page.";
  }
}

function extractReplyData() {
  const nameElements = [...document.querySelectorAll(".discom-user-name")];
  return nameElements.map(nameElement => {
    const name = nameElement.textContent.trim();
    const timestamp = findTimestamp(nameElement);
    return {name, timestamp};
  }).filter(reply => reply.name);

  function findTimestamp(nameElement) {
    let node = nameElement;
    for (let level = 0; level < 8 && node; level++, node = node.parentElement) {
      const candidates = [];
      if (
        node.matches?.(
          "time[datetime], [datetime], [data-timestamp], [data-time]"
        )
      ) {
        candidates.push(node);
      }
      candidates.push(
        ...(node.querySelectorAll?.(
          "time[datetime], [datetime], [data-timestamp], [data-time]"
        ) || [])
      );
      for (const candidate of candidates) {
        const parsed = parseCandidate(candidate);
        if (parsed !== null) {
          return parsed;
        }
      }
    }
    return null;
  }

  function parseCandidate(element) {
    const values = [
      element.getAttribute("datetime"),
      element.getAttribute("data-timestamp"),
      element.getAttribute("data-time"),
      element.getAttribute("title"),
      element.getAttribute("aria-label")
    ].filter(Boolean);
    for (const value of values) {
      const numeric = Number(value);
      if (Number.isFinite(numeric) && numeric > 1000000000) {
        const milliseconds =
          numeric < 100000000000
            ? numeric * 1000
            : numeric;
        const date = new Date(milliseconds);
        if (!Number.isNaN(date.getTime())) {
          return date.getTime();
        }
      }
      const date = new Date(value);
      if (!Number.isNaN(date.getTime())) {
        return date.getTime();
      }
    }
    return null;
  }
}

async function copyList(list, messageElement) {
  if (!list.length) {
    return;
  }
  await navigator.clipboard.writeText(list.join("\n"));
  messageElement.textContent = "Copied!";
  setTimeout(() => {
    messageElement.textContent = "";
  }, 1500);
}