// Constants
const BASE_AMOUNT = 4500000; // 기본 교육비 450만원
const VAT_RATE = 0.1; // 부가세 10%

// Google Form 연동 설정 (https://forms.gle/RHdsgmiMEPujcZSY8)
const GOOGLE_FORM_CONFIG = {
    shortUrl: 'https://forms.gle/RHdsgmiMEPujcZSY8',
    actionUrl: 'https://docs.google.com/forms/d/e/1FAIpQLSfOGSLhdVi0yMfR-OdLALkyziG_K3jcV-CbY0piYxBtpLGWpQ/formResponse',
    viewUrl: 'https://docs.google.com/forms/d/e/1FAIpQLSfOGSLhdVi0yMfR-OdLALkyziG_K3jcV-CbY0piYxBtpLGWpQ/viewform',
    fields: {
        name: 'entry.1263860059',         // 이름 (필수)
        phone: 'entry.1509891244',        // 연락처 (필수)
        email: 'entry.1531492417',        // 이메일 (필수)
        company: 'entry.1603467298',      // 회사명 (필수)
        position: 'entry.1403528295',     // 직책 (필수)
        industryType: 'entry.14490918'    // 업종 구분 (드롭다운)
    }
};

// 구글 폼으로 신청 데이터 자동 전송
async function submitToGoogleForm(formData) {
    const params = new URLSearchParams();
    params.append(GOOGLE_FORM_CONFIG.fields.name, formData.name);
    params.append(GOOGLE_FORM_CONFIG.fields.phone, formData.phone);
    const discountSummary = formData.discount_rate > 0
        ? `${formData.discount_rate}% (${(formData.discount_types || []).join(', ')})`
        : '0%';
    const extraInfo = [
        `업종:${formData.industry_type}`,
        `할인:${discountSummary}`,
        `최종금액:${formatNumber(formData.final_amount)}원`,
        formData.inquiry ? `문의:${formData.inquiry}` : ''
    ].filter(Boolean).join(' / ');
    params.append(GOOGLE_FORM_CONFIG.fields.email, formData.email);
    params.append(GOOGLE_FORM_CONFIG.fields.company, formData.company);
    params.append(GOOGLE_FORM_CONFIG.fields.position, `${formData.position} (${extraInfo})`);
    if (formData.industry_type && formData.industry_type.includes('프랜차이즈')) {
        params.append(GOOGLE_FORM_CONFIG.fields.industryType, '프랜차이즈');
    }
    params.append('fvv', '1');
    params.append('pageHistory', '0');

    await fetch(GOOGLE_FORM_CONFIG.actionUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: params.toString()
    });
}

// Format number with comma
function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

// Calculate discount
function calculateDiscount() {
    const checkboxes = document.querySelectorAll('input[name="discount"]:checked');
    let maxRate = 0;
    let selectedDiscounts = [];

    checkboxes.forEach(checkbox => {
        const rate = parseInt(checkbox.dataset.rate);
        selectedDiscounts.push(checkbox.value);
        if (rate > maxRate) {
            maxRate = rate;
        }
    });

    return { rate: maxRate, types: selectedDiscounts };
}

// Update price display
function updatePrice() {
    const discount = calculateDiscount();
    const discountRate = discount.rate;
    const discountAmount = BASE_AMOUNT * (discountRate / 100);
    const subtotal = BASE_AMOUNT - discountAmount;
    const vat = subtotal * VAT_RATE;
    const finalAmount = subtotal + vat;

    // Update DOM
    document.getElementById('discountRate').textContent = `${discountRate}%`;
    document.getElementById('discountAmount').textContent = `- ${formatNumber(discountAmount)}원`;
    document.getElementById('subtotal').textContent = `${formatNumber(subtotal)}원`;
    document.getElementById('vat').textContent = `${formatNumber(vat)}원`;
    document.getElementById('finalAmount').textContent = `${formatNumber(finalAmount)}원`;

    return {
        discountRate,
        discountAmount,
        subtotal,
        vat,
        finalAmount,
        discountTypes: discount.types
    };
}

// Phone number formatting
function formatPhoneNumber(input) {
    let value = input.value.replace(/[^0-9]/g, '');
    
    if (value.length > 3 && value.length <= 7) {
        value = value.slice(0, 3) + '-' + value.slice(3);
    } else if (value.length > 7) {
        value = value.slice(0, 3) + '-' + value.slice(3, 7) + '-' + value.slice(7, 11);
    }
    
    input.value = value;
}

// Event listeners for discount checkboxes
document.querySelectorAll('input[name="discount"]').forEach(checkbox => {
    checkbox.addEventListener('change', updatePrice);
});

