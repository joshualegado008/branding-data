<template>
  <div class="activities-page">

    <!-- ── Notification Banner ── -->
    <Transition name="notif">
      <div class="notif-banner" v-if="notifications.length > 0 && showNotif">
        <div class="notif-inner">
          <div class="notif-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
          </div>
          <div class="notif-text">
            <strong>{{ notifications.length }} upcoming task{{ notifications.length > 1 ? 's' : '' }}</strong>
            need your attention —
            <span v-for="(n, i) in notifications.slice(0, 2)" :key="n.id">
              <em>{{ n.title }}</em>{{ i < Math.min(notifications.length, 2) - 1 ? ', ' : '' }}
            </span>
            <span v-if="notifications.length > 2"> and {{ notifications.length - 2 }} more.</span>
          </div>
        </div>
        <button class="notif-close" @click="showNotif = false">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="14" height="14">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
    </Transition>

    <!-- ── Header row ── -->
    <div class="page-header">
      <div>
        <div class="page-title">Team Activities</div>
        <div class="page-sub">Track tasks, events & inventory requirements for your team</div>
      </div>
      <button class="btn-add" @click="openModal()">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="14" height="14">
          <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        New Activity
      </button>
    </div>

    <!-- ── Stat pills ── -->
    <div class="stat-pills">
      <div class="pill" :class="{ active: filterStatus === 'all' }" @click="filterStatus = 'all'">
        All <span class="pill-count">{{ activities.length }}</span>
      </div>
      <div class="pill pill-upcoming" :class="{ active: filterStatus === 'upcoming' }" @click="filterStatus = 'upcoming'">
        <span class="pill-dot dot-upcoming"></span>
        Upcoming <span class="pill-count">{{ upcomingCount }}</span>
      </div>
      <div class="pill pill-ongoing" :class="{ active: filterStatus === 'ongoing' }" @click="filterStatus = 'ongoing'">
        <span class="pill-dot dot-ongoing"></span>
        Ongoing <span class="pill-count">{{ ongoingCount }}</span>
      </div>
      <div class="pill pill-done" :class="{ active: filterStatus === 'done' }" @click="filterStatus = 'done'">
        <span class="pill-dot dot-done"></span>
        Done <span class="pill-count">{{ doneCount }}</span>
      </div>
    </div>

    <!-- ── Activity Cards ── -->
    <div class="cards-grid" v-if="filtered.length > 0">
      <div
        class="activity-card"
        v-for="act in filtered"
        :key="act.id"
        :class="'card-' + act.status"
        @click="viewActivity(act)"
      >
        <!-- Card Header -->
        <div class="card-header">
          <div class="card-mascot">{{ getMascot(act.mascot).emoji }}</div>
          <div class="card-header-info">
            <div class="card-title">{{ act.title }}</div>
            <div class="card-date">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="11" height="11">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8"  y1="2" x2="8"  y2="6"/>
                <line x1="3"  y1="10" x2="21" y2="10"/>
              </svg>
              {{ formatDate(act.date, act.time) }}
              <span class="card-countdown" :class="'countdown-' + act.status">
                {{ daysUntil(act.date) }}
              </span>
            </div>
          </div>
          <div class="card-status-badge" :class="getStatus(act.status).cls">
            {{ getStatus(act.status).label }}
          </div>
        </div>

        <!-- Description -->
        <div class="card-desc" v-if="act.description">{{ act.description }}</div>

        <!-- Activity Photo -->
        <div class="card-photo-wrap" v-if="act.image_url">
          <img :src="act.image_url" class="card-photo" :alt="act.title" @click="viewPhoto(act.image_url)" />
        </div>

        <!-- Activity Link -->
        <a v-if="act.link" :href="act.link" target="_blank" rel="noopener" class="card-link">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
          {{ act.link.replace(/^https?:\/\//, '').substring(0, 45) }}{{ act.link.length > 50 ? '…' : '' }}
        </a>

        <!-- Inventory Items -->
        <div class="card-section" v-if="act.inventory_items.length > 0">
          <div class="card-section-title">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
            </svg>
            Required Inventory
          </div>
          <div class="inventory-chips">
            <div class="inv-chip" v-for="item in act.inventory_items" :key="item.sku">
              <span class="inv-chip-name">{{ item.name }}</span>
              <span class="inv-chip-qty">× {{ item.qty }}</span>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="card-footer" @click.stop>
          <div class="card-assignee">
            <div class="assignee-avatar">{{ act.assigned_to.charAt(0) }}</div>
            <span class="assignee-name">{{ act.assigned_to }}</span>
          </div>

          <div class="card-notify" v-if="act.notify_before > 0 && act.status !== 'done'">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
            Notify {{ act.notify_before }}d before
          </div>

          <div class="card-actions">
            <!-- Status cycle -->
            <button
              class="btn-status"
              @click="cycleStatus(act)"
              :title="nextStatusLabel(act.status)"
              v-if="act.status !== 'done'"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13">
                <polyline points="9 11 12 14 22 4"/>
                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
              </svg>
              {{ nextStatusLabel(act.status) }}
            </button>
            <button class="btn-icon-sm" @click="openModal(act)" title="Edit">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
            </button>
            <button class="btn-icon-sm btn-del" @click="confirmDelete(act)" title="Delete">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                <path d="M10 11v6M14 11v6"/>
                <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty state -->
    <div class="empty-state" v-else>
      <i class="bi bi-calendar3 empty-bi"></i>
      <div class="empty-title">No activities found</div>
      <div class="empty-sub">{{ filterStatus === 'all' ? 'Create your first team activity.' : `No ${filterStatus} activities.` }}</div>
      <button class="btn-add" @click="openModal()" v-if="filterStatus === 'all'">
        + New Activity
      </button>
    </div>


    <!-- ══ ADD / EDIT MODAL ══ -->
    <Teleport to="body"><Transition name="modal-fade">
      <div class="modal-overlay" v-if="showModal" @click.self="closeModal">
        <div class="modal">

          <div class="modal-header">
            <div class="modal-title">
              {{ editing ? 'Edit Activity' : 'New Activity' }}
            </div>
            <button class="modal-close" @click="closeModal">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="16" height="16">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          <div class="modal-body">

            <!-- Mascot picker -->
            <div class="form-field">
              <label class="form-label">Mascot / Icon</label>
              <div class="mascot-grid">
                <div
                  class="mascot-option"
                  v-for="m in MASCOTS"
                  :key="m.id"
                  :class="{ selected: modalForm.mascot === m.id }"
                  @click="modalForm.mascot = m.id"
                  :title="m.label"
                >
                  {{ m.emoji }}
                </div>
              </div>
            </div>

            <!-- Title -->
            <div class="form-field">
              <label class="form-label">Activity Title <span class="req">*</span></label>
              <input class="form-input" type="text" v-model="modalForm.title" placeholder="e.g. Foundation Day Banner Setup" />
              <div class="form-error" v-if="formErrors.title">{{ formErrors.title }}</div>
            </div>

            <!-- Description -->
            <div class="form-field">
              <label class="form-label">Description</label>
              <textarea class="form-input form-textarea" v-model="modalForm.description" placeholder="What needs to be done? Any special notes…" rows="3"></textarea>
            </div>

            <!-- Date & Time row -->
            <div class="form-row">
              <div class="form-field">
                <label class="form-label">Date <span class="req">*</span></label>
                <input class="form-input" type="date" v-model="modalForm.date" />
                <div class="form-error" v-if="formErrors.date">{{ formErrors.date }}</div>
              </div>
              <div class="form-field">
                <label class="form-label">Time</label>
                <input class="form-input" type="time" v-model="modalForm.time" />
              </div>
            </div>

            <!-- Assigned to & Status row -->
            <div class="form-row">
              <div class="form-field">
                <label class="form-label">Assigned To <span class="req">*</span></label>
                <select class="form-input form-select" v-model="modalForm.assignedTo">
                  <option value="Admin User">Admin User</option>
                  <option value="Staff User">Staff User</option>
                </select>
                <div class="form-error" v-if="formErrors.assignedTo">{{ formErrors.assignedTo }}</div>
              </div>
              <div class="form-field">
                <label class="form-label">Status</label>
                <select class="form-input form-select" v-model="modalForm.status">
                  <option v-for="s in STATUSES" :key="s.value" :value="s.value">{{ s.label }}</option>
                </select>
              </div>
            </div>

            <!-- Notify before -->
            <div class="form-field">
              <label class="form-label">Notify Before (days)</label>
              <div class="notify-options">
                <div
                  class="notify-chip"
                  v-for="n in [0,1,2,3,5,7]"
                  :key="n"
                  :class="{ selected: modalForm.notifyBefore === n }"
                  @click="modalForm.notifyBefore = n"
                >
                  {{ n === 0 ? 'None' : n + 'd' }}
                </div>
              </div>
            </div>

            <!-- Inventory items -->
            <div class="form-field">
              <div class="inv-label-row">
                <label class="form-label">Required Inventory Items</label>
                <button class="btn-add-item" type="button" @click="addItemRow">
                  + Add item
                </button>
              </div>
              <div class="inv-rows">
                <div class="inv-row" v-for="(item, idx) in modalForm.inventoryItems" :key="idx">
                  <input
                    class="form-input inv-input-name"
                    type="text"
                    v-model="item.name"
                    placeholder="Item name (e.g. Tarpaulin Banner)"
                  />
                  <input
                    class="form-input inv-input-sku"
                    type="text"
                    v-model="item.sku"
                    placeholder="SKU"
                  />
                  <input
                    class="form-input inv-input-qty"
                    type="number"
                    v-model.number="item.qty"
                    placeholder="Qty"
                    min="1"
                  />
                  <button class="btn-remove-item" type="button" @click="removeItemRow(idx)">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="13" height="13">
                      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                </div>
                <div class="inv-empty" v-if="modalForm.inventoryItems.length === 0">
                  No items added yet. Click "Add item" above.
                </div>
              </div>
            </div>

            <!-- Divider -->
            <div class="form-section-divider">
              <span>CSR / Media</span>
            </div>

            <!-- Activity Photo -->
            <div class="form-field">
              <label class="form-label">Activity Photo</label>
              <div class="photo-upload-area" @click="triggerFileInput" @dragover.prevent @drop.prevent="handleDrop">
                <input ref="fileInputRef" type="file" accept="image/*" style="display:none" @change="handleFileChange" />
                <div v-if="imagePreview || modalForm.imageUrl" class="photo-preview-wrap">
                  <img :src="imagePreview || modalForm.imageUrl" class="photo-preview" alt="Activity photo" />
                  <button class="photo-remove" type="button" @click.stop="removeImage">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="13" height="13"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </button>
                </div>
                <div v-else class="photo-placeholder">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="28" height="28"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                  <span>Click or drag & drop to upload photo</span>
                  <span class="photo-hint">JPG, PNG, WEBP — max 5MB</span>
                </div>
              </div>
              <div class="form-error" v-if="imageError">{{ imageError }}</div>
              <div class="upload-progress" v-if="uploadingImage">
                <div class="upload-bar" :style="{ width: uploadProgress + '%' }"></div>
              </div>
            </div>

            <!-- Activity Link -->
            <div class="form-field">
              <label class="form-label">Activity Link</label>
              <div class="link-input-wrap">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="15" height="15" class="link-icon"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                <input class="form-input link-input" type="url" v-model="modalForm.link" placeholder="https://facebook.com/your-csr-post" />
              </div>
              <div class="form-hint">Link to Facebook post, Google Drive folder, or any related URL.</div>
            </div>

          </div>

          <div class="modal-footer">
            <button class="btn-cancel" @click="closeModal">Cancel</button>
            <button class="btn-save" @click="saveActivity">
              {{ editing ? 'Save Changes' : 'Create Activity' }}
            </button>
          </div>

        </div>
      </div>
    </Transition></Teleport>


    <!-- ══ VIEW ACTIVITY DETAIL ══ -->
    <Teleport to="body"><Transition name="drawer-fade">
      <div class="drawer-overlay" v-if="viewTarget" @click.self="viewTarget = null">
        <div class="drawer">

          <!-- Close -->
          <button class="drawer-close" @click="viewTarget = null">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="16" height="16"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>

          <!-- Photo banner -->
          <div class="drawer-photo" v-if="viewTarget.image_url" @click="viewPhoto(viewTarget.image_url)">
            <img :src="viewTarget.image_url" :alt="viewTarget.title" />
            <div class="drawer-photo-zoom">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
            </div>
          </div>

          <!-- Header -->
          <div class="drawer-header">
            <div class="drawer-mascot">{{ getMascot(viewTarget.mascot).emoji }}</div>
            <div class="drawer-header-info">
              <div class="drawer-title">{{ viewTarget.title }}</div>
              <div class="drawer-date">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                {{ formatDate(viewTarget.date, viewTarget.time) }}
                <span class="drawer-countdown" :class="'countdown-' + viewTarget.status">{{ daysUntil(viewTarget.date) }}</span>
              </div>
            </div>
            <div class="drawer-status-badge" :class="getStatus(viewTarget.status).cls">{{ getStatus(viewTarget.status).label }}</div>
          </div>

          <div class="drawer-body">

            <!-- Description -->
            <div class="drawer-section" v-if="viewTarget.description">
              <div class="drawer-section-title">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
                Description
              </div>
              <div class="drawer-desc">{{ viewTarget.description }}</div>
            </div>

            <!-- Details grid -->
            <div class="drawer-details-grid">
              <div class="drawer-detail-item">
                <div class="drawer-detail-label">Assigned To</div>
                <div class="drawer-detail-value">
                  <div class="drawer-avatar">{{ viewTarget.assigned_to.charAt(0) }}</div>
                  {{ viewTarget.assigned_to }}
                </div>
              </div>
              <div class="drawer-detail-item">
                <div class="drawer-detail-label">Notify Before</div>
                <div class="drawer-detail-value">{{ viewTarget.notify_before > 0 ? viewTarget.notify_before + ' day(s)' : 'None' }}</div>
              </div>
            </div>

            <!-- Inventory -->
            <div class="drawer-section" v-if="viewTarget.inventory_items?.length > 0">
              <div class="drawer-section-title">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
                Required Inventory ({{ viewTarget.inventory_items.length }} item{{ viewTarget.inventory_items.length !== 1 ? 's' : '' }})
              </div>
              <div class="drawer-inv-table">
                <div class="drawer-inv-row drawer-inv-head">
                  <span>Item</span><span>SKU</span><span>Qty</span>
                </div>
                <div class="drawer-inv-row" v-for="item in viewTarget.inventory_items" :key="item.sku">
                  <span>{{ item.name }}</span>
                  <span class="drawer-inv-sku">{{ item.sku || '—' }}</span>
                  <span class="drawer-inv-qty">× {{ item.qty }}</span>
                </div>
              </div>
            </div>

            <!-- Link -->
            <div class="drawer-section" v-if="viewTarget.link">
              <div class="drawer-section-title">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                Activity Link
              </div>
              <a :href="viewTarget.link" target="_blank" rel="noopener" class="drawer-link">
                {{ viewTarget.link }}
              </a>
            </div>

          </div>

          <!-- Footer actions -->
          <div class="drawer-footer">
            <button class="btn-cancel" @click="viewTarget = null">Close</button>
            <button class="btn-status" @click="cycleStatus(viewTarget); viewTarget = null" v-if="viewTarget.status !== 'done'">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
              {{ nextStatusLabel(viewTarget.status) }}
            </button>
            <button class="btn-save" @click="openModal(viewTarget); viewTarget = null">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              Edit
            </button>
          </div>

        </div>
      </div>
    </Transition></Teleport>

    <!-- ══ PHOTO LIGHTBOX ══ -->
    <Teleport to="body"><Transition name="modal-fade">
      <div class="lightbox-overlay" v-if="lightboxUrl" @click="lightboxUrl = null">
        <img :src="lightboxUrl" class="lightbox-img" @click.stop />
        <button class="lightbox-close" @click="lightboxUrl = null">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="18" height="18"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
    </Transition></Teleport>

    <!-- ══ DELETE CONFIRM ══ -->
    <Teleport to="body"><Transition name="modal-fade">
      <div class="modal-overlay" v-if="deleteTarget" @click.self="deleteTarget = null">
        <div class="modal modal-sm">
          <div class="modal-header">
            <div class="modal-title">Delete Activity</div>
            <button class="modal-close" @click="deleteTarget = null">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="16" height="16">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
          <div class="modal-body">
            <div class="delete-confirm-text">
              Are you sure you want to delete
              <strong>"{{ deleteTarget?.title }}"</strong>?
              This action cannot be undone.
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-cancel" @click="deleteTarget = null">Cancel</button>
            <button class="btn-delete" @click="doDelete">Yes, Delete</button>
          </div>
        </div>
      </div>
    </Transition></Teleport>

  </div>
</template>

<!-- ══ SCRIPT — zero logic, all from composable ══ -->
<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useActivities, MASCOTS, STATUSES } from '@/composables/useActivities'
import { supabase } from '@/lib/supabase'

const {
  activities, loading,
  upcomingCount, ongoingCount, doneCount,
  notifications,
  getMascot, getStatus, formatDate, daysUntil,
  addActivity, updateActivity, deleteActivity, updateStatus,
  fetchActivities, subscribeRealtime, unsubscribeRealtime,
} = useActivities()

// ── View detail ───────────────────────────────
const viewTarget = ref(null)
function viewActivity(act) { viewTarget.value = act }

// ── Image upload ──────────────────────────────
const fileInputRef     = ref(null)
const imagePreview     = ref('')
const imageFile        = ref(null)
const imageError       = ref('')
const uploadingImage   = ref(false)
const uploadProgress   = ref(0)
const lightboxUrl      = ref('')

function triggerFileInput() { fileInputRef.value?.click() }

function handleFileChange(e) { processFile(e.target.files[0]) }
function handleDrop(e) { processFile(e.dataTransfer.files[0]) }

function processFile(file) {
  imageError.value = ''
  if (!file) return
  if (!file.type.startsWith('image/')) { imageError.value = 'Please upload an image file'; return }
  if (file.size > 5 * 1024 * 1024) { imageError.value = 'Image must be under 5MB'; return }
  imageFile.value = file
  const reader = new FileReader()
  reader.onload = e => { imagePreview.value = e.target.result }
  reader.readAsDataURL(file)
}

function removeImage() {
  imageFile.value    = null
  imagePreview.value = ''
  modalForm.value.imageUrl = ''
  if (fileInputRef.value) fileInputRef.value.value = ''
}

async function uploadImage() {
  if (!imageFile.value) return modalForm.value.imageUrl || null
  uploadingImage.value = true
  uploadProgress.value = 30
  imageError.value = ''

  try {
    const ext      = imageFile.value.name.split('.').pop()
    const filename = `activity-${Date.now()}.${ext}`
    const { data, error } = await supabase.storage
      .from('activity-images')
      .upload(filename, imageFile.value, { upsert: true })

    uploadProgress.value = 90

    if (error) {
      console.error('Upload error:', error)
      imageError.value = 'Upload failed: ' + error.message
      uploadingImage.value = false
      uploadProgress.value = 0
      return modalForm.value.imageUrl || null // fall back to existing or null
    }

    const { data: urlData } = supabase.storage.from('activity-images').getPublicUrl(data.path)
    uploadingImage.value = false
    uploadProgress.value = 100
    return urlData.publicUrl

  } catch (err) {
    console.error('Upload exception:', err)
    uploadingImage.value = false
    uploadProgress.value = 0
    return modalForm.value.imageUrl || null // don't block save on upload failure
  }
}

function viewPhoto(url) { lightboxUrl.value = url }

onMounted(async () => {
  await fetchActivities()
  subscribeRealtime()
})

onUnmounted(() => {
  unsubscribeRealtime()
})

// ── Filter ────────────────────────────────────
const filterStatus = ref('all')
const filtered = computed(() =>
  filterStatus.value === 'all'
    ? activities.value
    : activities.value.filter(a => a.status === filterStatus.value)
)

// ── Notification banner ───────────────────────
const showNotif = ref(true)

// ── Status cycling ────────────────────────────
function nextStatusLabel(status) {
  return { upcoming: 'Mark Ongoing', ongoing: 'Mark Done' }[status] || ''
}
function cycleStatus(act) {
  const next = { upcoming: 'ongoing', ongoing: 'done' }[act.status]
  if (next) updateStatus(act.id, next)
}

// ── Modal state ───────────────────────────────
const showModal  = ref(false)
const editing    = ref(null)
const formErrors = ref({})

const emptyForm = () => ({
  mascot:         'megaphone',
  title:          '',
  description:    '',
  date:           '',
  time:           '08:00',
  assignedTo:     'Admin User',
  status:         'upcoming',
  notifyBefore:   1,
  inventoryItems: [],
  imageUrl:       '',
  link:           '',
})

const modalForm = ref(emptyForm())

function openModal(act = null) {
  formErrors.value = {}
  imageFile.value    = null
  imagePreview.value = ''
  imageError.value   = ''
  if (act) {
    editing.value  = act.id
    modalForm.value = {
      mascot:         act.mascot,
      title:          act.title,
      description:    act.description || '',
      date:           act.date,
      time:           act.time || '08:00',
      assignedTo:     act.assigned_to,
      status:         act.status,
      notifyBefore:   act.notify_before ?? 1,
      inventoryItems: (act.inventory_items || []).map(i => ({ ...i })),
      imageUrl:       act.image_url || '',
      link:           act.link || '',
    }
  } else {
    editing.value   = null
    modalForm.value = emptyForm()
  }
  showModal.value = true
}

function closeModal() {
  showModal.value = false
  editing.value   = null
  formErrors.value = {}
}

// Inventory item rows
function addItemRow() {
  modalForm.value.inventoryItems.push({ name: '', sku: '', qty: 1 })
}
function removeItemRow(idx) {
  modalForm.value.inventoryItems.splice(idx, 1)
}

// Validate & save
function validateForm() {
  const e = {}
  if (!modalForm.value.title.trim())      e.title      = 'Title is required'
  if (!modalForm.value.date)              e.date       = 'Date is required'
  if (!modalForm.value.assignedTo.trim()) e.assignedTo = 'Assignee is required'
  formErrors.value = e
  return Object.keys(e).length === 0
}

async function saveActivity() {
  if (!validateForm()) return
  const imageUrl = await uploadImage()
  const data = { ...modalForm.value, imageUrl: imageUrl ?? modalForm.value.imageUrl ?? null }
  if (editing.value) {
    updateActivity(editing.value, data)
  } else {
    addActivity(data)
  }
  closeModal()
}

// ── Delete ────────────────────────────────────
const deleteTarget = ref(null)
function confirmDelete(act) { deleteTarget.value = act }
function doDelete() {
  if (deleteTarget.value) deleteActivity(deleteTarget.value.id)
  deleteTarget.value = null
}
</script>

<!-- ══ STYLES ══ -->

<style scoped>

.activities-page {
  width: 100%; box-sizing: border-box;
  display: flex; flex-direction: column; gap: 20px;
  animation: fadeUp 0.4s both;
}

/* Notification banner */
.notif-banner {
  background: linear-gradient(135deg, #7A0A17, #B01020);
  border-radius: 14px;
  padding: 14px 18px;
  display: flex; align-items: center; justify-content: space-between;
  gap: 14px;
  box-shadow: 0 4px 16px rgba(176,16,32,0.25);
}
.notif-inner { display: flex; align-items: center; gap: 12px; }
.notif-icon {
  width: 32px; height: 32px;
  background: rgba(255,255,255,0.15); border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  color: white; flex-shrink: 0;
}
.notif-text { font-size: 13px; color: rgba(255,255,255,0.9); line-height: 1.5; }
.notif-text strong { color: white; font-weight: 600; }
.notif-text em { font-style: normal; color: rgba(255,255,255,0.75); }
.notif-close {
  background: rgba(255,255,255,0.15); border: none; border-radius: 7px;
  color: white; cursor: pointer; padding: 6px;
  display: flex; align-items: center; flex-shrink: 0;
  transition: background 0.18s;
}
.notif-close:hover { background: rgba(255,255,255,0.25); }

/* Page header */
.page-header {
  display: flex; align-items: flex-start; justify-content: space-between; gap: 12px;
}
.page-title {
  font-family: 'Cormorant Garamond', serif;
  font-size: 28px; font-weight: 600; color: #1A1016;
}
.page-sub { font-size: 13px; color: #9A8589; margin-top: 3px; }

.btn-add {
  display: flex; align-items: center; gap: 7px;
  padding: 10px 18px; background: #B01020; color: white;
  border: none; border-radius: 11px;
  font-family: 'Outfit', sans-serif; font-size: 13px; font-weight: 600;
  cursor: pointer; white-space: nowrap; transition: all 0.2s;
  box-shadow: 0 4px 12px rgba(176,16,32,0.25);
}
.btn-add:hover { background: #7A0A17; transform: translateY(-1px); box-shadow: 0 6px 18px rgba(176,16,32,0.3); }

/* Filter pills */
.stat-pills {
  display: flex; gap: 8px; flex-wrap: wrap;
}
.pill {
  display: flex; align-items: center; gap: 7px;
  padding: 7px 14px;
  background: white; border: 1.5px solid #EDE3E5; border-radius: 30px;
  font-size: 13px; font-weight: 400; color: #6B5257;
  cursor: pointer; transition: all 0.18s; user-select: none;
}
.pill:hover { border-color: #B01020; color: #B01020; }
.pill.active { background: #B01020; border-color: #B01020; color: white; }
.pill.active .pill-count { background: rgba(255,255,255,0.25); color: white; }
.pill-count {
  background: #F0E5E7; color: #9A8589;
  font-size: 11px; font-weight: 600;
  padding: 1px 7px; border-radius: 20px;
}
.pill-dot {
  width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0;
}
.dot-upcoming { background: #3B82F6; }
.dot-ongoing  { background: #F59E0B; }
.dot-done     { background: #22C55E; }

/* Cards grid */
.cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
  gap: 16px;
}

/* Activity card */
.activity-card {
  background: white;
  border-radius: 18px;
  border: 1.5px solid #EDE3E5;
  padding: 20px;
  display: flex; flex-direction: column; gap: 14px;
  transition: all 0.2s;
  position: relative;
  overflow: hidden;
}
.activity-card::before {
  content: '';
  position: absolute; top: 0; left: 0; right: 0;
  height: 3px;
}
.card-upcoming::before { background: linear-gradient(90deg, #3B82F6, #60A5FA); }
.card-ongoing::before  { background: linear-gradient(90deg, #F59E0B, #FCD34D); }
.card-done::before     { background: linear-gradient(90deg, #22C55E, #86EFAC); }

.activity-card:hover { transform: translateY(-2px); box-shadow: 0 8px 28px rgba(176,16,32,0.1); }
.card-done { opacity: 0.75; }

/* Card header */
.card-header {
  display: flex; align-items: flex-start; gap: 12px;
}
.card-mascot {
  font-size: 32px; line-height: 1; flex-shrink: 0;
  width: 52px; height: 52px;
  background: #FFF5F6; border-radius: 14px;
  display: flex; align-items: center; justify-content: center;
  border: 1.5px solid #EDE3E5;
}
.card-header-info { flex: 1; min-width: 0; }
.card-title {
  font-size: 14px; font-weight: 600; color: #1A1016;
  line-height: 1.4;
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
  overflow: hidden;
}
.card-date {
  display: flex; align-items: center; gap: 5px;
  font-size: 11px; color: #9A8589; margin-top: 5px; flex-wrap: wrap;
}
.card-countdown {
  padding: 1px 7px; border-radius: 20px;
  font-size: 10px; font-weight: 600;
  margin-left: 4px;
}
.countdown-upcoming { background: #EFF6FF; color: #2563EB; }
.countdown-ongoing  { background: #FFFBEB; color: #D97706; }
.countdown-done     { background: #F0FDF4; color: #16A34A; }

/* Status badge */
.card-status-badge {
  font-size: 10px; font-weight: 700;
  padding: 3px 10px; border-radius: 20px;
  letter-spacing: 0.5px; text-transform: uppercase;
  flex-shrink: 0;
}
.status-upcoming { background: #EFF6FF; color: #2563EB; }
.status-ongoing  { background: #FFFBEB; color: #D97706; }
.status-done     { background: #F0FDF4; color: #16A34A; }

/* Description */
.card-desc {
  font-size: 12.5px; color: #6B5257; line-height: 1.6;
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Activity photo on card */
.card-photo-wrap { border-radius: 10px; overflow: hidden; max-height: 180px; cursor: zoom-in; }
.card-photo { width: 100%; height: 180px; object-fit: cover; display: block; transition: transform 0.2s; }
.card-photo:hover { transform: scale(1.02); }

/* Activity link on card */
.card-link { display: inline-flex; align-items: center; gap: 5px; font-size: 11.5px; color: #B01020; text-decoration: none; background: #FFF5F6; padding: 5px 10px; border-radius: 20px; border: 1px solid #FECDD3; transition: all 0.15s; word-break: break-all; }
.card-link:hover { background: #B01020; color: white; border-color: #B01020; }

/* Photo upload in modal */
.form-section-divider { display: flex; align-items: center; gap: 10px; color: #9A8589; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; margin: 4px 0; }
.form-section-divider::before, .form-section-divider::after { content: ''; flex: 1; height: 1px; background: #EDE3E5; }
.photo-upload-area { border: 2px dashed #E0D0D4; border-radius: 12px; cursor: pointer; overflow: hidden; transition: border-color 0.2s; }
.photo-upload-area:hover { border-color: #B01020; }
.photo-placeholder { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; padding: 28px 20px; color: #9A8589; }
.photo-placeholder span { font-size: 13px; }
.photo-hint { font-size: 11px !important; color: #C4B0B5; }
.photo-preview-wrap { position: relative; }
.photo-preview { width: 100%; max-height: 200px; object-fit: cover; display: block; }
.photo-remove { position: absolute; top: 8px; right: 8px; background: rgba(0,0,0,0.6); border: none; border-radius: 50%; width: 26px; height: 26px; display: flex; align-items: center; justify-content: center; color: white; cursor: pointer; }
.upload-progress { height: 4px; background: #F5F0F1; border-radius: 2px; margin-top: 6px; overflow: hidden; }
.upload-bar { height: 100%; background: #B01020; border-radius: 2px; transition: width 0.3s; }
.link-input-wrap { position: relative; display: flex; align-items: center; }
.link-icon { position: absolute; left: 12px; color: #9A8589; flex-shrink: 0; }
.link-input { padding-left: 34px !important; }

/* Activity Detail Drawer */
.drawer-overlay { position: fixed; inset: 0; z-index: 9998; background: rgba(26,16,22,0.55); display: flex; align-items: center; justify-content: center; padding: 24px; backdrop-filter: blur(4px); }
.drawer { width: 100%; max-width: 600px; max-height: 88vh; background: white; border-radius: 20px; display: flex; flex-direction: column; box-shadow: 0 24px 60px rgba(0,0,0,0.2); overflow: hidden; position: relative; }
.drawer-close { position: absolute; top: 14px; right: 14px; z-index: 10; background: rgba(255,255,255,0.9); border: none; border-radius: 50%; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; cursor: pointer; color: #555; box-shadow: 0 2px 8px rgba(0,0,0,0.12); }
.drawer-close:hover { background: white; color: #B01020; }
.drawer-photo { position: relative; height: 220px; overflow: hidden; cursor: zoom-in; flex-shrink: 0; }
.drawer-photo img { width: 100%; height: 100%; object-fit: cover; }
.drawer-photo-zoom { position: absolute; bottom: 10px; right: 10px; background: rgba(0,0,0,0.5); border-radius: 8px; padding: 6px; color: white; display: flex; align-items: center; }
.drawer-header { display: flex; align-items: flex-start; gap: 12px; padding: 20px 20px 0; flex-shrink: 0; }
.drawer-mascot { font-size: 28px; flex-shrink: 0; }
.drawer-header-info { flex: 1; min-width: 0; }
.drawer-title { font-family: 'Cormorant Garamond', serif; font-size: 22px; font-weight: 700; color: #1A1016; line-height: 1.2; }
.drawer-date { display: flex; align-items: center; gap: 5px; font-size: 12px; color: #9A8589; margin-top: 4px; flex-wrap: wrap; }
.drawer-countdown { font-size: 11px; font-weight: 600; padding: 1px 7px; border-radius: 20px; background: #F5F0F1; color: #7A5A60; }
.drawer-status-badge { font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 20px; white-space: nowrap; flex-shrink: 0; }
.drawer-body { flex: 1; overflow-y: auto; padding: 18px 20px; display: flex; flex-direction: column; gap: 18px; }
.drawer-section { display: flex; flex-direction: column; gap: 8px; }
.drawer-section-title { display: flex; align-items: center; gap: 6px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: #9A8589; }
.drawer-desc { font-size: 13.5px; color: #3D2830; line-height: 1.7; }
.drawer-details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.drawer-detail-item { background: #FAF6F7; border-radius: 12px; padding: 12px 14px; }
.drawer-detail-label { font-size: 11px; font-weight: 600; color: #9A8589; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 6px; }
.drawer-detail-value { font-size: 13.5px; font-weight: 600; color: #1A1016; display: flex; align-items: center; gap: 6px; }
.drawer-avatar { width: 22px; height: 22px; background: #B01020; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; flex-shrink: 0; }
.drawer-inv-table { border: 1.5px solid #EDE3E5; border-radius: 10px; overflow: hidden; }
.drawer-inv-row { display: grid; grid-template-columns: 1fr 80px 50px; padding: 9px 12px; font-size: 13px; border-bottom: 1px solid #F5F0F1; }
.drawer-inv-row:last-child { border-bottom: none; }
.drawer-inv-head { background: #FAF6F7; font-size: 11px; font-weight: 700; color: #9A8589; text-transform: uppercase; }
.drawer-inv-sku { color: #9A8589; }
.drawer-inv-qty { font-weight: 700; color: #B01020; }
.drawer-link { font-size: 13px; color: #B01020; word-break: break-all; text-decoration: none; padding: 10px 12px; background: #FFF5F6; border-radius: 10px; border: 1px solid #FECDD3; display: block; }
.drawer-link:hover { background: #B01020; color: white; }
.drawer-footer { display: flex; gap: 10px; padding: 16px 20px; border-top: 1.5px solid #F5F0F1; flex-shrink: 0; justify-content: flex-end; }
.drawer-fade-enter-active, .drawer-fade-leave-active { transition: opacity 0.2s; }
.drawer-fade-enter-active .drawer, .drawer-fade-leave-active .drawer { transition: transform 0.2s cubic-bezier(0.4,0,0.2,1); }
.drawer-fade-enter-from, .drawer-fade-leave-to { opacity: 0; }
.drawer-fade-enter-from .drawer, .drawer-fade-leave-to .drawer { transform: scale(0.96); }
.activity-card { cursor: pointer; }

/* Lightbox */
.lightbox-overlay { position: fixed; inset: 0; z-index: 99999; background: rgba(0,0,0,0.85); display: flex; align-items: center; justify-content: center; padding: 24px; cursor: zoom-out; }
.lightbox-img { max-width: 90vw; max-height: 88vh; border-radius: 12px; object-fit: contain; box-shadow: 0 20px 60px rgba(0,0,0,0.5); cursor: default; }
.lightbox-close { position: absolute; top: 20px; right: 20px; background: rgba(255,255,255,0.15); border: none; border-radius: 50%; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; color: white; cursor: pointer; }
.lightbox-close:hover { background: rgba(255,255,255,0.25); }

/* Inventory section */
.card-section { display: flex; flex-direction: column; gap: 8px; }
.card-section-title {
  display: flex; align-items: center; gap: 6px;
  font-size: 11px; font-weight: 600;
  color: #9A8589; text-transform: uppercase; letter-spacing: 1px;
}
.inventory-chips { display: flex; flex-wrap: wrap; gap: 6px; }
.inv-chip {
  display: flex; align-items: center; gap: 5px;
  padding: 4px 10px;
  background: #F7F3F4; border: 1px solid #EDE3E5;
  border-radius: 8px; font-size: 11.5px;
}
.inv-chip-name { color: #3D2830; font-weight: 500; }
.inv-chip-qty  { color: #B01020; font-weight: 700; font-size: 11px; }

/* Card footer */
.card-footer {
  display: flex; align-items: center; gap: 10px;
  padding-top: 10px;
  border-top: 1px solid #F0E5E7;
  flex-wrap: wrap;
}
.card-assignee { display: flex; align-items: center; gap: 7px; margin-right: auto; }
.assignee-avatar {
  width: 24px; height: 24px; border-radius: 50%;
  background: #B01020; color: white;
  font-size: 11px; font-weight: 700;
  display: flex; align-items: center; justify-content: center;
}
.assignee-name { font-size: 12px; color: #6B5257; font-weight: 500; }

.card-notify {
  display: flex; align-items: center; gap: 5px;
  font-size: 11px; color: #9A8589;
}

.card-actions { display: flex; align-items: center; gap: 6px; }

.btn-status {
  display: flex; align-items: center; gap: 5px;
  padding: 5px 11px;
  background: #F7F3F4; border: 1.5px solid #EDE3E5;
  border-radius: 8px; cursor: pointer;
  font-family: 'Outfit', sans-serif; font-size: 11px; font-weight: 600;
  color: #3D2830; transition: all 0.18s;
}
.btn-status:hover { background: #FFF5F6; border-color: #B01020; color: #B01020; }

.btn-icon-sm {
  width: 28px; height: 28px; border-radius: 8px;
  background: #F7F3F4; border: 1.5px solid #EDE3E5;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; color: #9A8589; transition: all 0.18s;
}
.btn-icon-sm:hover { background: #FFF5F6; border-color: #B01020; color: #B01020; }
.btn-del:hover { background: #FFF5F6; border-color: #E8394A; color: #E8394A; }

/* Empty state */
.empty-state {
  display: flex; flex-direction: column; align-items: center;
  justify-content: center; gap: 12px; padding: 80px 20px;
  text-align: center;
}
.empty-icon  { font-size: 48px; }
.empty-title { font-family: 'Cormorant Garamond', serif; font-size: 24px; font-weight: 600; color: #1A1016; }
.empty-sub   { font-size: 13px; color: #9A8589; }

/* ── MODAL ── */
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
  width: 100%; max-width: 580px;
  max-height: 90vh; display: flex; flex-direction: column;
  box-shadow: 0 24px 64px rgba(0,0,0,0.18);
}
.modal-sm { max-width: 420px; }

.modal-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 20px 24px 0; flex-shrink: 0;
}
.modal-title {
  font-family: 'Cormorant Garamond', serif;
  font-size: 22px; font-weight: 600; color: #1A1016;
}
.modal-close {
  background: #F7F3F4; border: none; border-radius: 8px;
  color: #9A8589; cursor: pointer;
  width: 30px; height: 30px;
  display: flex; align-items: center; justify-content: center;
  transition: all 0.18s;
}
.modal-close:hover { background: #FFF5F6; color: #B01020; }

.modal-body {
  padding: 20px 24px;
  overflow-y: auto; flex: 1;
  display: flex; flex-direction: column; gap: 16px;
}
.modal-body::-webkit-scrollbar { width: 4px; }
.modal-body::-webkit-scrollbar-thumb { background: #E0CBCE; border-radius: 3px; }

.modal-footer {
  padding: 16px 24px 20px;
  display: flex; justify-content: flex-end; gap: 10px;
  border-top: 1px solid #EDE3E5; flex-shrink: 0;
}

/* Form fields */
.form-label {
  display: block; font-size: 10px; font-weight: 600;
  letter-spacing: 2px; text-transform: uppercase;
  color: #3D2830; margin-bottom: 7px;
}
.req { color: #B01020; }
.form-input {
  width: 100%; padding: 10px 14px;
  border: 1.5px solid #EBE0E2; border-radius: 10px;
  font-family: 'Outfit', sans-serif; font-size: 13px; color: #1A1016;
  background: #FFF5F6; outline: none; transition: all 0.2s;
}
.form-input:focus { border-color: #B01020; background: white; box-shadow: 0 0 0 3px rgba(176,16,32,0.08); }
.form-textarea { resize: vertical; min-height: 80px; }
.form-select { cursor: pointer; }
.form-error { font-size: 11px; color: #E8394A; margin-top: 4px; }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }

/* Mascot grid */
.mascot-grid { display: flex; flex-wrap: wrap; gap: 8px; }
.mascot-option {
  width: 40px; height: 40px; border-radius: 10px; font-size: 20px;
  display: flex; align-items: center; justify-content: center;
  border: 1.5px solid #EBE0E2; background: #FFF5F6;
  cursor: pointer; transition: all 0.15s;
}
.mascot-option:hover { border-color: #B01020; transform: scale(1.1); }
.mascot-option.selected { border-color: #B01020; background: #FFE8EB; box-shadow: 0 0 0 3px rgba(176,16,32,0.12); }

/* Notify chips */
.notify-options { display: flex; gap: 8px; flex-wrap: wrap; }
.notify-chip {
  padding: 5px 14px; border-radius: 20px;
  font-size: 12px; font-weight: 600;
  border: 1.5px solid #EBE0E2; background: #FFF5F6;
  cursor: pointer; transition: all 0.15s; color: #6B5257;
}
.notify-chip:hover { border-color: #B01020; color: #B01020; }
.notify-chip.selected { background: #B01020; border-color: #B01020; color: white; }

/* Inventory rows */
.inv-label-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 7px; }
.btn-add-item {
  font-size: 12px; font-weight: 600; color: #B01020;
  background: none; border: none; cursor: pointer; padding: 0;
  transition: opacity 0.18s;
}
.btn-add-item:hover { opacity: 0.7; }
.inv-rows { display: flex; flex-direction: column; gap: 8px; }
.inv-row { display: flex; gap: 8px; align-items: center; }
.inv-input-name { flex: 2; }
.inv-input-sku  { flex: 1; }
.inv-input-qty  { width: 72px; flex-shrink: 0; }
.btn-remove-item {
  width: 28px; height: 28px; flex-shrink: 0;
  background: #FFF5F6; border: 1.5px solid #EDE3E5; border-radius: 7px;
  display: flex; align-items: center; justify-content: center;
  color: #9A8589; cursor: pointer; transition: all 0.15s;
}
.btn-remove-item:hover { background: #FFE8EB; border-color: #E8394A; color: #E8394A; }
.inv-empty { font-size: 12px; color: #C4ADAF; padding: 10px 0; text-align: center; }

/* Modal buttons */
.btn-cancel {
  padding: 10px 20px; background: none;
  border: 1.5px solid #EDE3E5; border-radius: 10px;
  font-family: 'Outfit', sans-serif; font-size: 13px; font-weight: 500;
  color: #9A8589; cursor: pointer; transition: all 0.18s;
}
.btn-cancel:hover { border-color: #9A8589; color: #3D2830; }
.btn-save {
  padding: 10px 22px; background: #B01020; color: white;
  border: none; border-radius: 10px;
  font-family: 'Outfit', sans-serif; font-size: 13px; font-weight: 600;
  cursor: pointer; transition: all 0.2s;
}
.btn-save:hover { background: #7A0A17; box-shadow: 0 4px 14px rgba(176,16,32,0.3); }
.btn-delete {
  padding: 10px 22px; background: #E8394A; color: white;
  border: none; border-radius: 10px;
  font-family: 'Outfit', sans-serif; font-size: 13px; font-weight: 600;
  cursor: pointer; transition: all 0.2s;
}
.btn-delete:hover { background: #C0142A; }

.delete-confirm-text { font-size: 14px; color: #3D2830; line-height: 1.6; }
.delete-confirm-text strong { color: #1A1016; }

/* Transitions */
.notif-enter-active { transition: all 0.4s cubic-bezier(0.16,1,0.3,1); }
.notif-leave-active { transition: all 0.25s ease; }
.notif-enter-from   { opacity: 0; transform: translateY(-12px); }
.notif-leave-to     { opacity: 0; transform: translateY(-8px); }

.modal-fade-enter-active { transition: all 0.3s cubic-bezier(0.16,1,0.3,1); }
.modal-fade-leave-active { transition: all 0.2s ease; }
.modal-fade-enter-from   { opacity: 0; }
.modal-fade-leave-to     { opacity: 0; }
.modal-fade-enter-from .modal { transform: scale(0.95) translateY(16px); }

@keyframes fadeUp {
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: none; }
}

/* Responsive */
@media (max-width: 768px) {
  .page-header { flex-direction: column; align-items: stretch; }
  .btn-add { justify-content: center; }
  .stat-pills { overflow-x: auto; flex-wrap: nowrap; padding-bottom: 4px; }
  .cards-grid { grid-template-columns: 1fr; }
  .form-row   { grid-template-columns: 1fr; }
  .inv-row    { flex-wrap: wrap; }
  .inv-input-qty { width: 100%; }
  .card-footer { flex-direction: column; align-items: flex-start; }
  .card-actions { width: 100%; justify-content: flex-end; }
  .modal { margin: 12px; max-height: 95vh; }
}
@media (max-width: 480px) {
  .page-title { font-size: 22px; }
  .notif-text { font-size: 12px; }
}
</style>