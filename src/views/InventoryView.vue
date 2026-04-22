<template>
  <div class="inventory-page">

    <!-- ── Header ── -->
    <div class="page-header">
      <div>
        <div class="page-title">Products & Inventory</div>
        <div class="page-sub">Manage all your branding inventory items</div>
      </div>
      <div class="header-btns">
        <button class="btn-scan" @click="openScanner">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
            <path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/>
            <path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/>
            <line x1="7" y1="12" x2="17" y2="12"/>
          </svg>
          Scan QR
        </button>
        <button class="btn-add" @click="openModal()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="14" height="14">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Add Product
        </button>
      </div>
    </div>

    <!-- ── Search + Filter bar ── -->
    <div class="toolbar">
      <div class="search-wrap">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input
          class="search-input"
          type="text"
          placeholder="Search by name or SKU…"
          v-model="searchQuery"
        />
      </div>
      <div class="filter-pills">
        <div
          class="pill"
          :class="{ active: filterCategory === 'all' }"
          @click="filterCategory = 'all'"
        >All</div>
        <div
          class="pill"
          v-for="cat in categories"
          :key="cat.id"
          :class="{ active: filterCategory === cat.name }"
          @click="filterCategory = cat.name"
        >{{ cat.name }}</div>
      </div>
    </div>

    <!-- ── Stats row ── -->
    <div class="stats-row">
      <!-- Warehouse stats -->
      <div class="stats-group">
        <div class="stats-group-label">
          <i class="bi bi-building"></i> Warehouse
        </div>
        <div class="stats-inner">
          <div class="stat-chip">
            <span class="stat-chip-label">Total Stock</span>
            <span class="stat-chip-val">{{ totalStock.toLocaleString() }}</span>
          </div>
          <div class="stat-chip stat-chip-warn" v-if="lowStockItems.length">
            <span class="stat-chip-label">Low Stock</span>
            <span class="stat-chip-val">{{ lowStockItems.length }}</span>
          </div>
          <div class="stat-chip stat-chip-danger" v-if="outOfStock.length">
            <span class="stat-chip-label">Out of Stock</span>
            <span class="stat-chip-val">{{ outOfStock.length }}</span>
          </div>
        </div>
      </div>

      <div class="stats-divider"></div>

      <!-- Room 1 stats -->
      <div class="stats-group">
        <div class="stats-group-label stats-group-label-r1">
          <i class="bi bi-door-open"></i> Room 1
        </div>
        <div class="stats-inner">
          <div class="stat-chip stat-chip-r1">
            <span class="stat-chip-label">Total Stock</span>
            <span class="stat-chip-val">{{ totalRoom1Stock.toLocaleString() }}</span>
          </div>
          <div class="stat-chip stat-chip-warn" v-if="room1LowStock.length">
            <span class="stat-chip-label">Low Stock</span>
            <span class="stat-chip-val">{{ room1LowStock.length }}</span>
          </div>
          <div class="stat-chip stat-chip-danger" v-if="room1OutOfStock.length">
            <span class="stat-chip-label">Empty</span>
            <span class="stat-chip-val">{{ room1OutOfStock.length }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- ── Loading ── -->
    <div class="loading-state" v-if="loading">
      <div class="spinner-lg"></div>
      <span>Loading inventory…</span>
    </div>

    <!-- ── Empty state ── -->
    <div class="empty-state" v-else-if="filtered.length === 0 && !loading">
      <i class="bi bi-box-seam empty-bi"></i>
      <div class="empty-title">No products found</div>
      <div class="empty-sub">{{ searchQuery ? 'Try a different search term.' : 'Add your first product to get started.' }}</div>
      <button class="btn-add" @click="openModal()" v-if="!searchQuery">+ Add Product</button>
    </div>

    <!-- ── Table ── -->
    <div class="table-wrap" v-else>
      <table class="inv-table">
        <thead>
          <tr>
            <th>Product</th>
            <th>SKU</th>
            <th>Category</th>
            <th>
              <div class="th-loc">
                <i class="bi bi-building"></i> Warehouse
              </div>
            </th>
            <th>
              <div class="th-loc th-loc-room1">
                <i class="bi bi-door-open"></i> Room 1
              </div>
            </th>
            <th>Unit Price</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="product in filtered"
            :key="product.id"
            class="table-row"
            :class="{ 'row-low': product.stock <= product.reorder_at && product.stock > 0, 'row-out': product.stock === 0 }"
          >
            <td>
              <div class="product-name">{{ product.name }}</div>
            </td>
            <td><span class="sku-badge">{{ product.sku }}</span></td>
            <td><span class="cat-badge">{{ product.category }}</span></td>
            <!-- Warehouse stock -->
            <td>
              <div class="stock-cell">
                <span class="stock-num" :class="{ 'stock-low': product.stock <= product.reorder_at, 'stock-out': product.stock === 0 }">
                  {{ product.stock }}
                </span>
                <span class="stock-unit">{{ product.unit }}</span>
              </div>
              <div class="reorder-hint" v-if="product.stock <= product.reorder_at && product.stock > 0">reorder at {{ product.reorder_at }}</div>
            </td>

            <!-- Room 1 stock -->
            <td>
              <div class="room1-cell">
                <div class="stock-cell">
                  <span class="stock-num room1-num" :class="{ 'stock-low': (product.room1_stock||0) <= (product.room1_reorder_at??2) && (product.room1_stock||0) > 0, 'stock-out': (product.room1_stock||0) === 0 }">
                    {{ product.room1_stock || 0 }}
                  </span>
                  <span class="stock-unit">{{ product.unit }}</span>
                </div>
                <button class="btn-transfer" @click.stop="openTransfer(product)" title="Transfer stock">
                  <i class="bi bi-arrow-left-right"></i>
                </button>
              </div>
              <div class="reorder-hint room1-hint" v-if="(product.room1_stock||0) <= (product.room1_reorder_at??2)">
                {{ (product.room1_stock||0) === 0 ? 'Empty — restock!' : `low — restock from warehouse` }}
              </div>
            </td>

            <td class="price-cell">₱{{ Number(product.price).toLocaleString() }}</td>
            <td>
              <div class="status-col">
                <span class="status-badge" :class="stockStatus(product).cls">
                  {{ stockStatus(product).label }}
                </span>
                <span class="status-badge room1-badge" :class="room1Status(product).cls" title="Room 1">
                  <i class="bi bi-door-open" style="font-size:9px;"></i> {{ room1Status(product).label }}
                </span>
              </div>
            </td>
            <td>
              <div class="action-btns">
                <button class="btn-icon" @click="openModal(product)" title="Edit">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                </button>
                <button class="btn-icon btn-icon-del" @click="confirmDelete(product)" title="Delete">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13">
                    <polyline points="3 6 5 6 21 6"/>
                    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                    <path d="M10 11v6M14 11v6"/>
                    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                  </svg>
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- ══ ADD / EDIT MODAL ══ -->
    <Teleport to="body"><Transition name="modal-fade">
      <div class="modal-overlay" v-if="showModal" @click.self="closeModal">
        <div class="modal">

          <div class="modal-header">
            <div class="modal-title">{{ editing ? 'Edit Product' : 'Add New Product' }}</div>
            <button class="modal-close" @click="closeModal">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="16" height="16">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          <div class="modal-body">

            <!-- Name -->
            <div class="form-field">
              <label class="form-label">Product Name <span class="req">*</span></label>
              <input class="form-input" type="text" v-model="form.name" placeholder="e.g. Tarpaulin Banner 4x8" />
              <div class="form-error" v-if="errors.name">{{ errors.name }}</div>
            </div>

            <!-- SKU + Category row -->
            <div class="form-row">
              <div class="form-field">
                <label class="form-label">SKU <span class="req">*</span></label>
                <input class="form-input" type="text" v-model="form.sku" placeholder="e.g. TAR-001" />
                <div class="form-error" v-if="errors.sku">{{ errors.sku }}</div>
              </div>
              <div class="form-field">
                <label class="form-label">Category <span class="req">*</span></label>
                <select class="form-input form-select" v-model="form.category">
                  <option value="" disabled>Select category</option>
                  <option v-for="cat in categories" :key="cat.id" :value="cat.name">{{ cat.name }}</option>
                </select>
                <div class="form-error" v-if="errors.category">{{ errors.category }}</div>
              </div>
            </div>

            <!-- Stock + Unit row -->
            <div class="form-row">
              <div class="form-field">
                <label class="form-label">Stock Quantity <span class="req">*</span></label>
                <input class="form-input" type="number" v-model.number="form.stock" placeholder="0" min="0" />
                <div class="form-error" v-if="errors.stock">{{ errors.stock }}</div>
              </div>
              <div class="form-field">
                <label class="form-label">Unit</label>
                <select class="form-input form-select" v-model="form.unit">
                  <option value="pcs">pcs</option>
                  <option value="roll">roll</option>
                  <option value="set">set</option>
                  <option value="box">box</option>
                  <option value="pack">pack</option>
                </select>
              </div>
            </div>

            <!-- Price + Reorder row -->
            <div class="form-row">
              <div class="form-field">
                <label class="form-label">Unit Price (₱) <span class="req">*</span></label>
                <input class="form-input" type="number" v-model.number="form.price" placeholder="0.00" min="0" step="0.01" />
                <div class="form-error" v-if="errors.price">{{ errors.price }}</div>
              </div>
              <div class="form-field">
                <label class="form-label">Warehouse Reorder At</label>
                <input class="form-input" type="number" v-model.number="form.reorder_at" placeholder="10" min="0" />
                <div class="form-hint">Alert when warehouse stock drops here</div>
              </div>
            </div>

            <!-- Room 1 stock row -->
            <div class="form-section-divider">
              <i class="bi bi-door-open"></i> Room 1 Settings
            </div>
            <div class="form-row">
              <div class="form-field">
                <label class="form-label">Room 1 Stock</label>
                <input class="form-input" type="number" v-model.number="form.room1_stock" placeholder="0" min="0" />
                <div class="form-hint">Current display stock in Room 1</div>
              </div>
              <div class="form-field">
                <label class="form-label">Room 1 Reorder At</label>
                <input class="form-input" type="number" v-model.number="form.room1_reorder_at" placeholder="1" min="0" />
                <div class="form-hint">Alert when Room 1 drops to this (e.g. 1 box)</div>
              </div>
            </div>

          </div>

          <div class="modal-footer">
            <button class="btn-cancel" @click="closeModal" :disabled="saving">Cancel</button>
            <button class="btn-save" @click="save" :disabled="saving">
              <div class="spinner-sm" v-if="saving"></div>
              <span v-else>{{ editing ? 'Save Changes' : 'Add Product' }}</span>
            </button>
          </div>

        </div>
      </div>
    </Transition></Teleport>

    <!-- ══ DELETE CONFIRM ══ -->
    <Teleport to="body"><Transition name="modal-fade">
      <div class="modal-overlay" v-if="deleteTarget" @click.self="deleteTarget = null">
        <div class="modal modal-sm">
          <div class="modal-header">
            <div class="modal-title">Delete Product</div>
            <button class="modal-close" @click="deleteTarget = null">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="16" height="16">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
          <div class="modal-body">
            <div class="delete-text">
              Are you sure you want to delete <strong>"{{ deleteTarget?.name }}"</strong>?
              This cannot be undone.
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-cancel" @click="deleteTarget = null">Cancel</button>
            <button class="btn-delete" @click="doDelete">Yes, Delete</button>
          </div>
        </div>
      </div>
    </Transition></Teleport>

    <!-- ── Toast ── -->
    <Teleport to="body"><Transition name="toast">
      <div class="toast" v-if="toast.show" :class="'toast-' + toast.type">
        {{ toast.message }}
      </div>
    </Transition></Teleport>

    <!-- ══ TRANSFER MODAL ══ -->
    <Teleport to="body"><Transition name="modal-fade">
      <div class="modal-overlay" v-if="showTransfer" @click.self="closeTransfer">
        <div class="modal">
          <div class="modal-header">
            <div class="modal-title">
              <i class="bi bi-arrow-left-right" style="color:#B01020;margin-right:6px;"></i>
              Transfer Stock
            </div>
            <button class="modal-close" @click="closeTransfer">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="16" height="16"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
          <div class="modal-body" v-if="transferProduct">

            <!-- Product info -->
            <div class="transfer-product-info">
              <div class="tpi-name">{{ transferProduct.name }}</div>
              <div class="tpi-sku">{{ transferProduct.sku }}</div>
            </div>

            <!-- Stock levels -->
            <div class="transfer-stocks">
              <div class="ts-loc" :class="{ 'ts-active': transferDir === 'toRoom1' }">
                <div class="ts-icon"><i class="bi bi-building"></i></div>
                <div class="ts-label">Warehouse</div>
                <div class="ts-val" :class="{ 'stock-low': transferProduct.stock <= transferProduct.reorder_at }">
                  {{ transferProduct.stock }} {{ transferProduct.unit }}
                </div>
              </div>
              <div class="ts-arrow" @click="transferDir = transferDir === 'toRoom1' ? 'toWarehouse' : 'toRoom1'">
                <i :class="transferDir === 'toRoom1' ? 'bi bi-arrow-right-circle-fill' : 'bi bi-arrow-left-circle-fill'"></i>
                <div class="ts-arrow-label">click to flip</div>
              </div>
              <div class="ts-loc" :class="{ 'ts-active': transferDir === 'toWarehouse' }">
                <div class="ts-icon"><i class="bi bi-door-open"></i></div>
                <div class="ts-label">Room 1</div>
                <div class="ts-val" :class="{ 'stock-low': (transferProduct.room1_stock||0) <= (transferProduct.room1_reorder_at??2) }">
                  {{ transferProduct.room1_stock || 0 }} {{ transferProduct.unit }}
                </div>
              </div>
            </div>

            <!-- Direction label -->
            <div class="transfer-direction">
              <span v-if="transferDir === 'toRoom1'">
                Moving from <strong>Warehouse → Room 1</strong>
              </span>
              <span v-else>
                Moving from <strong>Room 1 → Warehouse</strong>
              </span>
            </div>

            <!-- Qty input -->
            <div class="form-field">
              <label class="form-label">Quantity to Transfer <span class="req">*</span></label>
              <div class="qty-row">
                <button class="qty-btn" @click="transferQty = Math.max(1, transferQty - 1)">−</button>
                <input class="form-input qty-input" type="number" v-model.number="transferQty" min="1"
                  :max="transferDir === 'toRoom1' ? transferProduct.stock : (transferProduct.room1_stock||0)" />
                <button class="qty-btn" @click="transferQty++">+</button>
              </div>
              <div class="transfer-preview" v-if="transferQty > 0">
                <template v-if="transferDir === 'toRoom1'">
                  Warehouse: {{ transferProduct.stock }} → <strong>{{ transferProduct.stock - transferQty }}</strong>
                  &nbsp;|&nbsp;
                  Room 1: {{ transferProduct.room1_stock || 0 }} → <strong>{{ (transferProduct.room1_stock||0) + transferQty }}</strong>
                </template>
                <template v-else>
                  Room 1: {{ transferProduct.room1_stock||0 }} → <strong>{{ (transferProduct.room1_stock||0) - transferQty }}</strong>
                  &nbsp;|&nbsp;
                  Warehouse: {{ transferProduct.stock }} → <strong>{{ transferProduct.stock + transferQty }}</strong>
                </template>
              </div>
              <div class="form-error" v-if="transferError">{{ transferError }}</div>
            </div>

            <!-- Notes -->
            <div class="form-field">
              <label class="form-label">Notes (optional)</label>
              <input class="form-input" v-model="transferNotes" placeholder="Reason for transfer…" maxlength="100" />
            </div>

          </div>
          <div class="modal-footer">
            <button class="btn-cancel" @click="closeTransfer" :disabled="transferring">Cancel</button>
            <button class="btn-save" @click="doTransfer" :disabled="transferring || transferQty < 1">
              <div class="spinner-sm" v-if="transferring"></div>
              <span v-else>
                <i class="bi bi-arrow-left-right"></i>
                Transfer {{ transferQty }} {{ transferProduct?.unit }}
              </span>
            </button>
          </div>
        </div>
      </div>
    </Transition></Teleport>

    <!-- ══ QR SCANNER MODAL ══ -->
    <Teleport to="body"><Transition name="modal-fade">
      <div class="modal-overlay" v-if="showScanner" @click.self="closeScanner">
        <div class="modal scanner-modal">

          <div class="modal-header">
            <div class="modal-title">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
                <path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/>
                <path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/>
                <line x1="7" y1="12" x2="17" y2="12"/>
              </svg>
              Scan QR / Barcode
            </div>
            <button class="modal-close" @click="closeScanner">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="16" height="16">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          <!-- Step 1: Scanning -->
          <div class="scanner-body" v-if="scanStep === 'scanning'">
            <div class="scan-hint">Point your camera at a product QR code or barcode</div>
            <div class="scan-viewport-wrap" :class="{ detected: invQrDetected }">
              <div id="qr-reader" ref="qrReaderEl"></div>
              <canvas ref="invBboxCanvas" class="bbox-canvas-inv"></canvas>
              <div class="scan-overlay">
                <div class="tracker-box">
                  <div class="scan-corner tl"></div>
                  <div class="scan-corner tr"></div>
                  <div class="scan-corner bl"></div>
                  <div class="scan-corner br"></div>
                  <div class="scan-line" :class="{ scanning: scannerActive && !invQrDetected }"></div>
                  <div class="tk-flash-inv" :class="{ show: invQrDetected }"></div>
                  <div class="tk-dot-inv" :class="{ pulse: scannerActive }"></div>
                </div>
                <button class="torch-btn-inv" @click="toggleInvTorch" :class="{ on: invTorchOn }" v-if="scannerActive" title="Toggle flashlight">
                  <i :class="invTorchOn ? 'bi bi-lightning-fill' : 'bi bi-lightning'"></i>
                </button>
              </div>
            </div>
            <div class="inv-detect-bar" :class="{ 'bar-found': invQrDetected, 'bar-scanning': scannerActive && !invQrDetected }">
              <div class="bar-icon-inv">
                <i v-if="invQrDetected" class="bi bi-check-circle-fill" style="color:#16A34A"></i>
                <div v-else-if="scannerActive" class="inv-bar-spinner"></div>
                <i v-else class="bi bi-camera-video-off" style="color:#9A8589"></i>
              </div>
              <span v-if="invQrDetected">QR Detected! Processing…</span>
              <span v-else-if="scannerActive">Scanning… hold QR code 10–20cm from camera</span>
              <span v-else>Camera initializing…</span>
            </div>
            <div class="scan-status status-loading" v-if="scanStatus.type === 'loading'">
              <div class="scan-spinner"></div>
              {{ scanStatus.msg }}
            </div>
            <div class="scan-status" :class="'status-' + scanStatus.type" v-else-if="scanStatus.msg">
              {{ scanStatus.msg }}
            </div>
            <!-- Manual SKU fallback -->
            <div class="manual-entry">
              <div class="manual-label">Or enter SKU manually</div>
              <div class="manual-row">
                <input class="form-input manual-input" v-model="manualSku" placeholder="e.g. SLU-TAR-001" @keydown.enter="processManualSku" />
                <button class="btn-manual" @click="processManualSku" :disabled="!manualSku.trim()">Look Up</button>
              </div>
            </div>
          </div>

          <!-- Step 2: Found existing product → add stock -->
          <div class="scanner-body" v-if="scanStep === 'add-stock'">
            <div class="found-banner found-existing">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
              Product found in inventory
            </div>
            <div class="found-product">
              <div class="fp-name">{{ scannedProduct.name }}</div>
              <div class="fp-meta">
                <span class="fp-sku">{{ scannedProduct.sku }}</span>
                <span>{{ scannedProduct.category }}</span>
              </div>
              <div class="fp-stock">
                Current stock: <strong :class="scannedProduct.stock === 0 ? 'text-red' : 'text-green'">
                  {{ scannedProduct.stock }} {{ scannedProduct.unit || 'pcs' }}
                </strong>
              </div>
            </div>
            <div class="form-field">
              <label class="form-label">Add to Stock</label>
              <div class="qty-row">
                <button class="qty-btn" @click="stockQty = Math.max(1, stockQty - 1)">−</button>
                <input class="form-input qty-input" type="number" v-model.number="stockQty" min="1" />
                <button class="qty-btn" @click="stockQty++">+</button>
              </div>
              <div class="qty-preview">
                New total: <strong>{{ scannedProduct.stock + stockQty }} {{ scannedProduct.unit || 'pcs' }}</strong>
              </div>
            </div>
            <div class="scanner-footer">
              <button class="btn-cancel" @click="resetScanner">← Scan Again</button>
              <button class="btn-save" @click="doAddStock" :disabled="saving">
                <div class="spinner-sm" v-if="saving"></div>
                <span v-else>Add Stock</span>
              </button>
            </div>
          </div>

          <!-- Step 3: New product → pre-fill add form -->
          <div class="scanner-body" v-if="scanStep === 'new-product'">
            <div class="found-banner found-new">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              SKU not found — add as new product
            </div>
            <div class="scanned-sku-box">
              Scanned SKU: <code>{{ scannedData.sku }}</code>
            </div>
            <div class="form-field">
              <label class="form-label">Product Name <span class="req">*</span></label>
              <input class="form-input" v-model="newForm.name" :placeholder="scannedData.name || 'Enter product name'" />
            </div>
            <div class="form-row">
              <div class="form-field">
                <label class="form-label">SKU</label>
                <input class="form-input" v-model="newForm.sku" />
              </div>
              <div class="form-field">
                <label class="form-label">Category <span class="req">*</span></label>
                <select class="form-input form-select" v-model="newForm.category">
                  <option value="" disabled>Select…</option>
                  <option v-for="cat in categories" :key="cat.id" :value="cat.name">{{ cat.name }}</option>
                </select>
              </div>
            </div>
            <div class="form-row">
              <div class="form-field">
                <label class="form-label">Stock Qty <span class="req">*</span></label>
                <input class="form-input" type="number" v-model.number="newForm.stock" min="0" />
              </div>
              <div class="form-field">
                <label class="form-label">Unit</label>
                <select class="form-input form-select" v-model="newForm.unit">
                  <option>pcs</option><option>roll</option><option>set</option><option>box</option><option>pack</option>
                </select>
              </div>
            </div>
            <div class="form-row">
              <div class="form-field">
                <label class="form-label">Unit Price (₱)</label>
                <input class="form-input" type="number" v-model.number="newForm.price" min="0" step="0.01" />
              </div>
              <div class="form-field">
                <label class="form-label">Reorder At</label>
                <input class="form-input" type="number" v-model.number="newForm.reorder_at" min="0" />
              </div>
            </div>
            <div class="scanner-footer">
              <button class="btn-cancel" @click="resetScanner">← Scan Again</button>
              <button class="btn-save" @click="doAddNewProduct" :disabled="saving || !newForm.name || !newForm.category">
                <div class="spinner-sm" v-if="saving"></div>
                <span v-else>Add to Inventory</span>
              </button>
            </div>
          </div>

          <!-- Step 4: Success -->
          <div class="scanner-body success-body" v-if="scanStep === 'success'">
            <i class="bi bi-check-circle-fill success-bi"></i>
            <div class="success-title">{{ successMsg }}</div>
            <div class="success-actions">
              <button class="btn-scan-again" @click="resetScanner">Scan Another</button>
              <button class="btn-cancel" @click="closeScanner">Done</button>
            </div>
          </div>

        </div>
      </div>
    </Transition></Teleport>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useInventory } from '@/composables/useInventory'
