# 네이버 클라우드 SMS 알림 설정 가이드

신청자가 교육과정을 신청하면 관리자에게 자동으로 SMS 알림이 발송됩니다.

## 📋 설정 단계

### 1단계: 네이버 클라우드 플랫폼 가입 및 설정

1. **네이버 클라우드 플랫폼 가입**
   - https://www.ncloud.com/ 접속
   - 회원가입 및 로그인
   - 본인인증 완료

2. **Simple & Easy Notification Service (SENS) 활성화**
   - 콘솔 > Products & Services > Application Service > Simple & Easy Notification Service
   - 이용 신청 클릭

3. **SMS 서비스 생성**
   - SENS 콘솔에서 "프로젝트 생성" 클릭
   - 프로젝트 이름 입력 (예: KFCEO-SMS)
   - **Service ID**를 메모해두세요

4. **발신번호 등록**
   - SMS > Calling Number 메뉴
   - "발신번호 추가" 클릭
   - 휴대폰 번호 입력 (예: 010-3753-7165)
   - 본인인증 완료 (SMS 인증)
   - ⚠️ 사전 등록된 발신번호만 사용 가능합니다

5. **API 인증키 발급**
   - 마이페이지 > 계정 관리 > 인증키 관리
   - "신규 API 인증키 생성" 클릭
   - **Access Key ID**와 **Secret Key**를 안전하게 보관

### 2단계: 프로젝트에 설정 정보 입력

`js/sms-notification.js` 파일을 열어 다음 정보를 입력하세요:

```javascript
const SMS_CONFIG = {
    serviceId: 'ncp:sms:kr:123456789012:your-service',  // SENS에서 생성한 Service ID
    accessKey: 'your_access_key_here',                   // Access Key ID
    secretKey: 'your_secret_key_here',                   // Secret Key
    fromNumber: '01012345678',                           // 등록한 발신번호
    toNumber: '010-3753-7165'                            // 수신번호 (관리자 번호)
};
```

### 3단계: 테스트

1. 웹사이트에서 교육과정 신청
2. 관리자 휴대폰으로 SMS 수신 확인
3. 브라우저 개발자 도구 콘솔에서 오류 메시지 확인

## 💰 요금 안내

- **무료**: 월 50건까지
- **유료**: 이후 건당 9원 (SMS), 27원 (LMS 장문)
- 자세한 요금: https://www.ncloud.com/product/applicationService/sens

## 📱 SMS 메시지 형식

```
[KFCEO 신규 신청]
이름: 홍길동
회사: (주)예시회사
업종: 프랜차이즈업
연락처: 010-1234-5678
할인율: 20%
최종금액: 3,960,000원

관리자 페이지에서 확인하세요.
```

## ⚠️ 보안 주의사항

**중요: 현재 구현은 데모/개발 목적입니다**

- ❌ API 키가 클라이언트(브라우저)에 노출됩니다
- ❌ 악의적 사용자가 키를 도용하여 무단 SMS 발송 가능
- ❌ 요금 폭탄의 위험이 있습니다

**실제 운영 환경에서는:**
- ✅ 반드시 서버(백엔드)에서 SMS API를 호출해야 합니다
- ✅ API 키를 환경변수로 안전하게 관리해야 합니다
- ✅ Rate Limiting (호출 제한)을 적용해야 합니다

## 🔧 문제 해결

### SMS가 발송되지 않는 경우

1. **콘솔 오류 확인**
   - 브라우저 F12 > Console 탭에서 오류 메시지 확인

2. **발신번호 미등록**
   - 네이버 클라우드 콘솔에서 발신번호가 "승인됨" 상태인지 확인

3. **API 인증 실패**
   - Access Key, Secret Key가 정확한지 확인
   - Service ID가 올바른지 확인

4. **CORS 오류**
   - 네이버 클라우드 API는 브라우저에서 직접 호출 시 CORS 제한 있음
   - 이 경우 서버를 통해 호출해야 함

5. **잔액 부족**
   - 네이버 클라우드 콘솔에서 크레딧 잔액 확인

## 📚 참고 문서

- [네이버 클라우드 SENS 가이드](https://guide.ncloud-docs.com/docs/sens-sens-1-1)
- [SMS API 레퍼런스](https://api.ncloud-docs.com/docs/ai-application-service-sens-smsv2)
- [요금 안내](https://www.ncloud.com/product/applicationService/sens)

## 🎯 대안 (더 안전한 방법)

정적 웹사이트의 한계를 고려하여 다음 대안을 권장합니다:

1. **Telegram 봇 알림** (무료, 무제한, 안전)
2. **Discord 웹훅** (무료, 무제한)
3. **EmailJS** (월 200건 무료)

SMS 대신 위 방법을 원하시면 말씀해주세요!
