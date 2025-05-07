document.addEventListener('DOMContentLoaded', () => {
  const theme = localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  applyTheme(theme);
  document.getElementById('theme-switch').addEventListener('change', toggleTheme);

  const resultContainer = document.getElementById('result-container');
  const stored = localStorage.getItem('uploadResult');

  if (!stored) {
    resultContainer.innerHTML = `
      <p style="color: red;">❌ No upload result found.</p>
      <button onclick="goBack()">⬅️ Back to Upload</button>
    `;
    return;
  }

  let result;
  try {
    result = JSON.parse(stored);
  } catch (e) {
    resultContainer.innerHTML = `
      <p style="color: red;">❌ Failed to parse upload result.</p>
      <button onclick="goBack()">⬅️ Back to Upload</button>
    `;
    console.error("Parsing error:", e);
    return;
  }

  const { thumbnails, originalName } = result;

  if (!Array.isArray(thumbnails)) {
    resultContainer.innerHTML = `
      <p style="color: red;">❌ No thumbnails returned from the service.</p>
      <button onclick="retry()">🔁 Retry Upload</button>
    `;
    console.error("Missing or invalid thumbnails in result:", result);
    return;
  }

  const gallery = thumbnails
    .map((thumb, index) => {
      const hasBuffer = thumb.buffer && thumb.buffer.length > 100;
      const imgTag = hasBuffer
        ? `<img src="data:image/jpeg;base64,${thumb.buffer}" alt="${thumb.filename}" />`
        : `<div class="broken-img">❌ Failed: ${thumb.filename}</div>`;

      return `
        <div class="thumbnail">
          <p>${thumb.size}px</p>
          ${imgTag}
          <button onclick="uploadToStorage(${index})">Use This Image</button>
        </div>
      `;
    })
    .join('');

  resultContainer.innerHTML = `
    <h1>✅ Choose a Thumbnail</h1>
    <p><strong>Original:</strong> ${originalName}</p>
    <div class="thumbnails">${gallery}</div>
  `;
});

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  document.getElementById('theme-switch').checked = theme === 'dark';
}

function toggleTheme() {
  const isDark = document.getElementById('theme-switch').checked;
  const newTheme = isDark ? 'dark' : 'light';
  localStorage.setItem('theme', newTheme);
  applyTheme(newTheme);
}

function goBack() {
  window.location.href = "/";
}

function retry() {
  const result = localStorage.getItem('uploadResult');
  if (!result) return goBack();
  localStorage.setItem('retryUpload', result);
  window.location.href = "/";
}

async function uploadToStorage(index) {
  const result = JSON.parse(localStorage.getItem('uploadResult'));
  const selected = result.thumbnails[index];

  if (!selected || !selected.buffer) {
    alert('❌ Image data missing. Cannot upload.');
    return;
  }

  try {
    await fetch('https://storage-service-dot-thumbnail-app-acs-2025.ey.r.appspot.com/store', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        buffer: selected.buffer,
        filename: selected.filename,
        user: selected.user
      })
    });

    localStorage.removeItem('uploadResult');
    window.location.href = 'https://storage-service-dot-thumbnail-app-acs-2025.ey.r.appspot.com/images';
  } catch (err) {
    alert('❌ Upload to storage failed.');
    console.error(err);
  }
}
