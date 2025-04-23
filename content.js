const GITHUB_TOKEN = '';

function getRepoInfoFromURL() {
  const match = window.location.pathname.match(/^\/([^/]+)\/([^/]+)/);
  return match ? { owner: match[1], repo: match[2] } : null;
}

// Add debug logs to fetchReviewers
const fetchReviewers = async (owner, repo, prNumber) => {
  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/pulls/${prNumber}`,
    {
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28"
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
};

function getPRRows() {
  return [...document.querySelectorAll('a[data-hovercard-type="pull_request"]')];
}

// Update processPRs to add tooltips to reviewer avatars
async function processPRs() {
  const repoInfo = getRepoInfoFromURL();
  if (!repoInfo) {
    return;
  }

  const rows = getPRRows();

  for (const row of rows) {
    const href = row.getAttribute("href"); // e.g. /fybrasrl/web-app/pull/175
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
      tooltipDiv.className = 'AvatarStack AvatarStack--right ml-2 flex-1 flex-shrink-0';
      tooltipDiv.setAttribute('aria-label', `Reviewer: ${reviewer.login}`);

      const avatar = document.createElement('img');
      avatar.src = reviewer.avatar_url || 'https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png';
      avatar.alt = reviewer.login;
      avatar.width = 20;
      avatar.height = 20;
      avatar.className = "avatar-user avatar";
      avatar.style.marginLeft = '4px';

      tooltipDiv.appendChild(avatar);
      reviewersContainer.appendChild(tooltipDiv);
    });

    // Insert the reviewers container after the linked issue span
    linkedIssueSpan.parentNode.insertBefore(reviewersContainer, linkedIssueSpan.nextSibling);
  }
}

processPRs();