import { getProfile }   from '@/composables/useAuth'

const {
  products, categories, loading,
  totalProducts, totalStock, totalRoom1Stock,
  lowStockItems, outOfStock,
  room1LowStock, room1OutOfStock,
  stockStatus, room1Status,
  fetchProducts, fetchCategories,
  addProduct, updateProduct, deleteProduct,
  subscribeRealtime, unsubscribeRealtime,
  transferToRoom1, transferFromRoom1,
} = useInventory()

// ── Profile ───────────────────────────────────
const currentProfile = ref(null)

// ── Fetch on mount ────────────────────────────
onMounted(async () => {
  currentProfile.value = await getProfile()
  await Promise.all([fetchProducts(), fetchCategories()])
  subscribeRealtime()
})
onUnmounted(async () => {
  await killInvTorch()  // turn off flashlight immediately when leaving page
  unsubscribeRealtime()
  stopCamera()
})

// ── Search + Filter ───────────────────────────
const searchQuery    = ref('')
const filterCategory = ref('all')

const filtered = computed(() => {
  let list = products.value
  if (filterCategory.value !== 'all') {
    list = list.filter(p => p.category === filterCategory.value)
  }
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase()
    list = list.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q)
    )
  }
  return list
})

// ── Modal state ───────────────────────────────
const showModal = ref(false)
const editing   = ref(null)
const saving    = ref(false)
const errors    = ref({})

