// Admin password (in production, this should be handled server-side)
const ADMIN_PASSWORD = 'ceo7165';

// Check if already logged in
if (sessionStorage.getItem('adminLoggedIn') === 'true') {
    window.location.href = 'dashboard.html';
}

// Login form submission
document.getElementById('loginForm').addEventListener('submit', (e) => {
    e.preventDefault();

    const password = document.getElementById('password').value;
    const errorMessage = document.getElementById('errorMessage');

    if (password === ADMIN_PASSWORD) {
        // Set session
        sessionStorage.setItem('adminLoggedIn', 'true');
        // Redirect to dashboard
        window.location.href = 'dashboard.html';
    } else {
        // Show error
        errorMessage.style.display = 'block';
        errorMessage.querySelector('span').textContent = '비밀번호가 올바르지 않습니다.';
        
        // Clear password field
        document.getElementById('password').value = '';
        document.getElementById('password').focus();
    }
});

// Clear error message on input
document.getElementById('password').addEventListener('input', () => {
    document.getElementById('errorMessage').style.display = 'none';
});
