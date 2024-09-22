chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'fetchLinkedInData') {
      fetch(`https://api.linkedin.com/v2/organizations?q=universalName&universalName=${request.companyName}`, {
        headers: {
          'Authorization': `Bearer YOUR_TOKEN_HERE`
        }
      })
      .then(response => response.json())
      .then(data => sendResponse({ data }))
      .catch(error => sendResponse({ error }));
      return true; // Keeps the message channel open for asynchronous sendResponse
    }
  });
  