// Phone number input formatting
const phoneInput = document.getElementById('phone');
phoneInput.addEventListener('input', (e) => {
    formatPhoneNumber(e.target);
});

// Industry type selection - show/hide other input
const industrySelect = document.getElementById('industryType');
const otherIndustryGroup = document.getElementById('otherIndustryGroup');
const otherIndustryInput = document.getElementById('otherIndustry');

industrySelect.addEventListener('change', (e) => {
    if (e.target.value === '기타') {
        otherIndustryGroup.style.display = 'block';
        otherIndustryInput.required = true;
    } else {
        otherIndustryGroup.style.display = 'none';
        otherIndustryInput.required = false;
        otherIndustryInput.value = '';
    }
});

// Form validation
function validateForm() {
    const name = document.getElementById('name').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const email = document.getElementById('email').value.trim();
    const company = document.getElementById('company').value.trim();
    const position = document.getElementById('position').value.trim();
    const industryType = document.getElementById('industryType').value;
    const otherIndustry = document.getElementById('otherIndustry').value.trim();

    if (!name || !phone || !email || !company || !position) {
        alert('필수 항목을 모두 입력해주세요.');
        return false;
    }

    if (!industryType) {
        alert('업종을 선택해주세요.');
        return false;
    }

    if (industryType === '기타' && !otherIndustry) {
        alert('기타 업종을 직접 입력해주세요.');
        return false;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        alert('올바른 이메일 주소를 입력해주세요.');
        return false;
    }

    // Phone validation
    const phoneRegex = /^01[0-9]-\d{3,4}-\d{4}$/;
    if (!phoneRegex.test(phone)) {
        alert('올바른 연락처를 입력해주세요. (예: 010-0000-0000)');
        return false;
    }

    return true;
}

// Form submission
document.getElementById('applicationForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!validateForm()) {
        return;
    }

    // Get form data
    const industryType = document.getElementById('industryType').value;
    const otherIndustry = document.getElementById('otherIndustry').value.trim();
    
    const formData = {
        name: document.getElementById('name').value.trim(),
        phone: document.getElementById('phone').value.trim(),
        email: document.getElementById('email').value.trim(),
        company: document.getElementById('company').value.trim(),
        position: document.getElementById('position').value.trim(),
        industry_type: industryType === '기타' ? otherIndustry : industryType,
        inquiry: document.getElementById('inquiry').value.trim(),
        status: '대기중',
        application_date: new Date().toISOString()
    };

    // Get price calculation
    const priceData = updatePrice();
    formData.discount_types = priceData.discountTypes;
    formData.discount_rate = priceData.discountRate;
    formData.base_amount = BASE_AMOUNT;
    formData.discount_amount = priceData.discountAmount;
    formData.vat = priceData.vat;
    formData.final_amount = priceData.finalAmount;

    // Show loading
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 처리중...';

    try {
        // Submit to API (fallback to localStorage on static hosting such as GitHub Pages)
        let savedViaApi = false;
        try {
            const response = await fetch('tables/applications', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });
            if (response.ok) {
                await response.json();
                savedViaApi = true;
            }
        } catch (apiError) {
            console.warn('API 서버 미사용 환경, 로컬 저장소로 대체합니다.');
        }

        if (!savedViaApi) {
            const stored = JSON.parse(localStorage.getItem('kfceo_applications') || '[]');
            formData.id = (typeof crypto !== 'undefined' && crypto.randomUUID)
                ? crypto.randomUUID()
                : 'app_' + Date.now();
            stored.unshift(formData);
            localStorage.setItem('kfceo_applications', JSON.stringify(stored));
        }

        // Google Form 자동 전송 연동 (https://forms.gle/RHdsgmiMEPujcZSY8)
        try {
            await submitToGoogleForm(formData);
        } catch (googleFormError) {
            console.warn('구글 폼 자동 전송 중 경고:', googleFormError);
        }

        // SMS 알림 발송 (비동기로 처리하여 실패해도 신청은 완료됨)
        if (typeof window.sendSMSNotification === 'function') {
            try {
                await window.sendSMSNotification(formData);
            } catch (smsError) {
                console.log('SMS 알림 전송 실패:', smsError);
                // SMS 실패해도 신청은 성공으로 처리
            }
        }

        // Show success modal
        document.getElementById('successModal').style.display = 'block';

    } catch (error) {
        console.error('Error:', error);
        alert('신청 처리 중 오류가 발생했습니다. 다시 시도해주세요.');
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
    }
});

// Initialize price display
updatePrice();
