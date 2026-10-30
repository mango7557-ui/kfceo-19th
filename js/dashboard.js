// Check authentication
if (sessionStorage.getItem('adminLoggedIn') !== 'true') {
    window.location.href = 'admin.html';
}

// Global variables
let allApplications = [];
let filteredApplications = [];
let currentEditingId = null;
let currentDeletingId = null;

// Format number with comma
function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

// Format date
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Load applications
async function loadApplications() {
    try {
        let loadedFromApi = false;
        try {
            const response = await fetch('tables/applications?limit=1000');
            if (response.ok) {
                const data = await response.json();
                allApplications = data.data || [];
                loadedFromApi = true;
            }
        } catch (apiError) {
            console.warn('API 서버 미사용 환경, 로컬 저장소 데이터를 불러옵니다.');
        }

        if (!loadedFromApi) {
            allApplications = JSON.parse(localStorage.getItem('kfceo_applications') || '[]');
        }

        filteredApplications = allApplications;
        
        updateStatistics();
        renderTable();
        renderApplicantsPreview();
    } catch (error) {
        console.error('Error loading applications:', error);
        alert('데이터를 불러오는 중 오류가 발생했습니다.');
    }
}

// Update statistics
function updateStatistics() {
    const total = allApplications.length;
    const pending = allApplications.filter(app => app.status === '대기중').length;
    const approved = allApplications.filter(app => app.status === '승인').length;
    const completed = allApplications.filter(app => app.status === '결제완료').length;

    document.getElementById('totalApplications').textContent = total;
    document.getElementById('pendingApplications').textContent = pending;
    document.getElementById('approvedApplications').textContent = approved;
    document.getElementById('completedApplications').textContent = completed;
}

