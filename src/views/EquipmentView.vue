<template>
  <div class="equipment-page">

    <!-- ── Header ── -->
    <div class="page-header">
      <div>
        <div class="page-title">Equipment</div>
        <div class="page-sub">Manage borrowing, usage tracking and returns</div>
      </div>
      <div class="header-actions">
        <button class="btn-secondary" @click="openItemsModal">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13">
            <rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
          </svg>
          Manage Equipment
        </button>
        <router-link to="/dashboard/equipment-scan" class="btn-scan-equip">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13"><path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/><line x1="7" y1="12" x2="17" y2="12"/></svg>
          Scan QR
        </router-link>
        <button class="btn-add" @click="openBorrowModal()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="14" height="14">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          New Borrow Request
        </button>
      </div>
    </div>

    <!-- ── Stat cards ── -->
    <div class="stat-cards">
      <div class="stat-card">
        <div class="stat-icon stat-icon-blue">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="20" height="20">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </div>
        <div>
          <div class="stat-val">{{ activeCount }}</div>
          <div class="stat-label">Currently Borrowed</div>
        </div>
      </div>
      <div class="stat-card stat-card-warn" v-if="overdueCount > 0">
        <div class="stat-icon stat-icon-red">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="20" height="20">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
        </div>
        <div>
          <div class="stat-val stat-val-red">{{ overdueCount }}</div>
          <div class="stat-label">Overdue</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon stat-icon-green">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="20" height="20">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>
        <div>
          <div class="stat-val">{{ returnedCount }}</div>
          <div class="stat-label">Total Returned</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon stat-icon-gold">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="20" height="20">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
          </svg>
        </div>
        <div>
          <div class="stat-val">{{ items.filter(i => i.is_available).length }}</div>
          <div class="stat-label">Available Items</div>
        </div>
      </div>
    </div>

    <!-- ── Tabs ── -->
    <div class="tabs">
      <button class="tab" :class="{ active: activeTab === 'borrow' }" @click="activeTab = 'borrow'">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
          <path d="M5 12h14M12 5l7 7-7 7"/>
        </svg>
        Borrow Requests
        <span class="tab-badge" v-if="pendingList.length">{{ pendingList.length }}</span>
      </button>
      <button class="tab" :class="{ active: activeTab === 'used' }" @click="activeTab = 'used'">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
          <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
        </svg>
        In Use
        <span class="tab-badge tab-badge-blue" v-if="borrowedList.length">{{ borrowedList.length }}</span>
      </button>
      <button class="tab" :class="{ active: activeTab === 'return' }" @click="activeTab = 'return'">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
          <polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.5"/>
        </svg>
        Returned
        <span class="tab-badge tab-badge-green" v-if="returnedList.length">{{ returnedList.length }}</span>
      </button>
    </div>

    <!-- ── Loading ── -->
    <div class="loading-state" v-if="loading">
      <div class="spinner-lg"></div>
      <span>Loading records…</span>
    </div>

    <!-- ══ TAB: BORROW REQUESTS ══ -->
    <div v-else-if="activeTab === 'borrow'">
      <div class="empty-state" v-if="pendingList.length === 0">
        <i class="bi bi-pc-display empty-bi"></i>
        <div class="empty-title">No pending requests</div>
        <div class="empty-sub">All borrow requests will appear here.</div>
        <button class="btn-add" @click="openBorrowModal()">+ New Borrow Request</button>
      </div>

      <div class="records-grid" v-else>
        <div class="record-card" v-for="r in pendingList" :key="r.id" :class="{ 'card-overdue': isOverdue(r) }">
          <div class="record-header">
            <div class="record-item-name">{{ r.item_name }}</div>
            <span class="status-badge" :class="isOverdue(r) ? 'status-overdue' : getStatus(r.status).cls">
              {{ isOverdue(r) ? 'Overdue' : getStatus(r.status).label }}
            </span>
          </div>

          <div class="record-body">
            <div class="record-field">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              <span>{{ r.borrower_name }}</span>
              <span class="field-dept" v-if="r.borrower_dept">· {{ r.borrower_dept }}</span>
            </div>
            <div class="record-field" v-if="r.borrower_contact">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13.1 19.79 19.79 0 0 1 1.61 4.56 2 2 0 0 1 3.6 2.36h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.18 6.18l.91-.91a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 21.73 17z"/></svg>
              <span>{{ r.borrower_contact }}</span>
            </div>
            <div class="record-field">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              <span>{{ formatDate(r.borrow_date) }} → {{ formatDate(r.expected_return) }}</span>
            </div>
            <div class="record-reason">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              <span>{{ r.reason }}</span>
            </div>
            <div class="record-reason" v-if="r.purpose_details" style="color:#9A8589">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              <span>{{ r.purpose_details }}</span>
            </div>
          </div>

          <div class="record-footer">
            <div class="record-qty">Qty: <strong>{{ r.quantity }}</strong></div>
            <div class="record-actions">
              <button class="btn-action btn-approve" @click="handleApprove(r)" v-if="r.status === 'pending'" title="Approve">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="12" height="12"><polyline points="20 6 9 17 4 12"/></svg>
                Approve
              </button>
              <button class="btn-action btn-mark-borrowed" @click="handleMarkBorrowed(r)" v-if="r.status === 'approved'" title="Mark as Borrowed">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                Mark Borrowed
              </button>
              <button class="btn-icon-sm" @click="openBorrowModal(r)" title="Edit">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              </button>
              <button class="btn-icon-sm btn-del-sm" @click="handleCancel(r)" title="Cancel">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ══ TAB: IN USE ══ -->
    <div v-else-if="activeTab === 'used'">
      <div class="empty-state" v-if="borrowedList.length === 0">
        <div class="empty-icon">🔧</div>
        <div class="empty-title">No equipment in use</div>
        <div class="empty-sub">Approved and borrowed items will appear here.</div>
      </div>

      <div class="records-grid" v-else>
        <div class="record-card" v-for="r in borrowedList" :key="r.id" :class="{ 'card-overdue': isOverdue(r) }">
          <div class="record-header">
            <div class="record-item-name">{{ r.item_name }}</div>
            <span class="status-badge" :class="isOverdue(r) ? 'status-overdue' : getStatus(r.status).cls">
              {{ isOverdue(r) ? 'OVERDUE' : getStatus(r.status).label }}
            </span>
          </div>

          <div class="overdue-banner" v-if="isOverdue(r)">
            <i class="bi bi-exclamation-triangle-fill text-danger me-1"></i>{{ daysOverdue(r.expected_return) }} day{{ daysOverdue(r.expected_return) !== 1 ? 's' : '' }} overdue — expected {{ formatDate(r.expected_return) }}
          </div>

          <div class="record-body">
            <div class="record-field">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              <span>{{ r.borrower_name }}</span>
              <span class="field-dept" v-if="r.borrower_dept">· {{ r.borrower_dept }}</span>
            </div>
            <div class="record-field" v-if="r.borrower_contact">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13.1 19.79 19.79 0 0 1 1.61 4.56 2 2 0 0 1 3.6 2.36h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.18 6.18l.91-.91a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 21.73 17z"/></svg>
              <span>{{ r.borrower_contact }}</span>
            </div>
            <div class="record-field">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              <span>Due: <strong>{{ formatDate(r.expected_return) }}</strong></span>
            </div>
            <div class="record-reason">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              <span>{{ r.reason }}</span>
            </div>
          </div>

          <div class="record-footer">
            <div class="record-qty">Qty: <strong>{{ r.quantity }}</strong></div>
            <div class="record-actions">
              <button class="btn-action btn-return" @click="openReturnModal(r)">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.5"/></svg>
                Process Return
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ══ TAB: RETURNED ══ -->
    <div v-else-if="activeTab === 'return'">
      <div class="empty-state" v-if="returnedList.length === 0">
        <i class="bi bi-check-circle-fill empty-bi" style="color:#16A34A;"></i>
        <div class="empty-title">No returned items yet</div>
        <div class="empty-sub">Completed returns will be logged here.</div>
      </div>

      <div class="table-wrap" v-else>
        <table class="ret-table">
          <thead>
            <tr>
              <th>Equipment</th>
              <th>Borrower</th>
              <th>Borrowed</th>
              <th>Returned</th>
              <th>Condition</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            <tr class="table-row" v-for="r in returnedList" :key="r.id">
              <td>
                <div class="product-name">{{ r.item_name }}</div>
                <div class="product-sub" v-if="r.equipment_items?.category">{{ r.equipment_items.category }}</div>
              </td>
              <td>
                <div class="product-name">{{ r.borrower_name }}</div>
                <div class="product-sub" v-if="r.borrower_dept">{{ r.borrower_dept }}</div>
              </td>
              <td>{{ formatDate(r.borrow_date) }}</td>
              <td>{{ formatDate(r.actual_return || r.returned_at) }}</td>
              <td>
                <span class="cond-badge" :class="'cond-' + (r.condition_after || 'good')">
                  {{ r.condition_after || '—' }}
                </span>
              </td>
              <td class="notes-cell">{{ r.return_notes || '—' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>


    <!-- ══ BORROW REQUEST MODAL ══ -->
    <Teleport to="body"><Transition name="modal-fade">
      <div class="modal-overlay" v-if="showBorrowModal" @click.self="closeBorrowModal">
        <div class="modal modal-lg">
          <div class="modal-header">
            <div class="modal-title">{{ editingBorrow ? 'Edit Borrow Request' : 'New Borrow Request' }}</div>
            <button class="modal-close" @click="closeBorrowModal">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="16" height="16">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          <div class="modal-body">

            <!-- Section: Equipment -->
            <div class="form-section-title">Equipment Details</div>

            <div class="form-field">
              <label class="form-label">Equipment Item <span class="req">*</span></label>
              <select class="form-input form-select" v-model="borrowForm.equipment_id" @change="onEquipmentSelect">
                <option value="" disabled>Select equipment</option>
                <option
                  v-for="item in items"
                  :key="item.id"
                  :value="item.id"
                  :disabled="!item.is_available && borrowForm.equipment_id !== item.id"
                >
                  {{ item.name }} {{ !item.is_available ? '(Unavailable)' : '' }}
                </option>
              </select>
              <div class="form-error" v-if="bErrors.equipment_id">{{ bErrors.equipment_id }}</div>
            </div>

            <div class="form-row">
              <div class="form-field">
                <label class="form-label">Quantity <span class="req">*</span></label>
                <input class="form-input" type="number" v-model.number="borrowForm.quantity" min="1" placeholder="1" />
              </div>
              <div class="form-field">
                <label class="form-label">Condition (Before)</label>
                <select class="form-input form-select" v-model="borrowForm.condition_before">
                  <option v-for="c in CONDITION_OPTIONS" :key="c.value" :value="c.value">{{ c.label }}</option>
                </select>
              </div>
            </div>

            <!-- Section: Borrower -->
            <div class="form-section-title" style="margin-top:4px">Borrower Information</div>

            <div class="form-field">
              <label class="form-label">Full Name <span class="req">*</span></label>
              <input class="form-input" type="text" v-model="borrowForm.borrower_name" placeholder="e.g. Juan dela Cruz" />
              <div class="form-error" v-if="bErrors.borrower_name">{{ bErrors.borrower_name }}</div>
            </div>

            <div class="form-row">
              <div class="form-field">
                <label class="form-label">Department / Office</label>
                <input class="form-input" type="text" v-model="borrowForm.borrower_dept" placeholder="e.g. SLU Branding Office" />
              </div>
              <div class="form-field">
                <label class="form-label">Contact Number</label>
                <input class="form-input" type="text" v-model="borrowForm.borrower_contact" placeholder="e.g. 09xx-xxx-xxxx" />
              </div>
            </div>

            <!-- Section: Schedule -->
            <div class="form-section-title" style="margin-top:4px">Schedule</div>

            <div class="form-row">
              <div class="form-field">
                <label class="form-label">Borrow Date <span class="req">*</span></label>
                <input class="form-input" type="date" v-model="borrowForm.borrow_date" />
                <div class="form-error" v-if="bErrors.borrow_date">{{ bErrors.borrow_date }}</div>
              </div>
              <div class="form-field">
                <label class="form-label">Expected Return Date <span class="req">*</span></label>
                <input class="form-input" type="date" v-model="borrowForm.expected_return" />
                <div class="form-error" v-if="bErrors.expected_return">{{ bErrors.expected_return }}</div>
              </div>
            </div>

            <!-- Section: Purpose -->
            <div class="form-section-title" style="margin-top:4px">Purpose & Reason</div>

            <div class="form-field">
              <label class="form-label">Reason for Borrowing <span class="req">*</span></label>
              <input class="form-input" type="text" v-model="borrowForm.reason" placeholder="e.g. Documentation for Foundation Day event" />
              <div class="form-error" v-if="bErrors.reason">{{ bErrors.reason }}</div>
            </div>

            <div class="form-field">
              <label class="form-label">Additional Details</label>
              <textarea class="form-input form-textarea" v-model="borrowForm.purpose_details" rows="2"
                placeholder="Where will it be used? Any special requirements or instructions…"></textarea>
            </div>

          </div>

          <div class="modal-footer">
            <button class="btn-cancel" @click="closeBorrowModal" :disabled="saving">Cancel</button>
            <button class="btn-save" @click="saveBorrow" :disabled="saving">
              <div class="spinner-sm" v-if="saving"></div>
              <span v-else>{{ editingBorrow ? 'Save Changes' : 'Submit Request' }}</span>
            </button>
          </div>
        </div>
      </div>
    </Transition></Teleport>


    <!-- ══ RETURN MODAL ══ -->
    <Teleport to="body"><Transition name="modal-fade">
      <div class="modal-overlay" v-if="showReturnModal" @click.self="closeReturnModal">
        <div class="modal">
          <div class="modal-header">
            <div class="modal-title">Process Return</div>
            <button class="modal-close" @click="closeReturnModal">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="16" height="16">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          <div class="modal-body" v-if="returningRecord">
            <div class="return-summary">
              <div class="return-item-name">{{ returningRecord.item_name }}</div>
              <div class="return-borrower">Borrowed by <strong>{{ returningRecord.borrower_name }}</strong></div>
            </div>

            <div class="form-field">
              <label class="form-label">Return Date <span class="req">*</span></label>
              <input class="form-input" type="date" v-model="returnForm.actual_return" />
            </div>

            <div class="form-field">
              <label class="form-label">Condition Upon Return <span class="req">*</span></label>
              <div class="cond-options">
                <div
                  class="cond-option"
                  v-for="c in CONDITION_OPTIONS"
                  :key="c.value"
                  :class="{ selected: returnForm.condition_after === c.value, ['opt-' + c.value]: true }"
                  @click="returnForm.condition_after = c.value"
                >{{ c.label }}</div>
              </div>
            </div>

            <div class="form-field">
              <label class="form-label">Return Notes</label>
              <textarea class="form-input form-textarea" v-model="returnForm.return_notes" rows="3"
                placeholder="Any damage, missing parts, or observations to note…"></textarea>
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn-cancel" @click="closeReturnModal" :disabled="saving">Cancel</button>
            <button class="btn-save" @click="saveReturn" :disabled="saving">
              <div class="spinner-sm" v-if="saving"></div>
              <span v-else>Confirm Return</span>
            </button>
          </div>
        </div>
      </div>
    </Transition></Teleport>


    <!-- ══ MANAGE EQUIPMENT ITEMS MODAL ══ -->
    <Teleport to="body"><Transition name="modal-fade">
      <div class="modal-overlay" v-if="showItemsModal" @click.self="showItemsModal = false">
        <div class="modal modal-lg">
          <div class="modal-header">
            <div class="modal-title">Manage Equipment</div>
            <button class="modal-close" @click="showItemsModal = false">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="16" height="16">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          <div class="modal-body">
            <!-- Add new item form -->
            <div class="add-item-box">
              <div class="form-section-title">Add New Equipment</div>
              <div class="form-row">
                <div class="form-field">
                  <label class="form-label">Name <span class="req">*</span></label>
                  <input class="form-input" type="text" v-model="newItem.name" placeholder="e.g. Canon EOS M50" />
                </div>
                <div class="form-field">
                  <label class="form-label">Category</label>
                  <select class="form-input form-select" v-model="newItem.category">
                    <option v-for="c in EQUIPMENT_CATEGORIES" :key="c" :value="c">{{ c }}</option>
                  </select>
                </div>
              </div>
              <div class="form-row">
                <div class="form-field">
                  <label class="form-label">Serial / Asset No.</label>
                  <input class="form-input" type="text" v-model="newItem.serial_no" placeholder="e.g. CAM-001" />
                </div>
                <div class="form-field">
                  <label class="form-label">Condition</label>
                  <select class="form-input form-select" v-model="newItem.condition">
                    <option v-for="c in CONDITION_OPTIONS" :key="c.value" :value="c.value">{{ c.label }}</option>
                  </select>
                </div>
              </div>
              <div class="form-field">
                <label class="form-label">Description</label>
                <input class="form-input" type="text" v-model="newItem.description" placeholder="Short description of the equipment" />
              </div>
              <div class="add-item-footer">
                <button class="btn-save" @click="saveNewItem" :disabled="saving" style="padding:8px 18px;font-size:12px">
                  <div class="spinner-sm" v-if="saving"></div>
                  <span v-else>+ Add Equipment</span>
                </button>
              </div>
            </div>

            <!-- Existing items list -->
            <div class="form-section-title" style="margin-top:4px">All Equipment ({{ items.length }})</div>
            <div class="items-list">
              <div class="item-row" v-for="item in items" :key="item.id">
                <div class="item-info">
                  <div class="item-name">{{ item.name }}</div>
                  <div class="item-meta">{{ item.category }} · {{ item.serial_no || 'No serial' }}</div>
                </div>
                <div class="item-badges">
                  <span class="avail-badge" :class="item.is_available ? 'avail-yes' : 'avail-no'">
                    {{ item.is_available ? 'Available' : 'In Use' }}
                  </span>
                  <span class="cond-badge" :class="'cond-' + item.condition">{{ item.condition }}</span>
                </div>
                <button class="btn-icon-sm btn-del-sm" @click="handleDeleteItem(item)" title="Remove">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12">
                    <polyline points="3 6 5 6 21 6"/>
                    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                  </svg>
                </button>
              </div>
              <div class="inv-empty" v-if="items.length === 0">No equipment added yet.</div>
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn-cancel" @click="showItemsModal = false">Close</button>
          </div>
        </div>
      </div>
    </Transition></Teleport>

    <!-- ── Toast ── -->
    <Teleport to="body"><Transition name="toast">
      <div class="toast" v-if="toast.show" :class="'toast-' + toast.type">{{ toast.message }}</div>
    </Transition></Teleport>

  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import {
  useEquipment,
  CONDITION_OPTIONS,
  EQUIPMENT_CATEGORIES,
} from '@/composables/useEquipment'

const {
  records, items, loading,
  borrowedList, returnedList, pendingList,
  activeCount, returnedCount, overdueCount,
  getStatus, formatDate, daysOverdue, isOverdue,
  fetchItems, fetchRecords, addItem, deleteItem,
  createBorrow, updateRecord,
  returnEquipment, approveRequest, markBorrowed, cancelRequest,
  subscribeRealtime, unsubscribeRealtime,
} = useEquipment()

onMounted(async () => {
  await Promise.all([fetchItems(), fetchRecords()])
  subscribeRealtime()
})
onUnmounted(() => unsubscribeRealtime())

// ── Tabs ──────────────────────────────────────
const activeTab = ref('borrow')

// ── Borrow modal ──────────────────────────────
const showBorrowModal = ref(false)
const editingBorrow   = ref(null)
const saving          = ref(false)
const bErrors         = ref({})

const emptyBorrowForm = () => ({
  equipment_id:     '',
  item_name:        '',
  borrower_name:    '',
  borrower_dept:    '',
  borrower_contact: '',
  borrow_date:      '',
  expected_return:  '',
  reason:           '',
  purpose_details:  '',
  quantity:         1,
  condition_before: 'good',
})
const borrowForm = ref(emptyBorrowForm())

function onEquipmentSelect() {
  const found = items.value.find(i => i.id === borrowForm.value.equipment_id)
  if (found) borrowForm.value.item_name = found.name
}

function openBorrowModal(record = null) {
  bErrors.value = {}
  if (record) {
    editingBorrow.value = record.id
    borrowForm.value = {
      equipment_id:     record.equipment_id,
      item_name:        record.item_name,
      borrower_name:    record.borrower_name,
      borrower_dept:    record.borrower_dept || '',
      borrower_contact: record.borrower_contact || '',
      borrow_date:      record.borrow_date,
      expected_return:  record.expected_return,
      reason:           record.reason,
      purpose_details:  record.purpose_details || '',
      quantity:         record.quantity,
      condition_before: record.condition_before || 'good',
    }
  } else {
    editingBorrow.value = null
    borrowForm.value = emptyBorrowForm()
  }
  showBorrowModal.value = true
}

function closeBorrowModal() {
  showBorrowModal.value = false
  editingBorrow.value   = null
  bErrors.value         = {}
}

function validateBorrow() {
  const e = {}
  if (!borrowForm.value.equipment_id)           e.equipment_id    = 'Please select an equipment item'
  if (!borrowForm.value.borrower_name.trim())   e.borrower_name   = 'Borrower name is required'
  if (!borrowForm.value.borrow_date)            e.borrow_date     = 'Borrow date is required'
  if (!borrowForm.value.expected_return)        e.expected_return = 'Return date is required'
  if (!borrowForm.value.reason.trim())          e.reason          = 'Reason is required'
  bErrors.value = e
  return Object.keys(e).length === 0
}

async function saveBorrow() {
  if (!validateBorrow()) return
  saving.value = true
  try {
    const payload = { ...borrowForm.value }
    if (editingBorrow.value) {
      await updateRecord(editingBorrow.value, payload)
      showToast('Request updated', 'success')
    } else {
      await createBorrow(payload)
      showToast('Borrow request submitted!', 'success')
    }
    closeBorrowModal()
  } catch (err) {
    showToast('Error: ' + err.message, 'error')
  } finally {
    saving.value = false
  }
}

// ── Status actions ────────────────────────────
async function handleApprove(r) {
  try {
    await approveRequest(r.id)
    showToast('Request approved', 'success')
  } catch (err) {
    showToast('Error: ' + err.message, 'error')
  }
}

async function handleMarkBorrowed(r) {
  try {
    await markBorrowed(r.id)
    showToast('Marked as borrowed', 'success')
  } catch (err) {
    showToast('Error: ' + err.message, 'error')
  }
}

async function handleCancel(r) {
  try {
    await cancelRequest(r.id)
    showToast('Request cancelled', 'success')
  } catch (err) {
    showToast('Error: ' + err.message, 'error')
  }
}

// ── Return modal ──────────────────────────────
const showReturnModal = ref(false)
const returningRecord = ref(null)
const returnForm      = ref({ actual_return: '', condition_after: 'good', return_notes: '' })

function openReturnModal(record) {
  returningRecord.value = record
  returnForm.value = {
    actual_return:   new Date().toISOString().split('T')[0],
    condition_after: 'good',
    return_notes:    '',
  }
  showReturnModal.value = true
}
function closeReturnModal() {
  showReturnModal.value = false
  returningRecord.value = null
}
async function saveReturn() {
  saving.value = true
  try {
    await returnEquipment(returningRecord.value.id, returnForm.value)
    showToast('Return processed successfully!', 'success')
    closeReturnModal()
  } catch (err) {
    showToast('Error: ' + err.message, 'error')
  } finally {
    saving.value = false
  }
}

// ── Manage items modal ────────────────────────
const showItemsModal = ref(false)
const newItem = ref({ name: '', category: 'Others', serial_no: '', condition: 'good', description: '' })

function openItemsModal() { showItemsModal.value = true }

async function saveNewItem() {
  if (!newItem.value.name.trim()) { showToast('Item name is required', 'error'); return }
  saving.value = true
  try {
    await addItem({ ...newItem.value })
    newItem.value = { name: '', category: 'Others', serial_no: '', condition: 'good', description: '' }
    showToast('Equipment added!', 'success')
  } catch (err) {
    showToast('Error: ' + err.message, 'error')
  } finally {
    saving.value = false
  }
}

async function handleDeleteItem(item) {
  try {
    await deleteItem(item.id)
    showToast('Equipment removed', 'success')
  } catch (err) {
    showToast('Error: ' + err.message, 'error')
  }
}

// ── Toast ─────────────────────────────────────
const toast = ref({ show: false, message: '', type: 'success' })
let toastTimer = null
function showToast(message, type = 'success') {
  if (toastTimer) clearTimeout(toastTimer)
  toast.value = { show: true, message, type }
  toastTimer = setTimeout(() => { toast.value.show = false }, 3000)
}
</script>


<style scoped>
.equipment-page {
  width: 100%; box-sizing: border-box; display: flex; flex-direction: column; gap: 20px; animation: fadeUp 0.4s both; }

/* Header */
.page-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
.page-title { font-family: 'Cormorant Garamond', serif; font-size: 28px; font-weight: 600; color: #1A1016; }
.page-sub { font-size: 13px; color: #9A8589; margin-top: 3px; }
.header-actions { display: flex; gap: 10px; flex-wrap: wrap; }

.btn-scan-equip {
  display: flex; align-items: center; gap: 7px;
  padding: 10px 16px; background: white; color: #3D2830;
  border: 1.5px solid #EDE3E5; border-radius: 11px;
  font-family: 'Outfit', sans-serif; font-size: 13px; font-weight: 600;
  cursor: pointer; white-space: nowrap; transition: all 0.2s;
  text-decoration: none;
}
.btn-scan-equip:hover { border-color: #B01020; color: #B01020; background: #FFF5F6; }
.btn-add {
  display: flex; align-items: center; gap: 7px;
  padding: 10px 18px; background: #B01020; color: white;
  border: none; border-radius: 11px;
  font-family: 'Outfit', sans-serif; font-size: 13px; font-weight: 600;
  cursor: pointer; white-space: nowrap; transition: all 0.2s;
  box-shadow: 0 4px 12px rgba(176,16,32,0.25);
}
.btn-add:hover { background: #7A0A17; transform: translateY(-1px); }

.btn-secondary {
  display: flex; align-items: center; gap: 7px;
  padding: 10px 16px; background: white; color: #3D2830;
  border: 1.5px solid #EDE3E5; border-radius: 11px;
  font-family: 'Outfit', sans-serif; font-size: 13px; font-weight: 500;
  cursor: pointer; white-space: nowrap; transition: all 0.2s;
}
.btn-secondary:hover { border-color: #B01020; color: #B01020; }

/* Stat cards */
.stat-cards { display: flex; gap: 12px; flex-wrap: wrap; }
.stat-card {
  display: flex; align-items: center; gap: 14px;
  padding: 16px 20px; background: white;
  border: 1.5px solid #EDE3E5; border-radius: 14px;
  flex: 1; min-width: 160px;
}
.stat-card-warn { border-color: #FECDD3; background: #FFF5F6; }
.stat-icon {
  width: 40px; height: 40px; border-radius: 10px;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.stat-icon-blue  { background: #EFF6FF; color: #2563EB; }
.stat-icon-green { background: #F0FDF4; color: #16A34A; }
.stat-icon-red   { background: #FFF5F6; color: #B01020; }
.stat-icon-gold  { background: #FFFBEB; color: #D97706; }
.stat-val { font-family: 'Cormorant Garamond', serif; font-size: 26px; font-weight: 600; color: #1A1016; line-height: 1; }
.stat-val-red { color: #B01020; }
.stat-label { font-size: 11px; color: #9A8589; margin-top: 3px; }

/* Tabs */
.tabs { display: flex; gap: 4px; background: #F7F3F4; border-radius: 12px; padding: 4px; width: fit-content; }
.tab {
  display: flex; align-items: center; gap: 7px;
  padding: 8px 16px; border-radius: 9px;
  font-family: 'Outfit', sans-serif; font-size: 13px; font-weight: 500;
  color: #9A8589; background: none; border: none; cursor: pointer;
  transition: all 0.18s; white-space: nowrap;
}
.tab:hover { color: #3D2830; }
.tab.active { background: white; color: #B01020; font-weight: 600; box-shadow: 0 1px 6px rgba(0,0,0,0.08); }
.tab-badge {
  background: #B01020; color: white;
  font-size: 10px; font-weight: 700;
  padding: 1px 6px; border-radius: 20px;
}
.tab-badge-blue  { background: #2563EB; }
.tab-badge-green { background: #16A34A; }

/* Loading */
.loading-state { display: flex; align-items: center; justify-content: center; gap: 12px; padding: 60px; color: #9A8589; font-size: 14px; }
.spinner-lg { width: 28px; height: 28px; border: 3px solid #EDE3E5; border-top-color: #B01020; border-radius: 50%; animation: spin 0.7s linear infinite; }

/* Empty */
.empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; padding: 80px 20px; text-align: center; }
.empty-icon { font-size: 48px; }
.empty-title { font-family: 'Cormorant Garamond', serif; font-size: 24px; font-weight: 600; color: #1A1016; }
.empty-sub { font-size: 13px; color: #9A8589; }

/* Records grid */
.records-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 14px; }
.record-card {
  background: white; border-radius: 16px;
  border: 1.5px solid #EDE3E5; padding: 18px;
  display: flex; flex-direction: column; gap: 12px;
  transition: all 0.2s;
}
.record-card:hover { box-shadow: 0 6px 24px rgba(176,16,32,0.08); transform: translateY(-1px); }
.card-overdue { border-color: #FECDD3; background: #FFFBFB; }

.record-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 10px; }
.record-item-name { font-size: 14px; font-weight: 600; color: #1A1016; line-height: 1.4; flex: 1; }

.overdue-banner {
  background: #FFF5F6; border: 1px solid #FECDD3;
  border-radius: 8px; padding: 8px 12px;
  font-size: 12px; color: #B01020; font-weight: 500;
}

.record-body { display: flex; flex-direction: column; gap: 6px; }
.record-field { display: flex; align-items: center; gap: 7px; font-size: 12.5px; color: #6B5257; }
.record-field svg { flex-shrink: 0; color: #C4ADAF; }
.field-dept { color: #9A8589; }
.record-reason { display: flex; align-items: flex-start; gap: 7px; font-size: 12px; color: #3D2830; line-height: 1.5; }
.record-reason svg { flex-shrink: 0; margin-top: 2px; color: #C4ADAF; }

.record-footer { display: flex; align-items: center; justify-content: space-between; padding-top: 10px; border-top: 1px solid #F0E5E7; flex-wrap: wrap; gap: 8px; }
.record-qty { font-size: 12px; color: #9A8589; }
.record-qty strong { color: #1A1016; }
.record-actions { display: flex; gap: 6px; align-items: center; }

.btn-action {
  display: flex; align-items: center; gap: 5px;
  padding: 5px 12px; border-radius: 8px;
  font-family: 'Outfit', sans-serif; font-size: 11px; font-weight: 600;
  border: none; cursor: pointer; transition: all 0.18s;
}
.btn-approve      { background: #F0FDF4; color: #16A34A; border: 1.5px solid #BBF7D0; }
.btn-approve:hover { background: #16A34A; color: white; border-color: #16A34A; }
.btn-mark-borrowed { background: #EFF6FF; color: #2563EB; border: 1.5px solid #BFDBFE; }
.btn-mark-borrowed:hover { background: #2563EB; color: white; border-color: #2563EB; }
.btn-return       { background: #FFF5F6; color: #B01020; border: 1.5px solid #FECDD3; }
.btn-return:hover { background: #B01020; color: white; border-color: #B01020; }

.btn-icon-sm {
  width: 28px; height: 28px; border-radius: 7px;
  background: #F7F3F4; border: 1.5px solid #EDE3E5;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; color: #9A8589; transition: all 0.15s;
}
.btn-icon-sm:hover { background: #FFF5F6; border-color: #B01020; color: #B01020; }
.btn-del-sm:hover { background: #FFF5F6; border-color: #E8394A; color: #E8394A; }

/* Status badges */
.status-badge {
  font-size: 10px; font-weight: 700; padding: 3px 10px;
  border-radius: 20px; letter-spacing: 0.5px; text-transform: uppercase;
  white-space: nowrap; flex-shrink: 0;
}
.status-pending   { background: #FFFBEB; color: #D97706; }
.status-approved  { background: #EFF6FF; color: #2563EB; }
.status-borrowed  { background: #F0FDF4; color: #16A34A; }
.status-returned  { background: #F7F3F4; color: #6B5257; }
.status-overdue   { background: #FFF5F6; color: #B01020; }
.status-cancelled { background: #F7F3F4; color: #9A8589; }

/* Return tab table */
.table-wrap { background: white; border-radius: 16px; border: 1.5px solid #EDE3E5; overflow: hidden; }
.ret-table { width: 100%; border-collapse: collapse; }
.ret-table thead tr { background: #F7F3F4; border-bottom: 1.5px solid #EDE3E5; }
.ret-table th { padding: 12px 16px; text-align: left; font-size: 10px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; color: #9A8589; white-space: nowrap; }
.table-row { border-bottom: 1px solid #F0E5E7; }
.table-row:last-child { border-bottom: none; }
.table-row:hover { background: #FFF5F6; }
.ret-table td { padding: 12px 16px; font-size: 13px; color: #3D2830; vertical-align: middle; }
.product-name { font-weight: 500; color: #1A1016; }
.product-sub { font-size: 11px; color: #9A8589; }
.notes-cell { font-size: 12px; color: #9A8589; max-width: 180px; }

/* Condition badges */
.cond-badge { font-size: 10px; font-weight: 600; padding: 2px 8px; border-radius: 20px; text-transform: capitalize; }
.cond-excellent { background: #F0FDF4; color: #16A34A; }
.cond-good      { background: #EFF6FF; color: #2563EB; }
.cond-fair      { background: #FFFBEB; color: #D97706; }
.cond-poor      { background: #FFF5F6; color: #B01020; }

/* Modal */
.modal-overlay { position: fixed; inset: 0; z-index: 9999; background: rgba(26,16,22,0.45); display: flex; align-items: center; justify-content: center; padding: 24px; backdrop-filter: blur(3px); }
.modal { background: white; border-radius: 20px; width: 100%; max-width: 500px; max-height: 90vh; display: flex; flex-direction: column; box-shadow: 0 24px 64px rgba(0,0,0,0.18); }
.modal-lg { max-width: 620px; }
.modal-header { display: flex; align-items: center; justify-content: space-between; padding: 20px 24px 0; flex-shrink: 0; }
.modal-title { font-family: 'Cormorant Garamond', serif; font-size: 22px; font-weight: 600; color: #1A1016; }
.modal-close { background: #F7F3F4; border: none; border-radius: 8px; color: #9A8589; cursor: pointer; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; transition: all 0.18s; }
.modal-close:hover { background: #FFF5F6; color: #B01020; }
.modal-body { padding: 20px 24px; overflow-y: auto; flex: 1; display: flex; flex-direction: column; gap: 14px; }
.modal-body::-webkit-scrollbar { width: 4px; }
.modal-body::-webkit-scrollbar-thumb { background: #E0CBCE; border-radius: 3px; }
.modal-footer { padding: 16px 24px 20px; display: flex; justify-content: flex-end; gap: 10px; border-top: 1px solid #EDE3E5; flex-shrink: 0; }

.form-section-title { font-size: 10px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; color: #B01020; padding-bottom: 8px; border-bottom: 1px solid #F0E5E7; }
.form-label { display: block; font-size: 10px; font-weight: 600; letter-spacing: 2px; text-transform: uppercase; color: #3D2830; margin-bottom: 6px; }
.req { color: #B01020; }
.form-input { width: 100%; padding: 10px 14px; border: 1.5px solid #EBE0E2; border-radius: 10px; font-family: 'Outfit', sans-serif; font-size: 13px; color: #1A1016; background: #FFF5F6; outline: none; transition: all 0.2s; }
.form-input:focus { border-color: #B01020; background: white; box-shadow: 0 0 0 3px rgba(176,16,32,0.08); }
.form-select { cursor: pointer; }
.form-textarea { resize: vertical; min-height: 72px; }
.form-error { font-size: 11px; color: #E8394A; margin-top: 4px; }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }

/* Return modal */
.return-summary { background: #FFF5F6; border: 1.5px solid #F0DADE; border-radius: 12px; padding: 14px 16px; }
.return-item-name { font-size: 15px; font-weight: 600; color: #1A1016; }
.return-borrower { font-size: 12.5px; color: #6B5257; margin-top: 4px; }

.cond-options { display: flex; gap: 8px; flex-wrap: wrap; }
.cond-option {
  padding: 6px 16px; border-radius: 20px;
  font-size: 12px; font-weight: 600;
  border: 1.5px solid #EBE0E2; background: #FFF5F6;
  cursor: pointer; transition: all 0.15s; color: #6B5257;
}
.cond-option:hover { border-color: #B01020; }
.cond-option.selected { border-color: transparent; color: white; }
.opt-excellent.selected { background: #16A34A; }
.opt-good.selected      { background: #2563EB; }
.opt-fair.selected      { background: #D97706; }
.opt-poor.selected      { background: #B01020; }

/* Manage items */
.add-item-box { background: #FFF5F6; border: 1.5px solid #F0DADE; border-radius: 14px; padding: 16px; display: flex; flex-direction: column; gap: 12px; }
.add-item-footer { display: flex; justify-content: flex-end; }
.items-list { display: flex; flex-direction: column; gap: 8px; max-height: 260px; overflow-y: auto; }
.items-list::-webkit-scrollbar { width: 4px; }
.items-list::-webkit-scrollbar-thumb { background: #E0CBCE; border-radius: 3px; }
.item-row { display: flex; align-items: center; gap: 10px; padding: 10px 12px; background: white; border: 1.5px solid #EDE3E5; border-radius: 10px; }
.item-info { flex: 1; min-width: 0; }
.item-name { font-size: 13px; font-weight: 500; color: #1A1016; }
.item-meta { font-size: 11px; color: #9A8589; }
.item-badges { display: flex; gap: 6px; flex-shrink: 0; }
.avail-badge { font-size: 10px; font-weight: 600; padding: 2px 8px; border-radius: 20px; }
.avail-yes { background: #F0FDF4; color: #16A34A; }
.avail-no  { background: #FFFBEB; color: #D97706; }
.inv-empty { font-size: 12px; color: #C4ADAF; text-align: center; padding: 16px; }

/* Buttons */
.btn-cancel { padding: 10px 20px; background: none; border: 1.5px solid #EDE3E5; border-radius: 10px; font-family: 'Outfit', sans-serif; font-size: 13px; font-weight: 500; color: #9A8589; cursor: pointer; transition: all 0.18s; }
.btn-cancel:hover:not(:disabled) { border-color: #9A8589; color: #3D2830; }
.btn-cancel:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-save { padding: 10px 22px; background: #B01020; color: white; border: none; border-radius: 10px; font-family: 'Outfit', sans-serif; font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; gap: 8px; min-width: 130px; justify-content: center; }
.btn-save:hover:not(:disabled) { background: #7A0A17; box-shadow: 0 4px 14px rgba(176,16,32,0.3); }
.btn-save:disabled { opacity: 0.65; cursor: not-allowed; }
.spinner-sm { width: 15px; height: 15px; border: 2px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; animation: spin 0.7s linear infinite; }

/* Toast */
.toast { position: fixed; bottom: 28px; left: 50%; transform: translateX(-50%); padding: 12px 22px; border-radius: 12px; font-size: 13px; font-weight: 500; color: white; box-shadow: 0 8px 24px rgba(0,0,0,0.18); z-index: 10000; white-space: nowrap; }
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

@media (max-width: 768px) {
  .page-header { flex-direction: column; align-items: stretch; }
  .header-actions { flex-direction: column; }
  .btn-add, .btn-secondary { justify-content: center; }
  .stat-cards { grid-template-columns: 1fr 1fr; display: grid; }
  .records-grid { grid-template-columns: 1fr; }
  .form-row { grid-template-columns: 1fr; }
  .table-wrap { overflow-x: auto; }
  .ret-table { min-width: 560px; }
  .tabs { overflow-x: auto; flex-wrap: nowrap; padding-bottom: 4px; width: 100%; }
  .tab { white-space: nowrap; flex-shrink: 0; }
  .record-footer { flex-direction: column; align-items: flex-start; }
  .record-actions { width: 100%; justify-content: flex-end; }
  .modal { margin: 12px; max-height: 95vh; }
  .cond-options { flex-wrap: wrap; }
}
@media (max-width: 480px) {
  .stat-cards { grid-template-columns: 1fr; }
  .page-title { font-size: 22px; }
}
</style>