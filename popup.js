// Get references to the UI elements in popup.html
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

// These arrays store the names currently shown in the two lists
let currentBefore = [];
let currentAfter = [];

// Connect button clicks to their corresponding functions
analyzeButton.addEventListener("click", analyzeThread);
copyBefore.addEventListener("click", () => copyList(currentBefore, beforeMessage));
copyAfter.addEventListener("click", () => copyList(currentAfter, afterMessage));

// Main function that analyzes the currently open Ed thread
async function analyzeThread() {
	// Make sure the user selected a cutoff time
	if (!cutoffInput.value) {
		statusText.textContent = "Please choose a cutoff date and time.";
		return;
	}

	// Convert the selected cutoff time into a JavaScript Date object
	const cutoff = new Date(cutoffInput.value);

	// Stop if the date is invalid
	if (Number.isNaN(cutoff.getTime())) {
		statusText.textContent = "Invalid cutoff time.";
		return;
	}

	// Give the user feedback while the page is being analyzed
	statusText.textContent = "Reading thread...";

	try {
		// Get the currently active browser tab
		const [tab] = await chrome.tabs.query({
			active: true,
			currentWindow: true
		});

		// Run extractReplyData() inside the active webpage
		const results = await chrome.scripting.executeScript({
			target: { tabId: tab.id },
			func: extractReplyData
		});

		// Get the array returned by extractReplyData()
		const replies = results[0].result;

		// Keep only replies where a valid timestamp was found
		const validReplies = replies.filter(reply => reply.timestamp !== null);

		// Count how many replies did not have a readable timestamp
		const missingTimeCount = replies.length - validReplies.length;

		// Create a set of unique people who responded at or before the cutoff time
		const beforeSet = new Set(
			validReplies
				.filter(reply => reply.timestamp <= cutoff.getTime())
				.map(reply => reply.name)
		);

		// Create a set of unique people who responded after the cutoff time
		const afterSet = new Set(
			validReplies
				.filter(reply => reply.timestamp > cutoff.getTime())
				.map(reply => reply.name)
		);

		// If someone responded before the cutoff, remove them from the "after" group
		for (const name of beforeSet) {
			afterSet.delete(name);
		}

		// Convert the sets into alphabetically sorted arrays
		currentBefore = [...beforeSet].sort((a, b) => a.localeCompare(b));
		currentAfter = [...afterSet].sort((a, b) => a.localeCompare(b));

		// Display the names in the two text areas
		beforeNames.value = currentBefore.join("\n");
		afterNames.value = currentAfter.join("\n");

		// Update the section titles with the number of unique people
		beforeTitle.textContent = `Before (${currentBefore.length})`;
		afterTitle.textContent = `After only (${currentAfter.length})`;

		// Show how many timed replies were read, plus any missing timestamps
		statusText.textContent =
			`Read ${validReplies.length} timed replies.` +
			(missingTimeCount
				? ` ${missingTimeCount} ${missingTimeCount === 1 ? "reply" : "replies"} had no readable timestamp.`
				: "");
	} catch (error) {
		// Log the technical error for debugging
		console.error(error);

		// Show a simple error message to the user
		statusText.textContent = "Could not read this page.";
	}
}

// This function runs inside the Ed webpage and extracts names + timestamps
function extractReplyData() {
  // Find every element that contains a responder's name
  const nameElements = [...document.querySelectorAll(".discom-user-name")];

  // Convert each name element into an object containing the name and timestamp
  return nameElements.map(nameElement => {
    // Read and clean up the visible name text
    const name = nameElement.textContent.trim();

    // Find the nearest parent container for this user/reply
    const userContainer = nameElement.closest(".discom-user");

    // If the expected container is missing, keep the name but mark timestamp as missing
    if (!userContainer) {
      return {name, timestamp: null};
    }

    // Find the <time> element inside the date section of this reply
    const timeElement = userContainer.querySelector(".discom-date time");

    // If no time element is found, mark the timestamp as missing
    if (!timeElement) {
      return {name, timestamp: null};
    }

    // Read the datetime attribute from the <time> element
    const datetime = timeElement.getAttribute("datetime");

    // If there is no datetime attribute, mark the timestamp as missing
    if (!datetime) {
      return {name, timestamp: null};
    }

    // Convert the datetime string into a JavaScript Date object
    const date = new Date(datetime);

    // If the date could not be parsed, mark the timestamp as missing
    if (Number.isNaN(date.getTime())) {
      return {name, timestamp: null};
    }

    // Return the responder's name and numeric timestamp
    return {
      name,
      timestamp: date.getTime()
    };
  }).filter(reply => reply.name); // Remove any entries with empty names
}

// Copies one of the name lists to the user's clipboard
async function copyList(list, messageElement) {
	// Do nothing if the list is empty
	if (!list.length) {
		return;
	}

	// Copy the names, one per line, to the clipboard
	await navigator.clipboard.writeText(list.join("\n"));

	// Show a temporary confirmation message
	messageElement.textContent = "Copied!";

	// Remove the confirmation after 2 seconds
	setTimeout(() => {
		messageElement.textContent = "";
	}, 2000);
}