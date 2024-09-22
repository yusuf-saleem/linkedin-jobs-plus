document.addEventListener("DOMContentLoaded", function () {
    const blacklist = document.getElementById("blacklist");
    const addBtn = document.getElementById("addBtn");
    const companyName = document.getElementById("companyName");

    // Load blacklist from Chrome storage when popup opens
    chrome.storage.local.get({ blacklistItems: [] }, function (result) {
        const items = result.blacklistItems;
        items.forEach((item) => {
            addItemToList(item);
        });
    });

    // Add company to blacklist, store in Chrome storage, and trigger content filtering
    addBtn.addEventListener("click", function () {
        const company = companyName.value.trim();
        if (company) {
            chrome.storage.local.get({ blacklistItems: [] }, function (result) {
                const updatedList = result.blacklistItems;
                updatedList.push(company);
                chrome.storage.local.set(
                    { blacklistItems: updatedList },
                    function () {
                        addItemToList(company);
                        companyName.value = ""; // Clear input field after adding

                        // Send a message to content script to trigger filtering
                        chrome.tabs.query(
                            { active: true, currentWindow: true },
                            function (tabs) {
                                chrome.tabs.sendMessage(tabs[0].id, {
                                    action: "filterJobs",
                                });
                            }
                        );
                    }
                );
            });
        }
    });

    function addItemToList(item) {
        const li = document.createElement("li");
        li.textContent = item;

        // Add event listener to remove item when clicked
        li.addEventListener("click", function () {
            removeItemFromList(item, li);
        });

        blacklist.appendChild(li);
    }

    function removeItemFromList(item, element) {
        chrome.storage.local.get({ blacklistItems: [] }, function (result) {
            const updatedList = result.blacklistItems.filter((i) => i !== item);
            chrome.storage.local.set(
                { blacklistItems: updatedList },
                function () {
                    element.remove(); // Remove the item from the UI

                    // Send a message to content script to trigger filtering
                    chrome.tabs.query(
                        { active: true, currentWindow: true },
                        function (tabs) {
                            chrome.tabs.sendMessage(tabs[0].id, {
                                action: "filterJobs",
                            });
                        }
                    );
                }
            );
        });
    }
});
