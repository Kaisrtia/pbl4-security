const loginForm = document.getElementById('loginForm') as HTMLFormElement;
const usernameInput = document.getElementById('username') as HTMLInputElement;
const passwordInput = document.getElementById('password') as HTMLInputElement;
const statusBox = document.getElementById('statusBox') as HTMLDivElement;
const loginSection = document.getElementById('loginSection') as HTMLDivElement;
const resourceSection = document.getElementById('resourceSection') as HTMLDivElement;
const resourceList = document.getElementById('resourceList') as HTMLDivElement;
const btnLogout = document.getElementById('btnLogout') as HTMLButtonElement;

let currentToken: string | null = null;

function showStatus(message: string, isError: boolean = false) {
  statusBox.textContent = message;
  statusBox.className = `status-box ${isError ? 'status-error' : 'status-success'}`;
  statusBox.style.display = 'block';
}

loginForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const username = usernameInput.value;
  const password = passwordInput.value;

  try {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    const data = await res.json();

    if (!res.ok) {
      showStatus(data.error || 'Đăng nhập thất bại', true);
      return;
    }

    currentToken = data.token;
    showStatus(`Đăng nhập thành công! Xin chào ${data.user?.username || 'User'}`);
    loginSection.style.display = 'none';
    resourceSection.style.display = 'block';

    await loadResources();
  } catch (err) {
    showStatus('Không thể kết nối đến máy chủ: ' + (err as Error).message, true);
  }
});

async function loadResources() {
  if (!currentToken) return;

  try {
    const res = await fetch('/api/resources', {
      headers: {
        Authorization: `Bearer ${currentToken}`
      }
    });

    const data = await res.json();
    if (res.ok && Array.isArray(data.data)) {
      resourceList.innerHTML = data.data
        .map(
          (item: { id: number; title: string; secret_content: string; classification_level: string }) => `
        <div class="resource-item">
          <h4>${item.title} <span class="badge">${item.classification_level}</span></h4>
          <p>${item.secret_content}</p>
        </div>
      `
        )
        .join('');
    } else {
      resourceList.innerHTML = `<p style="color: #ef4444;">Không thể tải tài nguyên</p>`;
    }
  } catch (err) {
    resourceList.innerHTML = `<p style="color: #ef4444;">Lỗi khi tải tài nguyên: ${(err as Error).message}</p>`;
  }
}

btnLogout?.addEventListener('click', () => {
  currentToken = null;
  loginSection.style.display = 'block';
  resourceSection.style.display = 'none';
  statusBox.style.display = 'none';
  usernameInput.value = '';
  passwordInput.value = '';
});
