// 네이버 클라우드 SMS 알림 설정
// ⚠️ 보안 경고: 실제 운영 환경에서는 서버에서 SMS를 발송해야 합니다.
// 클라이언트에서 직접 호출 시 API 키가 노출되어 악용될 수 있습니다.

const SMS_CONFIG = {
    // 네이버 클라우드 콘솔에서 발급받은 정보를 입력하세요
    serviceId: 'YOUR_SERVICE_ID',        // SMS 서비스 ID
    accessKey: 'YOUR_ACCESS_KEY',        // Access Key ID
    secretKey: 'YOUR_SECRET_KEY',        // Secret Key
    fromNumber: '01012345678',           // 발신번호 (사전 등록 필요)
    toNumber: '010-3753-7165'            // 수신번호 (관리자 번호 - 김상훈 총동문회 사무총장)
};

// HMAC SHA256 서명 생성 (네이버 클라우드 API 인증용)
async function makeSignature(timestamp, method, url) {
    const space = " ";
    const newLine = "\n";
    const message = method + space + url + newLine + timestamp + newLine + SMS_CONFIG.accessKey;
    
    // CryptoJS 라이브러리 사용
    const hash = CryptoJS.HmacSHA256(message, SMS_CONFIG.secretKey);
    const signature = CryptoJS.enc.Base64.stringify(hash);
    
    return signature;
}

// SMS 발송 함수
async function sendSMSNotification(applicantData) {
    // 설정이 안 되어 있으면 콘솔에만 로그
    if (SMS_CONFIG.serviceId === 'YOUR_SERVICE_ID') {
        console.log('SMS 설정이 필요합니다. js/sms-notification.js 파일에서 SMS_CONFIG를 설정하세요.');
        console.log('신청자 정보:', applicantData);
        return false;
    }

    try {
        const timestamp = Date.now().toString();
        const method = 'POST';
        const url = `/sms/v2/services/${SMS_CONFIG.serviceId}/messages`;
        
        // 서명 생성
        const signature = await makeSignature(timestamp, method, url);
        
        // SMS 메시지 내용 구성
        const messageContent = `[KFCEO 신규 신청]
이름: ${applicantData.name}
회사: ${applicantData.company}
업종: ${applicantData.industry_type || '-'}
연락처: ${applicantData.phone}
할인율: ${applicantData.discount_rate}%
최종금액: ${formatNumber(applicantData.final_amount)}원

관리자 페이지에서 확인하세요.`;

        // API 요청 데이터
        const requestData = {
            type: 'SMS',  // SMS 또는 LMS (장문)
            contentType: 'COMM',
            countryCode: '82',
            from: SMS_CONFIG.fromNumber.replace(/-/g, ''),
            content: messageContent,
            messages: [
                {
                    to: SMS_CONFIG.toNumber.replace(/-/g, '')
                }
            ]
        };

        // 네이버 클라우드 SMS API 호출
        const response = await fetch(`https://sens.apigw.ntruss.com${url}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json; charset=utf-8',
                'x-ncp-apigw-timestamp': timestamp,
                'x-ncp-iam-access-key': SMS_CONFIG.accessKey,
                'x-ncp-apigw-signature-v2': signature
            },
            body: JSON.stringify(requestData)
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('SMS 발송 실패:', errorData);
            return false;
        }

        const result = await response.json();
        console.log('SMS 발송 성공:', result);
        return true;

    } catch (error) {
        console.error('SMS 발송 오류:', error);
        return false;
    }
}

// 숫자 포맷팅 헬퍼 함수
function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

// 전역으로 내보내기
window.sendSMSNotification = sendSMSNotification;