const emptyForm = () => ({
  name:             '',
  sku:              '',
  category:         '',
  stock:            0,
  unit:             'pcs',
  price:            0,
  reorder_at:       10,
  room1_stock:      0,
  room1_reorder_at: 1,
})
const form = ref(emptyForm())

function openModal(product = null) {
  errors.value = {}
  if (product) {
    editing.value = product.id
    form.value = {
      name:             product.name,
      sku:              product.sku,
      category:         product.category,
      stock:            product.stock,
      unit:             product.unit,
      price:            product.price,
      reorder_at:       product.reorder_at,
      room1_stock:      product.room1_stock      || 0,
      room1_reorder_at: product.room1_reorder_at ?? 1,
    }
  } else {
    editing.value = null
    form.value = emptyForm()
  }
  showModal.value = true
}

function closeModal() {
  showModal.value = false
  editing.value   = null
  errors.value    = {}
}

// ── Validation ────────────────────────────────
function validate() {
  const e = {}
  if (!form.value.name.trim())     e.name     = 'Product name is required'
  if (!form.value.sku.trim())      e.sku      = 'SKU is required'
  if (!form.value.category)        e.category = 'Category is required'
  if (form.value.stock < 0)        e.stock    = 'Stock cannot be negative'
  if (form.value.price < 0)        e.price    = 'Price cannot be negative'
  errors.value = e
  return Object.keys(e).length === 0
}

