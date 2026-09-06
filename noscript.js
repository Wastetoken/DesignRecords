console.log('noScript!!!');

/* ── Theme setup ─────────────────────────────────────────────── */
function applyTheme() {
  var darkModeMatchMedia = window.matchMedia('(prefers-color-scheme: dark)');
  var isDarkMode = darkModeMatchMedia.matches;
  var isColorThemeLight = !isDarkMode;
  document.body.style.backgroundColor = isColorThemeLight ? '#c0c0c0' : '#404040';
  document.body.querySelector('.sc-default').setAttribute('data-theme-light', isColorThemeLight);
}

/* ── Panel helpers ───────────────────────────────────────────── */
function showPanel(id) {
  var panels = document.querySelectorAll('.sc-panel');
  for (var i = 0; i < panels.length; i++) panels[i].style.display = 'none';
  var panel = document.getElementById(id);
  if (panel) panel.style.display = 'block';
}

/* ── Extraction flow ─────────────────────────────────────────── */
function extractDesign(tabId) {
  showPanel('sc-loading');
  chrome.runtime.sendMessage({ type: 'scrollCaptureExtractDesign', tabId: tabId }, function (response) {
    handleExtractResponse(response, tabId, 'DESIGN.md', 'scrollCaptureDownloadDesign');
  });
}

function extractSkill(tabId) {
  showPanel('sc-loading');
  chrome.runtime.sendMessage({ type: 'scrollCaptureExtractSkill', tabId: tabId }, function (response) {
    handleExtractResponse(response, tabId, 'SKILL.md', 'scrollCaptureDownloadSkill');
  });
}

function handleExtractResponse(response, tabId, filename, downloadType) {
  if (chrome.runtime.lastError) {
    showError(chrome.runtime.lastError.message);
    return;
  }
  if (!response) {
    showError('No response from background script.');
    return;
  }
  if (response.error) {
    showError(response.error);
    return;
  }
  showDesignResult(response, tabId, filename, downloadType);
}

function showDesignResult(response, tabId, filename, downloadType) {
  showPanel('sc-design-result');

  var meta = document.getElementById('sc-design-meta');
  meta.textContent = 'Sampled ' + response.sampledElements + ' of ' + response.totalElements + ' elements from ' + (response.source ? response.source.url : 'unknown');

  var validationEl = document.getElementById('sc-design-validation');
  if (response.validation) {
    var v = response.validation;
    var html = '';
    if (v.isValid) {
      html += '<div class="sc-check sc-check-ok">✓ Validation passed</div>';
    } else {
      html += '<div class="sc-check sc-check-fail">✗ Validation: ' + v.errors.length + ' error(s)</div>';
    }
    for (var i = 0; i < v.warnings.length; i++) {
      html += '<div class="sc-check" style="color:#fbbf24">⚠ ' + v.warnings[i] + '</div>';
    }
    validationEl.innerHTML = html;
  }

  document.getElementById('sc-design-markdown').value = response.markdown || '';

  var downloadBtn = document.getElementById('sc-download-btn');
  downloadBtn.innerHTML = '<span class="sc-icon fa-solid fa-download"></span> Download ' + filename;
  downloadBtn.onclick = function () {
    chrome.runtime.sendMessage({
      type: downloadType,
      markdown: response.markdown,
      filename: filename
    });
  };

  document.getElementById('sc-back-btn').onclick = function () {
    startPopup(tabId);
  };
}

function showError(msg) {
  showPanel('sc-error');
  document.getElementById('sc-design-error').textContent = 'Extraction failed: ' + msg;
  document.getElementById('sc-error-back').onclick = function () {
    var backBtn = document.getElementById('sc-error-back');
    /* return to whichever panel makes sense */
    startPopup(currentTabId);
  };
}

var currentTabId = null;

/* ── Popup entry point ───────────────────────────────────────── */
function startPopup(tabId) {
  currentTabId = tabId;
  /* Try to script the page — if it works, show options; if not, fallback */
  chrome.scripting.executeScript({
    target: { tabId: tabId },
    func: function () { return document.title; }
  }).then(function () {
    /* Page can be scripted — show options */
    showPanel('sc-options');
    document.getElementById('sc-record-btn').onclick = function () {
      chrome.runtime.sendMessage({ type: 'scrollCaptureShowMainPanel', tabId: tabId }, function () {
        window.close();
      });
    };
    document.getElementById('sc-design-btn').onclick = function () {
      extractDesign(tabId);
    };
    document.getElementById('sc-skill-btn').onclick = function () {
      extractSkill(tabId);
    };
  }).catch(function () {
    /* Page cannot be scripted — show fallback */
    showPanel('sc-fallback');
    document.getElementById('sc-design-btn-fallback').onclick = function () {
      extractDesign(tabId);
    };
    document.getElementById('sc-skill-btn-fallback').onclick = function () {
      extractSkill(tabId);
    };
  });
}

/* ── Init ───────────────────────────────────────────────────── */
document.body.setAttribute('data-display', 'true');
applyTheme();

document.querySelector('button.close').addEventListener('click', function () {
  window.close();
});

var queryOptions = { active: true, lastFocusedWindow: true };
chrome.tabs.query(queryOptions).then(function (tabs) {
  if (tabs && tabs.length > 0) {
    startPopup(tabs[0].id);
  } else {
    showPanel('sc-fallback');
  }
});
