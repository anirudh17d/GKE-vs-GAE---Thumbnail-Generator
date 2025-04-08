const resultDiv = document.getElementById("results");
const data = JSON.parse(localStorage.getItem("uploadResult"));

if (data) {
  const original = document.createElement("p");
  original.innerHTML = `<strong>Original:</strong> ${data.originalName}`;
  resultDiv.appendChild(original);

  data.thumbnails.forEach((thumb) => {
    const container = document.createElement("div");
    container.classList.add("thumb-container");

    const label = document.createElement("p");
    label.textContent = `Size: ${thumb.size}px`;

    const image = document.createElement("img");
    image.src = thumb.url;
    image.alt = `Thumbnail ${thumb.size}`;
    image.width = thumb.size;

    container.appendChild(label);
    container.appendChild(image);
    resultDiv.appendChild(container);
  });
} else {
  resultDiv.innerHTML = "<p>No data found.</p>";
}