// Render table
function renderTable() {
    const tbody = document.getElementById('applicationsTableBody');
    
    if (filteredApplications.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="9" class="empty-state">
                    <i class="fas fa-inbox"></i>
                    <p>신청 데이터가 없습니다.</p>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = filteredApplications.map(app => `
        <tr>
            <td data-label="신청일">${formatDate(app.application_date)}</td>
            <td data-label="이름"><strong>${app.name}</strong></td>
            <td data-label="회사명">${app.company}</td>
            <td data-label="업종">${app.industry_type || '-'}</td>
            <td data-label="연락처">${app.phone}</td>
            <td data-label="할인율"><span class="status-badge ${getDiscountClass(app.discount_rate)}">${app.discount_rate}%</span></td>
            <td data-label="최종금액"><strong>${formatNumber(app.final_amount)}원</strong></td>
            <td data-label="상태"><span class="status-badge ${getStatusClass(app.status)}">${app.status}</span></td>
            <td data-label="작업">
                <div class="action-buttons">
                    <button class="btn-icon btn-view" onclick="viewApplication('${app.id}')" title="상세보기">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn-icon btn-edit" onclick="editApplication('${app.id}')" title="상태변경">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon btn-delete" onclick="deleteApplication('${app.id}')" title="삭제">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

// Render applicants preview
function renderApplicantsPreview() {
    const previewContainer = document.getElementById('applicantsPreviewList');
    
    if (!previewContainer) return;
    
    // 최대 12명만 표시
    const previewApplicants = allApplications.slice(0, 12);
    
    if (previewApplicants.length === 0) {
        previewContainer.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 2rem; color: #95a5a6;">
                <i class="fas fa-inbox" style="font-size: 2.5rem; margin-bottom: 1rem; display: block;"></i>
                <p>아직 신청자가 없습니다</p>
            </div>
        `;
        return;
    }
    
    previewContainer.innerHTML = previewApplicants.map(app => {
        const initial = app.name ? app.name.charAt(0) : '?';
        const companyShort = app.company ? (app.company.length > 20 ? app.company.substring(0, 20) + '...' : app.company) : '-';
        const industryShort = app.industry_type ? (app.industry_type.length > 30 ? app.industry_type.substring(0, 30) + '...' : app.industry_type) : '-';
        
        return `
            <div class="applicant-preview-card">
                <div class="applicant-preview-header">
                    <div class="applicant-preview-avatar">${initial}</div>
                    <div class="applicant-preview-info">
                        <div class="applicant-preview-name">${app.name || '익명'}</div>
                        <div class="applicant-preview-company">${companyShort}</div>
                    </div>
                </div>
                <div class="applicant-preview-details">
                    <div class="applicant-preview-detail-item">
                        <i class="fas fa-building"></i>
                        <span>${industryShort}</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Get status class
function getStatusClass(status) {
    switch (status) {
        case '대기중': return 'status-pending';
        case '승인': return 'status-approved';
        case '거부': return 'status-rejected';
        case '결제완료': return 'status-completed';
        default: return '';
    }
}

// Get discount class
function getDiscountClass(rate) {
    if (rate === 0) return '';
    if (rate === 10) return 'status-pending';
    if (rate === 20) return 'status-rejected';
    return '';
}

// View application
function viewApplication(id) {
    const app = allApplications.find(a => a.id === id);
    if (!app) return;

    const detailContent = document.getElementById('detailContent');
    detailContent.innerHTML = `
        <div class="detail-section">
            <h3>신청자 정보</h3>
            <div class="detail-grid">
                <div class="detail-item">
                    <div class="detail-label">이름</div>
                    <div class="detail-value">${app.name}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">연락처</div>
                    <div class="detail-value">${app.phone}</div>
                </div>
                <div class="detail-item full-width">
                    <div class="detail-label">이메일</div>
                    <div class="detail-value">${app.email}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">회사명</div>
                    <div class="detail-value">${app.company}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">직책</div>
                    <div class="detail-value">${app.position}</div>
                </div>
                <div class="detail-item full-width">
                    <div class="detail-label">업종</div>
                    <div class="detail-value">${app.industry_type || '-'}</div>
                </div>
            </div>
        </div>

        <div class="detail-section">
            <h3>할인 정보</h3>
            <div class="detail-grid">
                <div class="detail-item">
                    <div class="detail-label">할인율</div>
                    <div class="detail-value">${app.discount_rate}%</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">할인 금액</div>
                    <div class="detail-value">${formatNumber(app.discount_amount)}원</div>
                </div>
                <div class="detail-item full-width">
                    <div class="detail-label">적용된 할인 유형</div>
                    <div class="detail-value">${app.discount_types && app.discount_types.length > 0 ? app.discount_types.join(', ') : '없음'}</div>
                </div>
            </div>
        </div>

        <div class="detail-section">
            <h3>결제 정보</h3>
            <div class="detail-grid">
                <div class="detail-item">
                    <div class="detail-label">기본 교육비</div>
                    <div class="detail-value">${formatNumber(app.base_amount)}원</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">할인 후 금액</div>
                    <div class="detail-value">${formatNumber(app.base_amount - app.discount_amount)}원</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">부가세 (10%)</div>
                    <div class="detail-value">${formatNumber(app.vat)}원</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">최종 결제 금액</div>
                    <div class="detail-value"><strong style="color: #3498db; font-size: 1.3rem;">${formatNumber(app.final_amount)}원</strong></div>
                </div>
            </div>
        </div>

        <div class="detail-section">
            <h3>기타 정보</h3>
            <div class="detail-grid">
                <div class="detail-item">
                    <div class="detail-label">신청일시</div>
                    <div class="detail-value">${formatDate(app.application_date)}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">상태</div>
                    <div class="detail-value"><span class="status-badge ${getStatusClass(app.status)}">${app.status}</span></div>
                </div>
                <div class="detail-item full-width">
                    <div class="detail-label">문의사항</div>
                    <div class="detail-value">${app.inquiry || '없음'}</div>
                </div>
            </div>
        </div>
    `;

    document.getElementById('detailModal').style.display = 'block';
}

// Edit application
function editApplication(id) {
    const app = allApplications.find(a => a.id === id);
    if (!app) return;

    currentEditingId = id;
    document.getElementById('editStatus').value = app.status;
    document.getElementById('editModal').style.display = 'block';
}

// Save status
async function saveStatus() {
    if (!currentEditingId) return;

    const newStatus = document.getElementById('editStatus').value;

    try {
        let updatedViaApi = false;
        try {
            const response = await fetch(`tables/applications/${currentEditingId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status: newStatus })
            });
            if (response.ok) updatedViaApi = true;
        } catch (apiError) {
            console.warn('API 서버 미사용 환경, 로컬 저장소 상태를 수정합니다.');
        }

        if (!updatedViaApi) {
            const stored = JSON.parse(localStorage.getItem('kfceo_applications') || '[]');
            const target = stored.find(item => item.id === currentEditingId);
            if (target) {
                target.status = newStatus;
                localStorage.setItem('kfceo_applications', JSON.stringify(stored));
            }
        }

        closeEditModal();
        loadApplications();
        alert('상태가 변경되었습니다.');
    } catch (error) {
        console.error('Error updating status:', error);
        alert('상태 변경 중 오류가 발생했습니다.');
    }
}

