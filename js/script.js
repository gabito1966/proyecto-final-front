const url = 'http://localhost:8080/products';

document.addEventListener("DOMContentLoaded", () => {
  cargarTodosLosProductos();
});

// Función principal para cargar todos los productos
function cargarTodosLosProductos() {
  mostrarLoader(true);

  fetch(url)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Error en la API: ${response.statusText}`);
      }
      return response.json();
    })
    .then((products) => {
      mostrarLoader(false);
      if (products && products.length > 0) {
        renderizarProductos(products);
      } else {
        mostrarMensajeSinProductos();
      }
    })
    .catch((error) => {
      mostrarLoader(false);
      mostrarError(error);
    });
}

// Renderizar todos los productos en el DOM
function renderizarProductos(products) {
  const contenedor = document.getElementById('productos-container');
  contenedor.innerHTML = '';

  products.forEach(product => {
    const productCard = crearCardProducto(product);
    contenedor.appendChild(productCard);
  });
}

// Crear el elemento HTML para cada producto
function crearCardProducto(product) {
  const card = document.createElement('div');
  card.className = 'card product-card';
  card.style.width = '18rem';
  card.id = `product-${product.id}`;

  const imageUrl = `http://localhost:8080/${product.image}`;

  card.innerHTML = `
    <img src="${imageUrl}" class="card-img-top product-image" alt="${product.name}">
    <div class="card-body">
      <h5 class="card-title product-name">${product.name}</h5>
      <p class="card-text product-desc">${product.description}</p>
      <div class="product-info">
        <p><strong>Precio:</strong> $<span class="product-price">${product.price}</span></p>
        <p><strong>Stock:</strong> <span class="product-stock">${product.stock}</span></p>
      </div>
      
      <div class="product-actions mt-3">
        <button class="btn btn-danger btn-sm btn-eliminar" onclick="eliminarProducto(${product.id})">
          <i class="bi bi-trash"></i> Eliminar
        </button>
        <button class="btn btn-success btn-sm btn-editar" onclick="mostrarFormularioEdicion(${product.id})">
          <i class="bi bi-pencil"></i> Editar
        </button>
      </div>
      
      <div class="edit-form-container" id="edit-form-${product.id}" style="display: none;">
        <form id="edit-form-${product.id}-form" onsubmit="return false;">
          <div class="mb-3">
            <label for="edit-image-${product.id}" class="form-label">Imagen</label>
            <input type="file" class="form-control" id="edit-image-${product.id}">
          </div>
          <div class="mb-3">
            <label for="edit-name-${product.id}" class="form-label">Nombre</label>
            <input type="text" class="form-control" id="edit-name-${product.id}" value="${product.name}" required>
          </div>
          <div class="mb-3">
            <label for="edit-desc-${product.id}" class="form-label">Descripción</label>
            <textarea class="form-control" id="edit-desc-${product.id}" rows="2" required>${product.description}</textarea>
          </div>
          <div class="row">
            <div class="col-md-6 mb-3">
              <label for="edit-price-${product.id}" class="form-label">Precio</label>
              <input type="number" step="0.01" class="form-control" id="edit-price-${product.id}" value="${product.price}" required>
            </div>
            <div class="col-md-6 mb-3">
              <label for="edit-stock-${product.id}" class="form-label">Stock</label>
              <input type="number" class="form-control" id="edit-stock-${product.id}" value="${product.stock}" required>
            </div>
          </div>
          
          <div class="d-flex justify-content-between gap-2">
            <button type="button" class="btn btn-success btn-sm" onclick="actualizarProducto(${product.id})">
              <i class="bi bi-check"></i> Guardar
            </button>
            <button type="button" class="btn btn-danger btn-sm" onclick="ocultarFormularioEdicion(${product.id})">
              <i class="bi bi-x"></i> Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  `;

  return card;
}

