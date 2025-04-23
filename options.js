// Move inline script to an external JavaScript file to comply with Content Security Policy
const saveButton = document.getElementById('save-token');
const feedback = document.getElementById('feedback');
const tokenInput = document.getElementById('github-token');

saveButton.addEventListener('click', () => {
  const token = tokenInput.value.trim();

  if (!token) {
    feedback.textContent = 'GitHub token cannot be empty.';
    feedback.style.color = 'red';
    feedback.style.display = 'block';
    return;
  }

  chrome.storage.sync.set({ GITHUB_TOKEN: token }, () => {
    if (chrome.runtime.lastError) {
      feedback.textContent = 'Failed to save GitHub token. Please try again.';
      feedback.style.color = 'red';
    } else {
      feedback.textContent = 'GitHub token saved successfully!';
      feedback.style.color = 'green';
    }
    feedback.style.display = 'block';
    setTimeout(() => feedback.style.display = 'none', 3000); // Hide feedback after 3 seconds
  });
});

// Add event listener to save the token when pressing Enter
tokenInput.addEventListener('keypress', (event) => {
  if (event.key === 'Enter') {
    saveButton.click();
  }
});

chrome.storage.sync.get('GITHUB_TOKEN', (result) => {
  tokenInput.value = result.GITHUB_TOKEN || '';
});