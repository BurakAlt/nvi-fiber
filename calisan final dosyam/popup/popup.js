/**
 * FiberPlan Chrome - Popup Script
 * Shows extension status and project stats
 */

document.addEventListener('DOMContentLoaded', async () => {
  // Dashboard button
  document.getElementById('open-dashboard').addEventListener('click', function() {
    chrome.tabs.create({ url: chrome.runtime.getURL('dashboard/dashboard.html') });
  });

  // Check if active tab is NVI portal
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (tab && tab.url && tab.url.includes('adres.nvi.gov.tr')) {
      const statusEl = document.querySelector('.status');
      statusEl.classList.add('active');
      statusEl.querySelector('span').textContent = 'NVI Portal aktif';

      // Get project stats from content script
      chrome.tabs.sendMessage(tab.id, { type: 'getStats' }, (response) => {
        if (chrome.runtime.lastError) return;
        if (response) {
          document.getElementById('pop-ada').textContent = response.adas || 0;
          document.getElementById('pop-bldg').textContent = response.buildings || 0;
          document.getElementById('pop-bb').textContent = response.bb || 0;
        }
      });
    }
  } catch (e) {
    console.log('Popup init error:', e);
  }
});