// Función para eliminar un producto
window.eliminarProducto = async function (id) {
  if (!confirm('¿Estás seguro de que deseas eliminar este producto?')) {
    return;
  }

  try {
    mostrarLoader(true, `product-${id}`);

    const response = await fetch(`${url}/${id}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      throw new Error('Error al eliminar el producto');
    }

    // Eliminar visualmente el producto
    document.getElementById(`product-${id}`).remove();

    // Mostrar mensaje de éxito
    mostrarToast('Producto eliminado correctamente', 'success');

  } catch (error) {
    console.error('Error:', error);
    mostrarToast('Error al eliminar el producto', 'danger');
  } finally {
    mostrarLoader(false, `product-${id}`);
  }
};

// Función para mostrar el formulario de edición
window.mostrarFormularioEdicion = function (id) {
  // Ocultar todos los formularios primero
  document.querySelectorAll('.edit-form-container').forEach(form => {
    form.style.display = 'none';
  });

  // Mostrar el formulario específico
  const formContainer = document.getElementById(`edit-form-${id}`);
  formContainer.style.display = 'block';

  // Desplazarse al formulario para mejor experiencia de usuario
  formContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
};

// Función para ocultar el formulario de edición
window.ocultarFormularioEdicion = function (id) {
  document.getElementById(`edit-form-${id}`).style.display = 'none';
};

// Función para actualizar un producto
window.actualizarProducto = async function (id) {
  try {
    mostrarLoader(true, `product-${id}`);

    // Obtener los datos del formulario de edición
    const updatedProduct = {
      name: document.getElementById(`edit-name-${id}`).value,
      description: document.getElementById(`edit-desc-${id}`).value,
      price: parseFloat(document.getElementById(`edit-price-${id}`).value),
      stock: parseInt(document.getElementById(`edit-stock-${id}`).value),
      image: document.getElementById(`edit-image-${id}`).files[0]
    };

    const formData = new FormData();
    formData.append('name', updatedProduct.name);
    formData.append('description', updatedProduct.description);
    formData.append('price', updatedProduct.price);
    formData.append('stock', updatedProduct.stock);

    if (updatedProduct.image) {
      formData.append('image', updatedProduct.image);
    }

    const response = await fetch(`${url}/${id}`, {
      method: 'PUT',
      body: formData
    });

    if (!response.ok) {
      throw new Error('Error al actualizar el producto');
    }

    const data = await response.json();

    // Actualizar la tarjeta del producto con los nuevos datos, incluyendo la imagen
    actualizarCardProducto(id, data);

    // Ocultar el formulario de edición
    ocultarFormularioEdicion(id);

    // Mostrar mensaje de éxito
    mostrarToast('Producto actualizado correctamente', 'success');

  } catch (error) {
    console.error('Error:', error);
    mostrarToast('Error al actualizar el producto', 'danger');
  } finally {
    mostrarLoader(false, `product-${id}`);
  }
};

// Función para actualizar la tarjeta del producto después de editar
function actualizarCardProducto(id, productData) {
  const card = document.getElementById(`product-${id}`);
  if (card) {
    card.querySelector('.product-name').textContent = productData.name;
    card.querySelector('.product-desc').textContent = productData.description;
    card.querySelector('.product-price').textContent = productData.price;
    card.querySelector('.product-stock').textContent = productData.stock;

    // Actualizar la imagen
    const imageUrl = `http://localhost:8080/images/${productData.image}`;
    card.querySelector('.product-image').setAttribute('src', imageUrl);
  }
}

// Función para crear un nuevo producto
window.createProduct = async function (event) {
  event.preventDefault(); // Evitar que el formulario se envíe de forma tradicional

  const newProduct = {
    name: document.getElementById('name').value,
    description: document.getElementById('description').value,
    price: parseFloat(document.getElementById('price').value),
    stock: parseInt(document.getElementById('stock').value),
    image: document.getElementById('image').files[0],
  };

  const formData = new FormData();
  formData.append('name', newProduct.name);
  formData.append('description', newProduct.description);
  formData.append('price', newProduct.price);
  formData.append('stock', newProduct.stock);

  if (newProduct.image) {
    formData.append('image', newProduct.image);
  }

  try {
    mostrarLoader(true);

    const response = await fetch(url, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error('Error al crear el producto');
    }

    const product = await response.json();

    // Renderizar el nuevo producto
    const contenedor = document.getElementById('productos-container');
    const newProductCard = crearCardProducto(product);
    contenedor.appendChild(newProductCard);

    // Limpiar el formulario
    document.getElementById('create-product-form').reset();

    // Mostrar mensaje de éxito
    mostrarToast('Producto creado correctamente', 'success');

  } catch (error) {
    console.error('Error:', error);
    mostrarToast('Error al crear el producto', 'danger');
  } finally {
    mostrarLoader(false);
  }
};

// Añadir el event listener al formulario de creación de producto
document.getElementById('create-product-form').addEventListener('submit', createProduct);

// Función para mostrar el formulario de creación de producto
function mostrarFormularioCreacion() {
  const formContainer = document.getElementById('form-create-product');
  formContainer.style.display = formContainer.style.display === 'none' ? 'block' : 'none';
}

// Funciones auxiliares para UI
function mostrarLoader(mostrar, elementoId = null) {
  if (elementoId) {
    const elemento = document.getElementById(elementoId);
    if (elemento) {
      if (mostrar) {
        elemento.classList.add('loading');
      } else {
        elemento.classList.remove('loading');
      }
    }
  } else {
    const loader = document.getElementById('loading-overlay');
    if (loader) {
      loader.style.display = mostrar ? 'flex' : 'none';
    }
  }
}

function mostrarToast(mensaje, tipo = 'info') {
  const toastContainer = document.getElementById('toast-container') || crearToastContainer();
  const toast = document.createElement('div');
  toast.className = `toast show align-items-center text-white bg-${tipo}`;
  toast.innerHTML = `
    <div class="d-flex">
      <div class="toast-body">${mensaje}</div>
      <button type="button" class="btn-close btn-close-white me-2 m-auto" onclick="this.parentElement.parentElement.remove()"></button>
    </div>
  `;
  toastContainer.appendChild(toast);

  setTimeout(() => toast.remove(), 5000);
}

function crearToastContainer() {
  const container = document.createElement('div');
  container.id = 'toast-container';
  container.style.position = 'fixed';
  container.style.top = '20px';
  container.style.right = '20px';
  container.style.zIndex = '1100';
  document.body.appendChild(container);
  return container;
}

function mostrarMensajeSinProductos() {
  const contenedor = document.getElementById('productos-container');
  contenedor.innerHTML = `
    <div class="col-12 text-center py-5">
      <i class="bi bi-exclamation-circle fs-1 text-muted"></i>
      <h3 class="text-muted mt-3">No se encontraron productos</h3>
    </div>
  `;
}

function mostrarError(error) {
  const contenedor = document.getElementById('productos-container');
  contenedor.innerHTML = `
    <div class="col-12 text-center py-5">
      <i class="bi bi-x-circle fs-1 text-danger"></i>
      <h3 class="text-danger mt-3">Error al cargar productos</h3>
      <p class="text-muted">${error.message}</p>
      <button class="btn btn-primary mt-3" onclick="cargarTodosLosProductos()">
        <i class="bi bi-arrow-repeat"></i> Intentar nuevamente
      </button>
    </div>
  `;
}