// ── Save ──────────────────────────────────────
async function save() {
  if (!validate()) return
  saving.value = true
  try {
    if (editing.value) {
      await updateProduct(editing.value, form.value)
      showToast('Product updated successfully', 'success')
    } else {
      await addProduct(form.value)
      showToast('Product added successfully', 'success')
    }
    closeModal()
  } catch (err) {
    showToast('Error: ' + err.message, 'error')
  } finally {
    saving.value = false
  }
}

// ── Delete ────────────────────────────────────
const deleteTarget = ref(null)
function confirmDelete(product) { deleteTarget.value = product }
async function doDelete() {
  try {
    await deleteProduct(deleteTarget.value.id)
    showToast('Product deleted', 'success')
  } catch (err) {
    showToast('Error: ' + err.message, 'error')
  } finally {
    deleteTarget.value = null
  }
}


// -- Transfer Modal ---
const showTransfer    = ref(false)
const transferProduct = ref(null)
const transferDir     = ref("toRoom1")
const transferQty     = ref(1)
const transferNotes   = ref("")
const transferError   = ref("")
const transferring    = ref(false)
async function openTransfer(product) {
  if (!currentProfile.value) currentProfile.value = await getProfile()
  transferProduct.value = product
  transferDir.value     = "toRoom1"
  transferQty.value     = 1
  transferNotes.value   = ""
  transferError.value   = ""
  showTransfer.value    = true
}

function closeTransfer() {
  showTransfer.value    = false
  transferProduct.value = null
}

async function doTransfer() {
  const p   = transferProduct.value
  const qty = transferQty.value
  if (!p || qty < 1) return
  transferError.value = ""
  transferring.value  = true
  try {
    const userName = currentProfile.value?.name || currentProfile.value?.email || "Unknown"
    if (transferDir.value === "toRoom1") {
      if (qty > p.stock) { transferError.value = `Only ${p.stock} ${p.unit} available in Warehouse`; transferring.value = false; return }
      await transferToRoom1(p, qty, transferNotes.value, userName)
      showToast(`${qty} ${p.unit} of "${p.name}" transferred to Room 1`, "success")
    } else {
      if (qty > (p.room1_stock || 0)) { transferError.value = `Only ${p.room1_stock || 0} ${p.unit} available in Room 1`; transferring.value = false; return }
      await transferFromRoom1(p, qty, transferNotes.value, userName)
      showToast(`${qty} ${p.unit} of "${p.name}" returned to Warehouse`, "success")
    }
    closeTransfer()
  } catch (err) {
    transferError.value = err.message
  } finally {
    transferring.value = false
  }
}

// ── QR SCANNER ────────────────────────────────
const showScanner   = ref(false)
const scanStep      = ref('scanning')
const scannerActive = ref(false)
const invQrDetected  = ref(false)
const invTorchOn     = ref(false)
let   invTorchTrack  = null
const invBboxCanvas  = ref(null)
let   invBboxClear   = null
const qrReaderEl    = ref(null)
const manualSku     = ref('')
const scanStatus    = ref({ msg: '', type: '' })
const scannedData   = ref({})          // parsed QR payload
const scannedProduct = ref(null)       // matched existing product
const stockQty      = ref(1)
const successMsg    = ref('')
const newForm       = ref({})
let html5QrScanner  = null
let scanLock        = false

async function loadHtml5Qr() {
  if (window.Html5Qrcode) return
  // Try unpkg first, fall back to jsDelivr
  const urls = [
    'https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js',
    'https://cdn.jsdelivr.net/npm/html5-qrcode@2.3.8/html5-qrcode.min.js',
  ]
  for (const url of urls) {
    try {
      await new Promise((res, rej) => {
        const s = document.createElement('script')
        s.src = url
        s.onload = res
        s.onerror = rej
        document.head.appendChild(s)
      })
      if (window.Html5Qrcode) return  // loaded OK
    } catch {}
  }
}

async function openScanner() {
  showScanner.value = true
  scanStep.value    = 'scanning'
  scanStatus.value  = { msg: 'Loading scanner…', type: 'loading' }
  manualSku.value   = ''
  // Pre-load the library in background while modal animates open
  loadHtml5Qr().then(() => {
    // Poll until #qr-reader div exists in DOM (mobile can be slow)
    waitForElement('qr-reader', 3000).then(found => {
      if (found) startCamera()
      else {
        scanStatus.value = { msg: 'Scanner failed to initialize. Use manual SKU entry below.', type: 'warn' }
      }
    })
  })
}

// Poll for a DOM element by id — mobile rendering can be slow
function waitForElement(id, timeout = 3000) {
  return new Promise((resolve) => {
    const start = Date.now()
    function check() {
      if (document.getElementById(id)) { resolve(true); return }
      if (Date.now() - start > timeout) { resolve(false); return }
      requestAnimationFrame(check)
    }
    check()
  })
}

async function startCamera() {
  try {
    // Chrome Android requires HTTPS for camera access
    if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
      scanStatus.value = { msg: 'Camera requires HTTPS. Your site must be served over https:// for scanning to work.', type: 'warn' }
      scannerActive.value = false
      return
    }

    await loadHtml5Qr()

    if (!window.Html5Qrcode) {
      scanStatus.value = { msg: 'Scanner library failed to load. Use manual SKU entry below.', type: 'warn' }
      return
    }

    // Stop any existing scanner first
    if (html5QrScanner) {
      try { await html5QrScanner.stop() } catch {}
      try { html5QrScanner.clear() } catch {}
      html5QrScanner = null
    }

    // Clear div before init to remove ghost elements from previous session
    const el = document.getElementById('qr-reader')
    if (el) el.innerHTML = ''
    // Kill any existing camera streams from other pages
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
      stream.getTracks().forEach(t => t.stop())
    } catch {}
    html5QrScanner = new window.Html5Qrcode('qr-reader')
    scannerActive.value = true
    scanStatus.value = { msg: '', type: '' }

    // Request camera — prefer back camera on phones
    const cameraConfig = { facingMode: 'environment' }
    const scanConfig = { fps: 8, qrbox: { width: 280, height: 280 }, aspectRatio: 1.0, disableFlip: true }

    await html5QrScanner.start(
      cameraConfig,
      scanConfig,
      (decodedText, result) => {
        drawInvBoundingBox(result)
        onScanSuccess(decodedText)
      },
      () => {}
    )
  } catch (err) {
    scannerActive.value = false
    const msg = err?.message || String(err)

    if (msg.toLowerCase().includes('permission') || msg.toLowerCase().includes('notallowed')) {
      scanStatus.value = { msg: 'Camera permission denied. Please allow camera access in your browser settings, then try again.', type: 'warn' }
    } else if (msg.toLowerCase().includes('notfound') || msg.toLowerCase().includes('no camera')) {
      scanStatus.value = { msg: 'No camera found on this device. Use manual SKU entry below.', type: 'warn' }
    } else {
      scanStatus.value = { msg: `Camera error: ${msg}. Use manual SKU entry below.`, type: 'warn' }
    }
  }
}

