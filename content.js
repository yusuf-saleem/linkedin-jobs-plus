const processedContainers = new Set();

function addButtons() {
    // Get all the <div> elements with class "mlA"
    const closeButtonContainers = document.querySelectorAll("div.mlA");

    closeButtonContainers.forEach(function (container) {
        // Check if we've already processed this container
        if (processedContainers.has(container)) {
            return;
        }

        // Find the button directly inside the container
        const existingButton = container.querySelector("button");

        if (existingButton) {

            // Clone the existing button
            const newButton = existingButton.cloneNode(true);

            // Update the id to make it unique
            newButton.id = "custom-" + existingButton.id;
            newButton.title = 'Blacklist this company';

            const spanElement = newButton.querySelector("span");
            if (spanElement) {
                spanElement.textContent = "🚫";
            } else {
                newButton.textContent = "🚫";
            }

            // Add event listener to the new button to add the company to the blacklist
            newButton.addEventListener("click", function () {
                const jobCard = container.closest(
                    "li.ember-view.jobs-search-results__list-item"
                );
                if (jobCard) {
                    const companyElement = jobCard.querySelector(
                        ".job-card-container__primary-description"
                    );
                    const companyName = companyElement
                        ? companyElement.textContent.trim()
                        : "";

                    if (companyName) {
                        addToBlacklist(companyName);
                    }
                }
            });

            const lineBreak = document.createElement("br");

            existingButton.parentNode.insertBefore(
                lineBreak,
                existingButton.nextSibling
            );
            existingButton.parentNode.insertBefore(
                newButton,
                lineBreak.nextSibling
            );

            // Mark this container as processed
            processedContainers.add(container);
        }
    });
}

// Function to add company to blacklist
function addToBlacklist(companyName) {
    chrome.storage.local.get({ blacklistItems: [] }, function (result) {
        const updatedList = result.blacklistItems;

        // Add company to the blacklist if it's not already there
        if (!updatedList.includes(companyName)) {
            updatedList.push(companyName);
            chrome.storage.local.set(
                { blacklistItems: updatedList },
                function () {
                    // Trigger the filtering to remove the job listing
                    applyBlacklistFilter();
                }
            );
        }
    });
}

// Function to filter jobs based on blacklist
function filterJobsByBlacklist(blacklist) {
    const jobCards = document.querySelectorAll("li");

    jobCards.forEach((jobCard) => {
        // Find the company name inside the job post (within the job-card subtitle)
        const companyElement = jobCard.querySelector(
            ".job-card-container__primary-description"
        );
        const companyName = companyElement
            ? companyElement.textContent.trim()
            : "";

        // If the company name matches any in the blacklist, remove the job card
        if (blacklist.includes(companyName)) {
            jobCard.remove();
        }
    });
}

// Function to load blacklist from Chrome storage and apply the filter
function applyBlacklistFilter() {
    chrome.storage.local.get({ blacklistItems: [] }, function (result) {
        const blacklist = result.blacklistItems;
        if (blacklist.length > 0) {
            filterJobsByBlacklist(blacklist);
        }
    });
}

addButtons();
applyBlacklistFilter();

function runFilterAfterPageLoad() {
    window.addEventListener("load", function () {
        applyBlacklistFilter(); // Run filter again to ensure all blacklisted companies are removed
    });
}

// Enhanced MutationObserver to continuously catch re-renders
const observer = new MutationObserver(function (mutations) {
    let shouldAddButtons = false;
    let shouldFilterJobs = false;

    mutations.forEach(function (mutation) {
        if (mutation.type === "childList" || mutation.type === "subtree") {
            // Check if any added nodes have the class we're looking for (mlA)
            const addedNodes = Array.from(mutation.addedNodes);
            const hasNewMlADiv = addedNodes.some(
                (node) =>
                    node.nodeType === Node.ELEMENT_NODE &&
                    (node.classList.contains("mlA") ||
                        node.querySelector(".mlA"))
            );

            // Check if any added nodes are job cards
            const hasNewJobCard = addedNodes.some(
                (node) =>
                    node.nodeType === Node.ELEMENT_NODE && node.matches("li")
            );

            // Check for re-rendered or restored job listings
            const restoredJobCards = addedNodes.some(
                (node) =>
                    node.nodeType === Node.ELEMENT_NODE && node.matches("li")
            );

            if (hasNewMlADiv) {
                shouldAddButtons = true;
            }
            if (hasNewJobCard || restoredJobCards) {
                shouldFilterJobs = true;
            }
        }
    });

    if (shouldAddButtons) {
        addButtons();
    }
    if (shouldFilterJobs) {
        applyBlacklistFilter();
    }
});

// Configure the observer to watch for changes in the entire document
observer.observe(document.body, {
    childList: true,
    subtree: true,
});

// Listen for messages from popup.js
chrome.runtime.onMessage.addListener(function (message) {
    if (message.action === "filterJobs") {
        applyBlacklistFilter();
    }
});

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
        addButtons();
        applyBlacklistFilter();
        runFilterAfterPageLoad();
    });
} else {
    addButtons();
    applyBlacklistFilter();
    runFilterAfterPageLoad();
}
