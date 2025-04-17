// Theme management
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
  // Apply saved theme or match system preference
  const saved = localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  applyTheme(saved);
  document.getElementById('theme-switch').addEventListener('change', toggleTheme);

  // Handle upload result
  const resultContainer = document.getElementById('result-container');
  const stored = localStorage.getItem('uploadResult');

  if (!stored) {
    resultContainer.innerHTML = `<p style="color: red;">❌ No upload result found.</p>`;
    return;
  }

  let result;
  try {
    result = JSON.parse(stored);
  } catch (err) {
    resultContainer.innerHTML = `<p style="color: red;">❌ Failed to parse upload result.</p>`;
    return;
  }

  const { originalName, thumbnails } = result;
  const html = `
    <h1>✅ Upload Successful</h1>
    <p><strong>Original File:</strong> ${originalName}</p>
    <div class="thumbnails">
      ${thumbnails
        .map(
          (thumb) => `
        <div class="thumbnail">
          <p>${thumb.size}px</p>
          <img src="${thumb.url}" alt="Thumbnail ${thumb.size}" />
        </div>
      `
        )
        .join('')}
    </div>
    <a href="https://storage-service-dot-thumbnail-app-acs-2025.ey.r.appspot.com/images">
      <button>Go to Image Gallery</button>
    </a>
  `;

  resultContainer.innerHTML = html;
});