async function stopCamera() {
  scannerActive.value = false
  // Clear bounding box canvas
  if (invBboxCanvas.value) {
    invBboxCanvas.value.getContext('2d').clearRect(0, 0, invBboxCanvas.value.width, invBboxCanvas.value.height)
  }
  if (invBboxClear) { clearTimeout(invBboxClear); invBboxClear = null }
  if (html5QrScanner) {
    try { await html5QrScanner.stop() } catch {}
    try { html5QrScanner.clear() } catch {}
    html5QrScanner = null
  }
  try {
    document.querySelectorAll('#qr-reader video').forEach(v => {
      try { v.srcObject?.getTracks()?.forEach(t => t.stop()); v.srcObject = null } catch {}
    })
  } catch {}
}

// ── Bounding box drawing ─────────────────────
function drawInvBoundingBox(result) {
  try {
    const canvas = invBboxCanvas.value
    if (!canvas) return
    const videoEl = document.querySelector('#qr-reader video')
    if (!videoEl) return

    const rect   = videoEl.getBoundingClientRect()
    canvas.width  = rect.width  || videoEl.offsetWidth  || 300
    canvas.height = rect.height || videoEl.offsetHeight || 300

    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    const loc = result?.location || result?.result?.location
    if (!loc) return

    const raw = [loc.topLeftCorner, loc.topRightCorner, loc.bottomRightCorner, loc.bottomLeftCorner]
    if (raw.some(p => !p || p.x == null)) return

    const sx = canvas.width  / (videoEl.videoWidth  || canvas.width)
    const sy = canvas.height / (videoEl.videoHeight || canvas.height)
    const pts = raw.map(p => ({ x: p.x * sx, y: p.y * sy }))

    // Green fill
    ctx.beginPath()
    ctx.moveTo(pts[0].x, pts[0].y)
    pts.slice(1).forEach(p => ctx.lineTo(p.x, p.y))
    ctx.closePath()
    ctx.fillStyle = 'rgba(22,163,74,0.18)'
    ctx.fill()

    // Green stroke
    ctx.beginPath()
    ctx.moveTo(pts[0].x, pts[0].y)
    pts.slice(1).forEach(p => ctx.lineTo(p.x, p.y))
    ctx.closePath()
    ctx.strokeStyle = '#16A34A'
    ctx.lineWidth   = 3
    ctx.shadowColor = 'rgba(22,163,74,0.8)'
    ctx.shadowBlur  = 10
    ctx.stroke()
    ctx.shadowBlur  = 0

    // Corner dots with white center
    pts.forEach(p => {
      ctx.beginPath()
      ctx.arc(p.x, p.y, 6, 0, Math.PI * 2)
      ctx.fillStyle = '#16A34A'
      ctx.fill()
      ctx.beginPath()
      ctx.arc(p.x, p.y, 2.5, 0, Math.PI * 2)
      ctx.fillStyle = 'white'
      ctx.fill()
    })

    if (invBboxClear) clearTimeout(invBboxClear)
    invBboxClear = setTimeout(() => {
      const cv = invBboxCanvas.value
      if (cv) cv.getContext('2d').clearRect(0, 0, cv.width, cv.height)
    }, 800)
  } catch (e) {}
}

async function killInvTorch() {
  if (invTorchTrack) {
    try { await invTorchTrack.applyConstraints({ advanced: [{ torch: false }] }) } catch {}
    try { invTorchTrack.stop() } catch {}
    invTorchTrack    = null
    invTorchOn.value = false
  }
}

async function toggleInvTorch() {
  try {
    if (!invTorchTrack) {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      invTorchTrack = stream.getVideoTracks()[0]
    }
    invTorchOn.value = !invTorchOn.value
    await invTorchTrack.applyConstraints({ advanced: [{ torch: invTorchOn.value }] })
  } catch {}
}

async function onScanSuccess(raw) {
  if (scanLock) return
  scanLock = true
  invQrDetected.value = true
  await new Promise(r => setTimeout(r, 400))
  invQrDetected.value = false
  stopCamera()
  let parsed = {}
  try { parsed = JSON.parse(raw) } catch {
    parsed = { sku: raw.trim() }
  }
  if (!parsed.sku) {
    scanLock = false
    scanStatus.value = { msg: 'Could not read SKU from QR. Try again.', type: 'error' }
    startCamera()
    return
  }
  processScannedSku(parsed)
}

function processManualSku() {
  if (!manualSku.value.trim()) return
  processScannedSku({ sku: manualSku.value.trim() })
}

function processScannedSku(parsed) {
  scannedData.value = parsed
  // Look up in products
  const match = products.value.find(
    p => p.sku?.toLowerCase() === parsed.sku?.toLowerCase()
  )
  if (match) {
    scannedProduct.value = match
    stockQty.value = 1
    scanStep.value = 'add-stock'
  } else {
    // Pre-fill new product form with scanned data
    newForm.value = {
      name:       parsed.name     || '',
      sku:        parsed.sku      || '',
      category:   parsed.category || '',
      unit:       parsed.unit     || 'pcs',
      stock:      1,
      price:      0,
      reorder_at: 10,
    }
    scanStep.value = 'new-product'
  }
}

async function doAddStock() {
  saving.value = true
  try {
    const newStock = scannedProduct.value.stock + stockQty.value
    await updateProduct(scannedProduct.value.id, { stock: newStock })
    successMsg.value = `Added ${stockQty.value} ${scannedProduct.value.unit || 'pcs'} to "${scannedProduct.value.name}" — now ${newStock} in stock`
    scanStep.value = 'success'
    showToast(successMsg.value, 'success')
  } catch (err) {
    showToast('Error: ' + err.message, 'error')
  } finally {
    saving.value = false
  }
}

async function doAddNewProduct() {
  if (!newForm.value.name || !newForm.value.category) return
  saving.value = true
  try {
    await addProduct(newForm.value)
    successMsg.value = `"${newForm.value.name}" added to inventory with ${newForm.value.stock} ${newForm.value.unit || 'pcs'}`
    scanStep.value = 'success'
    showToast(successMsg.value, 'success')
  } catch (err) {
    showToast('Error: ' + err.message, 'error')
  } finally {
    saving.value = false
  }
}

async function resetScanner() {
  scanLock = false
  invQrDetected.value = false
  await killInvTorch()  // turn off torch before restarting camera
  await stopCamera()
  scanStep.value   = 'scanning'
  manualSku.value  = ''
  scanStatus.value = { msg: 'Loading scanner…', type: 'loading' }
  waitForElement('qr-reader', 3000).then(found => {
    if (found) startCamera()
    else scanStatus.value = { msg: 'Scanner failed to initialize. Use manual SKU entry below.', type: 'warn' }
  })
}

async function closeScanner() {
  scanLock = false
  await killInvTorch()  // turn off torch when closing scanner
  await stopCamera()
  showScanner.value = false
  scanStep.value    = 'scanning'
  manualSku.value   = ''
  scanStatus.value  = { msg: '', type: '' }
  scannedData.value  = {}
  scannedProduct.value = null
  invQrDetected.value  = false
}

const toast = ref({ show: false, message: '', type: 'success' })
let toastTimer = null
function showToast(message, type = 'success') {
  if (toastTimer) clearTimeout(toastTimer)
  toast.value = { show: true, message, type }
  toastTimer = setTimeout(() => { toast.value.show = false }, 3000)
}

</script>


<style scoped>

.inventory-page { display: flex; flex-direction: column; gap: 20px; animation: fadeUp 0.4s both; max-width: 100%; overflow-x: hidden; }

