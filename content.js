// Note: this extension is mostly written by CoPilot
// Ensure the GitHub token is loaded before making API requests
let GITHUB_TOKEN = '';

chrome.storage.sync.get('GITHUB_TOKEN', (result) => {
  GITHUB_TOKEN = result.GITHUB_TOKEN || '';
  if (!GITHUB_TOKEN) {
    console.error("GitHub token is not set. Please configure it in the extension settings.");
  } else {
    processPRs();
  }
});

function getRepoInfoFromURL() {
  const match = window.location.pathname.match(/^\/([^/]+)\/([^/]+)/);
  return match ? { owner: match[1], repo: match[2] } : null;
}

async function fetchReviewers(owner, repo, prNumber) {
  if (!GITHUB_TOKEN) {
    console.error("GitHub token is not available. Cannot fetch reviewers.");
    return [];
  }

  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/pulls/${prNumber}`,
    {
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28'
      }
    }
  );
  if (!response.ok) {
    console.error(`Failed to fetch reviewers for PR #${prNumber}`, await response.text());
    return [];
  }
  const data = await response.json();
  return [
    ...data.requested_reviewers.map(user => ({ login: user.login, avatar_url: user.avatar_url })),
    ...data.requested_teams.map(team => ({ login: `@${team.name}`, avatar_url: '' }))
  ];
}

function getPRRows() {
  return [...document.querySelectorAll('a[data-hovercard-type="pull_request"]')];
}

async function processPRs() {
  const repoInfo = getRepoInfoFromURL();
  if (!repoInfo) {
    return;
  }

  const rows = getPRRows();

  for (const row of rows) {
    const href = row.getAttribute('href'); // Eg: /davideviolante/repo/pull/123
    const numberMatch = href.match(/\/pull\/(\d+)/);
    if (!numberMatch) {
      continue;
    }
    const prNumber = numberMatch[1];

    const reviewers = await fetchReviewers(repoInfo.owner, repoInfo.repo, prNumber);

    const linkedIssueSpan = row.closest('.Box-row').querySelector('.flex-shrink-0 .ml-2.flex-1');
    if (!linkedIssueSpan) {
      continue;
    }

    // Create a container for reviewers
    const reviewersContainer = document.createElement('span');
    reviewersContainer.className = 'ml-2 flex-1 flex-shrink-0';
    reviewersContainer.innerHTML = '';

    reviewers.forEach(reviewer => {
      const tooltipDiv = document.createElement('div');
      tooltipDiv.className = 'AvatarStack AvatarStack--right ml-2 flex-1 flex-shrink-0 tooltipped tooltipped-sw';
      tooltipDiv.setAttribute('aria-label', `Reviewer: ${reviewer.login}`);

      const avatar = document.createElement('img');
      avatar.src = reviewer.avatar_url;
      avatar.alt = reviewer.login;
      avatar.width = 20;
      avatar.height = 20;
      avatar.className = 'avatar-user avatar';
      avatar.style.marginLeft = '4px';

      tooltipDiv.appendChild(avatar);
      reviewersContainer.appendChild(tooltipDiv);
    });

    // Insert the reviewers container after the linked issue span
    linkedIssueSpan.parentNode.insertBefore(reviewersContainer, linkedIssueSpan.nextSibling);
  }
}
