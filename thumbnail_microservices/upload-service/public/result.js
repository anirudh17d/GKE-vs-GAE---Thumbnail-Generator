// 🌓 Theme logic
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

document.addEventListener('DOMContentLoaded', () => {
  const theme = localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  applyTheme(theme);
  document.getElementById('theme-switch').addEventListener('change', toggleTheme);

  // 🖼️ Load thumbnails
  const resultContainer = document.getElementById('result-container');
  const stored = localStorage.getItem('uploadResult');

  if (!stored) {
    resultContainer.innerHTML = `<p style="color: red;">❌ No upload result found.</p>`;
    return;
  }

  const result = JSON.parse(stored);
  const { thumbnails, originalName } = result;

  const gallery = thumbnails
    .map((thumb, index) => {
      return `
      <div class="thumbnail">
        <p>${thumb.size}px</p>
        <img src="data:image/jpeg;base64,${thumb.buffer}" alt="${thumb.filename}" />
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

async function uploadToStorage(index) {
  const result = JSON.parse(localStorage.getItem('uploadResult'));
  const selected = result.thumbnails[index];

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
    window.location.href = 'https://storage-service-dot-thumbnail-app-acs-2025.ey.r.appspot.com/images';
  } catch (err) {
    alert('❌ Upload to storage failed.');
    console.error(err);
  }
}