/* Header */
.page-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; }
.page-title { font-family: 'Cormorant Garamond', serif; font-size: 28px; font-weight: 600; color: #1A1016; }
.page-sub { font-size: 13px; color: #9A8589; margin-top: 3px; }

.btn-add {
  display: flex; align-items: center; gap: 7px;
  padding: 10px 18px; background: #B01020; color: white;
  border: none; border-radius: 11px;
  font-family: 'Outfit', sans-serif; font-size: 13px; font-weight: 600;
  cursor: pointer; white-space: nowrap; transition: all 0.2s;
  box-shadow: 0 4px 12px rgba(176,16,32,0.25);
}
.btn-add:hover { background: #7A0A17; transform: translateY(-1px); }

/* Toolbar */
.toolbar { display: flex; align-items: flex-start; gap: 12px; flex-wrap: wrap; max-width: 100%; }
.search-wrap {
  display: flex; align-items: center; gap: 8px;
  background: white; border: 1.5px solid #EDE3E5;
  border-radius: 10px; padding: 8px 14px;
  transition: all 0.2s; flex: 0 0 280px;
}
.search-wrap:focus-within { border-color: #B01020; box-shadow: 0 0 0 3px rgba(176,16,32,0.07); }
.search-wrap svg { color: #9A8589; flex-shrink: 0; }
.search-input { border: none; background: none; outline: none; font-family: 'Outfit', sans-serif; font-size: 13px; color: #1A1016; width: 100%; }
.search-input::placeholder { color: #C4ADAF; }

.filter-pills { display: flex; gap: 6px; flex-wrap: wrap; max-width: 100%; }
.pill {
  padding: 6px 13px; background: white;
  border: 1.5px solid #EDE3E5; border-radius: 20px;
  font-size: 12px; font-weight: 500; color: #6B5257;
  cursor: pointer; transition: all 0.18s; user-select: none;
}
.pill:hover { border-color: #B01020; color: #B01020; }
.pill.active { background: #B01020; border-color: #B01020; color: white; }

/* Stats row */
.stats-row { display: flex; gap: 10px; flex-wrap: wrap; max-width: 100%; }
.stat-chip {
  display: flex; align-items: center; gap: 8px;
  padding: 8px 16px; background: white;
  border: 1.5px solid #EDE3E5; border-radius: 10px;
}
.stat-chip-warn { border-color: #FCD34D; background: #FFFBEB; }
.stat-chip-danger { border-color: #FECDD3; background: #FFF5F6; }
.stat-chip-label { font-size: 11px; color: #9A8589; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px; }
.stat-chip-val { font-family: 'Cormorant Garamond', serif; font-size: 22px; font-weight: 600; color: #1A1016; }

/* Loading */
.loading-state {
  display: flex; align-items: center; justify-content: center;
  gap: 12px; padding: 60px; color: #9A8589; font-size: 14px;
}
.spinner-lg {
  width: 28px; height: 28px;
  border: 3px solid #EDE3E5; border-top-color: #B01020;
  border-radius: 50%; animation: spin 0.7s linear infinite;
}

/* Empty state */
.empty-state {
  display: flex; flex-direction: column; align-items: center;
  justify-content: center; gap: 12px; padding: 80px 20px; text-align: center;
}
.empty-icon { font-size: 48px; }
.empty-title { font-family: 'Cormorant Garamond', serif; font-size: 24px; font-weight: 600; color: #1A1016; }
.empty-sub { font-size: 13px; color: #9A8589; }

/* Table */
.table-wrap {
  background: white; border-radius: 16px;
  border: 1.5px solid #EDE3E5; overflow: hidden;
  overflow-x: auto;
}
.inv-table { width: 100%; min-width: 780px; border-collapse: collapse; }
.inv-table thead tr { background: #F7F3F4; border-bottom: 1.5px solid #EDE3E5; }
.inv-table th {
  padding: 12px 16px; text-align: left;
  font-size: 10px; font-weight: 700;
  letter-spacing: 1.5px; text-transform: uppercase;
  color: #9A8589; white-space: nowrap;
}
.table-row { border-bottom: 1px solid #F0E5E7; transition: background 0.15s; }
.table-row:last-child { border-bottom: none; }
.table-row:hover { background: #FFF5F6; }
.row-low { background: #FFFBEB; }
.row-out { background: #FFF5F6; }
.inv-table td { padding: 12px 16px; font-size: 13px; color: #3D2830; vertical-align: middle; }

.product-name { font-weight: 500; color: #1A1016; }
.sku-badge {
  font-size: 11px; font-weight: 600; font-family: monospace;
  background: #F7F3F4; border: 1px solid #EDE3E5;
  padding: 2px 8px; border-radius: 6px; color: #6B5257;
}
.cat-badge {
  font-size: 11px; font-weight: 500;
  background: #FFF5F6; border: 1px solid #F0DADE;
  padding: 2px 8px; border-radius: 6px; color: #B01020;
}
.stock-cell { display: flex; align-items: baseline; gap: 4px; }
.stock-num { font-weight: 700; font-size: 15px; color: #1A1016; }
.stock-low { color: #D97706; }
.stock-out { color: #B01020; }
.stock-unit { font-size: 11px; color: #9A8589; }
.price-cell { font-weight: 500; color: #1A1016; }

.status-badge {
  font-size: 10px; font-weight: 700; padding: 3px 10px;
  border-radius: 20px; letter-spacing: 0.5px; text-transform: uppercase;
  white-space: nowrap;
}
.status-ok  { background: #F0FDF4; color: #16A34A; }
.status-low { background: #FFFBEB; color: #D97706; }
.status-out { background: #FFF5F6; color: #B01020; }

.action-btns { display: flex; gap: 6px; }
.btn-icon {
  width: 28px; height: 28px; border-radius: 7px;
  background: #F7F3F4; border: 1.5px solid #EDE3E5;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; color: #9A8589; transition: all 0.15s;
}
.btn-icon:hover { background: #FFF5F6; border-color: #B01020; color: #B01020; }
.btn-icon-del:hover { background: #FFF5F6; border-color: #E8394A; color: #E8394A; }

/* Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: rgba(26,16,22,0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
}
.modal {
  background: white; border-radius: 20px;
  width: 100%; max-width: 520px;
  max-height: 90vh; display: flex; flex-direction: column;
  box-shadow: 0 24px 64px rgba(0,0,0,0.18);
}
.modal-sm { max-width: 420px; }
.modal-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 20px 24px 0; flex-shrink: 0;
}
.modal-title { font-family: 'Cormorant Garamond', serif; font-size: 22px; font-weight: 600; color: #1A1016; }
.modal-close {
  background: #F7F3F4; border: none; border-radius: 8px;
  color: #9A8589; cursor: pointer; width: 30px; height: 30px;
  display: flex; align-items: center; justify-content: center; transition: all 0.18s;
}
.modal-close:hover { background: #FFF5F6; color: #B01020; }
.modal-body {
  padding: 20px 24px; overflow-y: auto; flex: 1;
  display: flex; flex-direction: column; gap: 14px;
}
.modal-footer {
  padding: 16px 24px 20px;
  display: flex; justify-content: flex-end; gap: 10px;
  border-top: 1px solid #EDE3E5; flex-shrink: 0;
}

/* Form */
.form-label { display: block; font-size: 10px; font-weight: 600; letter-spacing: 2px; text-transform: uppercase; color: #3D2830; margin-bottom: 6px; }
.req { color: #B01020; }
.form-input {
  width: 100%; padding: 10px 14px;
  border: 1.5px solid #EBE0E2; border-radius: 10px;
  font-family: 'Outfit', sans-serif; font-size: 13px; color: #1A1016;
  background: #FFF5F6; outline: none; transition: all 0.2s;
}
.form-input:focus { border-color: #B01020; background: white; box-shadow: 0 0 0 3px rgba(176,16,32,0.08); }
.form-select { cursor: pointer; }
.form-error { font-size: 11px; color: #E8394A; margin-top: 4px; }
.form-hint { font-size: 11px; color: #9A8589; margin-top: 4px; }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }

.btn-cancel {
  padding: 10px 20px; background: none;
  border: 1.5px solid #EDE3E5; border-radius: 10px;
  font-family: 'Outfit', sans-serif; font-size: 13px; font-weight: 500;
  color: #9A8589; cursor: pointer; transition: all 0.18s;
}
.btn-cancel:hover:not(:disabled) { border-color: #9A8589; color: #3D2830; }
.btn-cancel:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-save {
  padding: 10px 22px; background: #B01020; color: white;
  border: none; border-radius: 10px;
  font-family: 'Outfit', sans-serif; font-size: 13px; font-weight: 600;
  cursor: pointer; transition: all 0.2s;
  display: flex; align-items: center; gap: 8px; min-width: 120px; justify-content: center;
}
.btn-save:hover:not(:disabled) { background: #7A0A17; box-shadow: 0 4px 14px rgba(176,16,32,0.3); }
.btn-save:disabled { opacity: 0.65; cursor: not-allowed; }
.btn-delete {
  padding: 10px 22px; background: #E8394A; color: white;
  border: none; border-radius: 10px;
  font-family: 'Outfit', sans-serif; font-size: 13px; font-weight: 600;
  cursor: pointer; transition: all 0.2s;
}
.btn-delete:hover { background: #C0142A; }
.delete-text { font-size: 14px; color: #3D2830; line-height: 1.6; }
.delete-text strong { color: #1A1016; }

.spinner-sm {
  width: 15px; height: 15px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: white; border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

/* Toast */
.toast {
  position: fixed; bottom: 28px; left: 50%; transform: translateX(-50%);
  padding: 12px 22px; border-radius: 12px;
  font-size: 13px; font-weight: 500; color: white;
  box-shadow: 0 8px 24px rgba(0,0,0,0.18);
  z-index: 10000; white-space: nowrap;
}
.toast-success { background: #1A1016; }
.toast-error   { background: #B01020; }

/* Transitions */
.modal-fade-enter-active { transition: all 0.3s cubic-bezier(0.16,1,0.3,1); }
.modal-fade-leave-active { transition: all 0.2s ease; }
.modal-fade-enter-from, .modal-fade-leave-to { opacity: 0; }
.modal-fade-enter-from .modal { transform: scale(0.95) translateY(16px); }

.toast-enter-active { transition: all 0.3s cubic-bezier(0.16,1,0.3,1); }
.toast-leave-active { transition: all 0.25s ease; }
.toast-enter-from { opacity: 0; transform: translateX(-50%) translateY(16px); }
.toast-leave-to   { opacity: 0; transform: translateX(-50%) translateY(8px); }

@keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: none; } }
@keyframes spin   { to { transform: rotate(360deg); } }

/* ── Header buttons ── */
.header-btns { display: flex; align-items: center; gap: 8px; }

.btn-scan {
  display: flex; align-items: center; gap: 7px;
  padding: 10px 16px; background: white; color: #3D2830;
  border: 1.5px solid #EDE3E5; border-radius: 11px;
  font-family: 'Outfit', sans-serif; font-size: 13px; font-weight: 600;
  cursor: pointer; white-space: nowrap; transition: all 0.2s;
}
.btn-scan:hover { border-color: #B01020; color: #B01020; background: #FFF5F6; }

/* ── Scanner Modal ── */
.scanner-modal { max-width: 480px; }

.scanner-body { padding: 20px 24px 24px; display: flex; flex-direction: column; gap: 16px; }

.scan-hint { font-size: 13px; color: #9A8589; text-align: center; }

.scan-viewport-wrap {
  position: relative; border-radius: 14px; overflow: hidden;
  background: #0A0608; transition: box-shadow 0.3s;
}
.bbox-canvas-inv {
  position: absolute;
  top: 0; left: 0;
  width: 100% !important;
  height: 100% !important;
  pointer-events: none;
  z-index: 20;
  display: block;
}
.scan-viewport-wrap.detected { box-shadow: 0 0 0 3px #16A34A, 0 0 24px rgba(22,163,74,0.4); }
#qr-reader { width: 100% !important; min-height: 300px; border: none !important; }
#qr-reader video { width: 100% !important; display: block; }
#qr-reader img { display: none !important; }
#qr-reader * { border: none !important; }

/* Dark overlay with cutout */
.scan-overlay {
  position: absolute; inset: 0; pointer-events: none;
  display: flex; align-items: center; justify-content: center;
  background:
    linear-gradient(#0008 0 0) top / 100% calc(50% - 140px) no-repeat,
    linear-gradient(#0008 0 0) bottom / 100% calc(50% - 140px) no-repeat,
    linear-gradient(#0008 0 0) left / calc(50% - 140px) 280px no-repeat,
    linear-gradient(#0008 0 0) right / calc(50% - 140px) 280px no-repeat;
}
.tracker-box { position: absolute; width: 280px; height: 280px; pointer-events: none; }

/* Corner L-brackets */
.scan-corner { position: absolute; width: 32px; height: 32px; border-color: #B01020; border-style: solid; transition: border-color 0.3s; }
.scan-viewport-wrap.detected .scan-corner { border-color: #16A34A; }
.scan-corner.tl { top: 0; left: 0; border-width: 4px 0 0 4px; border-radius: 6px 0 0 0; }
.scan-corner.tr { top: 0; right: 0; border-width: 4px 4px 0 0; border-radius: 0 6px 0 0; }
.scan-corner.bl { bottom: 0; left: 0; border-width: 0 0 4px 4px; border-radius: 0 0 0 6px; }
.scan-corner.br { bottom: 0; right: 0; border-width: 0 4px 4px 0; border-radius: 0 0 6px 0; }

/* Laser line */
.scan-line {
  position: absolute; left: 8px; right: 8px; height: 2px;
  background: linear-gradient(90deg, transparent 0%, #B01020 30%, #FF4060 50%, #B01020 70%, transparent 100%);
  box-shadow: 0 0 8px #B01020; top: 0; opacity: 0;
}
.scan-line.scanning { opacity: 1; animation: laserScan 1.8s cubic-bezier(0.4,0,0.6,1) infinite; }
@keyframes laserScan {
  0%   { top: 8px; opacity: 0; }
  10%  { opacity: 1; }
  90%  { opacity: 1; }
  100% { top: calc(100% - 8px); opacity: 0; }
}
@keyframes scanMove { 0%,100% { top: 8px; } 50% { top: calc(100% - 8px); } }

.tk-flash-inv { position: absolute; inset: 0; background: rgba(22,163,74,0.25); border-radius: 4px; opacity: 0; transition: opacity 0.15s; }
.tk-flash-inv.show { opacity: 1; }
.tk-dot-inv { position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%); width: 8px; height: 8px; background: rgba(176,16,32,0.6); border-radius: 50%; }
.tk-dot-inv.pulse { animation: dotPulse 2s ease-in-out infinite; }
@keyframes dotPulse { 0%,100% { transform: translate(-50%,-50%) scale(1); opacity: 0.6; } 50% { transform: translate(-50%,-50%) scale(2); opacity: 0.2; } }

.torch-btn-inv { position: absolute; bottom: 12px; right: 12px; width: 36px; height: 36px; border-radius: 50%; background: rgba(0,0,0,0.55); border: 1.5px solid rgba(255,255,255,0.3); color: rgba(255,255,255,0.7); font-size: 15px; cursor: pointer; pointer-events: all; display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
.torch-btn-inv:hover { background: rgba(0,0,0,0.8); color: white; }
.torch-btn-inv.on { background: #FCD34D; border-color: #F59E0B; color: #1A1016; }

.inv-detect-bar { display: flex; align-items: center; gap: 10px; padding: 10px 14px; border-radius: 10px; font-size: 13px; font-weight: 500; background: #F7F3F4; border: 1.5px solid #EDE3E5; color: #9A8589; transition: all 0.3s; }
.inv-detect-bar.bar-scanning { color: #6B5257; }
.inv-detect-bar.bar-found { background: #D1FAE5; border-color: #6EE7B7; color: #065F46; }
.bar-icon-inv { width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; font-size: 16px; }
.inv-bar-spinner { width: 14px; height: 14px; border: 2px solid #DDD5D7; border-top-color: #B01020; border-radius: 50%; animation: spin 0.7s linear infinite; }

.scan-status { padding: 10px 14px; border-radius: 10px; font-size: 13px; font-weight: 500; text-align: center; display: flex; align-items: center; justify-content: center; gap: 8px; }
.status-warn    { background: #FFFBEB; color: #D97706; border: 1px solid #FDE68A; }
.status-error   { background: #FFF5F6; color: #B01020; border: 1px solid #FECDD3; }
.status-ok      { background: #F0FDF4; color: #16A34A; border: 1px solid #BBF7D0; }
.status-loading { background: #F7F3F4; color: #6B5257; border: 1px solid #EDE3E5; }
.scan-spinner   { width: 14px; height: 14px; border: 2px solid #DDD5D7; border-top-color: #B01020; border-radius: 50%; animation: spin 0.7s linear infinite; flex-shrink: 0; }

/* Manual entry */
.manual-entry { border-top: 1px solid #F0E5E7; padding-top: 14px; }
.manual-label { font-size: 11px; font-weight: 600; letter-spacing: 1.5px; text-transform: uppercase; color: #9A8589; margin-bottom: 8px; }
.manual-row { display: flex; gap: 8px; }
.manual-input { flex: 1; }
.btn-manual { padding: 10px 16px; background: #B01020; color: white; border: none; border-radius: 10px; font-family: 'Outfit', sans-serif; font-size: 13px; font-weight: 600; cursor: pointer; white-space: nowrap; transition: all 0.2s; }
.btn-manual:hover:not(:disabled) { background: #7A0A17; }
.btn-manual:disabled { opacity: 0.5; cursor: not-allowed; }

/* Found banners */
.found-banner { display: flex; align-items: center; gap: 8px; padding: 10px 14px; border-radius: 10px; font-size: 13px; font-weight: 600; }
.found-existing { background: #F0FDF4; color: #16A34A; border: 1px solid #BBF7D0; }
.found-new      { background: #EFF6FF; color: #2563EB; border: 1px solid #BFDBFE; }

.found-product { background: #F7F3F4; border: 1.5px solid #EDE3E5; border-radius: 12px; padding: 14px 16px; }
.fp-name { font-size: 15px; font-weight: 700; color: #1A1016; margin-bottom: 4px; }
.fp-meta { display: flex; gap: 8px; margin-bottom: 6px; }
.fp-sku  { font-family: monospace; font-size: 11px; font-weight: 700; color: #B01020; }
.fp-meta span { font-size: 11px; color: #9A8589; }
.fp-stock { font-size: 13px; color: #6B5257; }
.text-red   { color: #B01020; }
.text-green { color: #16A34A; }

.scanned-sku-box { background: #F7F3F4; border-radius: 10px; padding: 10px 14px; font-size: 13px; color: #6B5257; }
.scanned-sku-box code { font-family: monospace; font-weight: 700; color: #B01020; margin-left: 4px; }

/* Qty row */
.qty-row { display: flex; align-items: center; gap: 8px; }
.qty-btn { width: 36px; height: 36px; background: #F7F3F4; border: 1.5px solid #EDE3E5; border-radius: 8px; font-size: 18px; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; color: #3D2830; transition: all 0.15s; flex-shrink: 0; }
.qty-btn:hover { border-color: #B01020; color: #B01020; background: #FFF5F6; }
.qty-input { width: 80px; text-align: center; flex-shrink: 0; }
.qty-preview { font-size: 12px; color: #9A8589; margin-top: 4px; }
.qty-preview strong { color: #16A34A; font-size: 14px; }

.scanner-footer { display: flex; justify-content: flex-end; gap: 10px; border-top: 1px solid #EDE3E5; padding-top: 14px; margin-top: 4px; }

/* Success */
.success-body { align-items: center; text-align: center; padding: 40px 24px; }
.success-icon  { font-size: 52px; }
.success-title { font-size: 14px; color: #3D2830; font-weight: 500; line-height: 1.5; max-width: 320px; }
.success-actions { display: flex; gap: 10px; margin-top: 8px; }
.btn-scan-again { padding: 10px 20px; background: #B01020; color: white; border: none; border-radius: 10px; font-family: 'Outfit', sans-serif; font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.2s; }
.btn-scan-again:hover { background: #7A0A17; }

@media (max-width: 480px) { .header-btns { flex-direction: column; align-items: stretch; } }

@media (max-width: 768px) {
  .page-header { flex-direction: column; align-items: stretch; }
  .btn-add { justify-content: center; }
  .toolbar { flex-direction: column; align-items: stretch; }
  .search-wrap { flex: none; width: 100%; }
  .filter-pills { overflow-x: auto; flex-wrap: nowrap; padding-bottom: 4px; }
  .stats-row { display: grid; grid-template-columns: 1fr 1fr; }
  .form-row { grid-template-columns: 1fr; }
  .table-wrap { overflow-x: auto; }
  .inv-table { min-width: 600px; }
  .modal { margin: 12px; max-height: 95vh; }
}
@media (max-width: 480px) {
  .stats-row { grid-template-columns: 1fr; }
  .page-title { font-size: 22px; }
}

/* ── Room 1 table styles ── */
.th-loc { display: flex; align-items: center; gap: 5px; font-size: 10px; }
.th-loc-room1 { color: #7C3AED; }
.room1-cell { display: flex; align-items: center; gap: 6px; }
.room1-num { color: #7C3AED !important; }
.reorder-hint { font-size: 9px; color: #D97706; margin-top: 2px; }
.room1-hint   { color: #DC2626; }
.status-col   { display: flex; flex-direction: column; gap: 3px; }
.room1-badge  { font-size: 9px !important; padding: 2px 6px !important; }
.btn-transfer {
  width: 24px; height: 24px; border-radius: 6px;
  border: 1.5px solid #EDE3E5; background: white;
  cursor: pointer; display: flex; align-items: center; justify-content: center;
  color: #7C3AED; font-size: 11px; flex-shrink: 0;
  transition: all 0.15s;
}
.btn-transfer:hover { background: #F5F3FF; border-color: #7C3AED; }

/* ── Stats row groups ── */
.stats-row { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
.stats-group { display: flex; flex-direction: column; gap: 6px; }
.stats-group-label { font-size: 10px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; color: #6B5257; display: flex; align-items: center; gap: 5px; }
.stats-group-label-r1 { color: #7C3AED; }
.stats-inner { display: flex; gap: 6px; flex-wrap: wrap; }
.stats-divider { width: 1px; background: #EDE3E5; align-self: stretch; margin: 0 4px; }
.stat-chip-r1 { background: #F5F3FF !important; border-color: #DDD6FE !important; }
.stat-chip-r1 .stat-chip-val { color: #7C3AED !important; }

/* ── Transfer modal ── */
.transfer-product-info { background: #F7F3F4; border-radius: 10px; padding: 12px 14px; }
.tpi-name { font-family: "Cormorant Garamond", serif; font-size: 18px; font-weight: 600; color: #1A1016; }
.tpi-sku  { font-size: 11px; color: #B01020; font-family: monospace; font-weight: 700; }
.transfer-stocks { display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; gap: 10px; padding: 14px 0; }
.ts-loc { display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 14px; background: #F7F3F4; border-radius: 12px; border: 2px solid #EDE3E5; transition: all 0.2s; }
.ts-loc.ts-active { border-color: #B01020; background: #FFF5F6; }
.ts-icon { font-size: 22px; color: #9A8589; }
.ts-active .ts-icon { color: #B01020; }
.ts-label { font-size: 11px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; color: #9A8589; }
.ts-active .ts-label { color: #B01020; }
.ts-val { font-size: 18px; font-weight: 700; color: #1A1016; font-family: "Cormorant Garamond", serif; }
.ts-arrow { display: flex; flex-direction: column; align-items: center; gap: 4px; cursor: pointer; color: #B01020; font-size: 24px; transition: transform 0.2s; }
.ts-arrow:hover { transform: scale(1.15); }
.ts-arrow-label { font-size: 9px; color: #9A8589; text-transform: uppercase; letter-spacing: 0.5px; }
.transfer-direction { text-align: center; font-size: 13px; color: #6B5257; padding: 4px 0; }
.transfer-preview { font-size: 12px; color: #6B5257; margin-top: 6px; background: #F7F3F4; padding: 8px 12px; border-radius: 8px; }
.transfer-preview strong { color: #1A1016; font-weight: 700; }
.qty-row { display: flex; align-items: center; gap: 8px; }
.qty-btn { width: 34px; height: 34px; border-radius: 8px; border: 1.5px solid #EDE3E5; background: white; font-size: 18px; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; color: #3D2830; transition: all 0.15s; flex-shrink: 0; }
.qty-btn:hover { border-color: #B01020; color: #B01020; }
.qty-input { width: 70px; text-align: center; flex-shrink: 0; }


.form-section-divider {
  display: flex; align-items: center; gap: 7px;
  font-size: 11px; font-weight: 700; letter-spacing: 1px;
  text-transform: uppercase; color: #7C3AED;
  padding: 6px 0 2px;
  border-top: 1px solid #EDE3E5;
  margin-top: 2px;
}

</style>