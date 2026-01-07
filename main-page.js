function getProducts() {
  return JSON.parse(localStorage.getItem("products")) || [];
}

function saveProducts(products) {
  localStorage.setItem("products", JSON.stringify(products));
}

function getProductById(id) {
  const products = getProducts();
  return products.find((p) => p.id === id);
}

function deleteProduct(id) {
  let products = getProducts();
  products = products.filter((p) => p.id !== id);
  saveProducts(products);
}

function updateProduct(updated) {
  let products = getProducts();
  products = products.map((p) => (p.id === updated.id ? updated : p));
  saveProducts(products);
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}


document.addEventListener("DOMContentLoaded", () => {
  let imageData = null;
  let editId = null;
  let imageRemoved = false;
  const tbody = document.getElementById("productsBody");
  const form = document.getElementById("addNewForm");
  const modalEl = document.getElementById("addNewModal");
  const searchInput = document.getElementById("searchInput");
  const imageInput = document.getElementById("image");
  const imagePreview = document.getElementById("imagePreview");
  const removeImageBtn = document.getElementById("removeImageBtn");


  // preview при виборі файлу
  imageInput.addEventListener("change", async () => {
    const file = imageInput.files[0];
    if (file) {
      imageData = await fileToBase64(file);
      imagePreview.innerHTML = `<img src="${imageData}" width="50" style="object-fit: cover">`;
    }
  });

  // видалення фото
  removeImageBtn.addEventListener("click", () => {
    imageData = null;
    imageRemoved = true;
    imageInput.value = "";
    imagePreview.innerHTML = "";
  });

  const addProductBtn = document.getElementById("addProductBtn");
  addProductBtn.addEventListener("click", () => {
    form.reset();
    editId = null;
    imageData = null;
    imageRemoved = false;
    imagePreview.innerHTML = "";
    imageInput.value = "";
  });

  function refreshTable(filter = "") {
    tbody.innerHTML = "";
    const products = getProducts();

    products
      .filter((p) => p.name.toLowerCase().includes(filter.toLowerCase()))
      .forEach((p) => {
        const tr = document.createElement("tr");
        tr.dataset.id = p.id;
        tr.innerHTML = `
          <td><img src="${p.image || "img/placeholder.jpg"}" width="50"></td>
          <td>${p.name}</td>
          <td>${p.model}</td>
          <td>${p.category}</td>
          <td>${p.color}</td>
          <td>${p.price}</td>
          <td>${p.stock}</td>
          <td>
            <button class="edit-btn btn btn-sm btn-primary">Edit</button>
            <button class="delete-btn btn btn-sm btn-danger">Delete</button>
          </td>
        `;
        tbody.appendChild(tr);
      });

    updateTotalPrice();
  }

  // total price

  function updateTotalPrice() {
    const total = getProducts().reduce(
      (sum, p) => sum + Number(p.price) * Number(p.stock),
      0
    );
    document.getElementById("totalPrice").textContent = total;
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = form.customerName.value.trim();
    const model = form.modelName.value.trim();
    const category = form.product.value;
    const color = form.color.value.trim();
    const price = Number(form.price.value);
    const stock = Number(form.stock.value);

    const errors = [];
    const nameRegex = /^[A-Z][a-z]*( [a-zA-Z0-9]+)*$/;

    if (!name || !category || category === "Choose category" || !color || !model) {
      errors.push("Please fill all fields correctly");
    }
    if (!nameRegex.test(name))
      errors.push(
        "Name must start with capital letter and only letters/digits allowed"
      );
    if (isNaN(price) || price <= 0) errors.push("Price must be greater than 0");
    if (isNaN(stock) || stock < 0) errors.push("Stock must be 0 or more");

    if (errors.length > 0) {
      alert(errors.join("\n"));
      return;
    }

    const product = {
      id: editId || (Date.now() + Math.floor(Math.random() * 1000)).toString(),
      name,
      model,
      category,
      color,
      price,
      stock,
      image: imageData,
    };

    if (editId) {
      updateProduct(product);
      editId = null;
    } else {
      const products = getProducts();
      products.push(product);
      saveProducts(products);
    }

    refreshTable();
    form.reset();
    bootstrap.Modal.getInstance(modalEl).hide();
  });

  tbody.addEventListener("click", (e) => {
    const row = e.target.closest("tr");
    if (!row) return;
    const id = row.dataset.id;

    // delete

    if (e.target.classList.contains("delete-btn")) {
      const confirmed = confirm("Are you sure you want to delete this item?");
      e.target.blur();
      if (!confirmed) return;

      deleteProduct(id);
      refreshTable();
    }

    // edit

    if (e.target.classList.contains("edit-btn")) {
      const product = getProductById(id);
      editId = id;

      form.customerName.value = product.name;
      form.modelName.value = product.model;
      form.product.value = product.category;
      form.color.value = product.color;
      form.price.value = product.price;
      form.stock.value = product.stock;

      imageData = product.image || null;
      imagePreview.innerHTML = product.image
        ? `<img src="${product.image}" width="100" style="object-fit: cover">`
        : "";
      imageInput.value = "";

      const modal = new bootstrap.Modal(modalEl);
      modal.show();
    }
  });

  // search

  searchInput.addEventListener("input", () => {
    const filter = searchInput.value.trim();
    refreshTable(filter);
  });

  // sort

  window.sortProducts = (type) => {
    const products = getProducts();
    let sorted = [...products];

    switch (type) {
      case "name":
        sorted.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "category":
        sorted.sort((a, b) => a.category.localeCompare(b.category));
        break;
      case "price-asc":
        sorted.sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        sorted.sort((a, b) => b.price - a.price);
        break;
    }

    saveProducts(sorted);
    refreshTable(searchInput.value.trim());
  };

  refreshTable();
});