// Delete application
function deleteApplication(id) {
    currentDeletingId = id;
    document.getElementById('deleteModal').style.display = 'block';
}

// Confirm delete
async function confirmDelete() {
    if (!currentDeletingId) return;

    try {
        let deletedViaApi = false;
        try {
            const response = await fetch(`tables/applications/${currentDeletingId}`, {
                method: 'DELETE'
            });
            if (response.ok) deletedViaApi = true;
        } catch (apiError) {
            console.warn('API 서버 미사용 환경, 로컬 저장소에서 삭제합니다.');
        }

        if (!deletedViaApi) {
            const stored = JSON.parse(localStorage.getItem('kfceo_applications') || '[]')
                .filter(item => item.id !== currentDeletingId);
            localStorage.setItem('kfceo_applications', JSON.stringify(stored));
        }

        closeDeleteModal();
        loadApplications();
        alert('신청이 삭제되었습니다.');
    } catch (error) {
        console.error('Error deleting application:', error);
        alert('삭제 중 오류가 발생했습니다.');
    }
}

// Filter applications
function filterApplications() {
    const statusFilter = document.getElementById('statusFilter').value;
    const searchQuery = document.getElementById('searchInput').value.toLowerCase();

    filteredApplications = allApplications.filter(app => {
        const matchesStatus = !statusFilter || app.status === statusFilter;
        const matchesSearch = !searchQuery || 
            app.name.toLowerCase().includes(searchQuery) ||
            app.company.toLowerCase().includes(searchQuery);
        
        return matchesStatus && matchesSearch;
    });

    renderTable();
}

// Export to Excel
function exportToExcel() {
    if (filteredApplications.length === 0) {
        alert('다운로드할 데이터가 없습니다.');
        return;
    }

    const exportData = filteredApplications.map(app => ({
        '신청일시': formatDate(app.application_date),
        '이름': app.name,
        '연락처': app.phone,
        '이메일': app.email,
        '회사명': app.company,
        '직책': app.position,
        '업종': app.industry_type || '-',
        '할인율': `${app.discount_rate}%`,
        '할인유형': app.discount_types ? app.discount_types.join(', ') : '없음',
        '기본교육비': app.base_amount,
        '할인금액': app.discount_amount,
        '부가세': app.vat,
        '최종결제금액': app.final_amount,
        '상태': app.status,
        '문의사항': app.inquiry || ''
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '신청자목록');

    const fileName = `KFCEO_신청자목록_${new Date().toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(wb, fileName);
}

// Modal functions
function closeDetailModal() {
    document.getElementById('detailModal').style.display = 'none';
}

function closeEditModal() {
    document.getElementById('editModal').style.display = 'none';
    currentEditingId = null;
}

function closeDeleteModal() {
    document.getElementById('deleteModal').style.display = 'none';
    currentDeletingId = null;
}

// Event listeners
document.getElementById('logoutBtn').addEventListener('click', () => {
    sessionStorage.removeItem('adminLoggedIn');
    window.location.href = 'admin.html';
});

document.getElementById('refreshBtn').addEventListener('click', loadApplications);
document.getElementById('exportBtn').addEventListener('click', exportToExcel);
document.getElementById('statusFilter').addEventListener('change', filterApplications);
document.getElementById('searchInput').addEventListener('input', filterApplications);

// Close modals when clicking outside
window.addEventListener('click', (event) => {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = 'none';
        currentEditingId = null;
        currentDeletingId = null;
    }
});

// Initialize
loadApplications();
