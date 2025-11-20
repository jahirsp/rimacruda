// ======================
//  Inicializar Firebase
// ======================
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged, 
  GoogleAuthProvider, 
  signInWithPopup,
  sendEmailVerification
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { getFirestore, doc, setDoc } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-storage.js";
// Agregar esta línea con las otras importaciones de Firestore
import { getDoc } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAuC4sNtOQ1aUpV2uhXRJphPazkEIfw6_8",
  authDomain: "rimacruda-9c963.firebaseapp.com",
  databaseURL: "https://rimacruda-9c963-default-rtdb.firebaseio.com",
  projectId: "rimacruda-9c963",
  storageBucket: "rimacruda-9c963.firebasestorage.app",
  messagingSenderId: "466619263523",
  appId: "1:466619263523:web:40fb2ea9d7dc365cb0df96",
  measurementId: "G-9E9R2LD3T0"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// ======================
//  Modal y pestañas
// ======================
const authModal = document.getElementById('authModal');
const openLoginModal = document.getElementById('openLoginModal');
const openRegisterModal = document.getElementById('openRegisterModal');
const closeModalBtn = document.querySelector('.close-modal');
const authTabs = document.querySelectorAll('.auth-tab');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const switchToRegister = document.getElementById('switchToRegister');
const switchToLogin = document.getElementById('switchToLogin');

function openAuthModal(tab) {
  if (authModal) authModal.style.display = 'flex';
  switchAuthTab(tab);
}

function closeAuthModal() {
  if (authModal) authModal.style.display = 'none';
}

function switchAuthTab(tabName) {
  authTabs.forEach(tab => {
    tab.classList.toggle('active', tab.dataset.tab === tabName);
  });
  
  if (loginForm) loginForm.classList.toggle('active', tabName === 'login');
  if (registerForm) registerForm.classList.toggle('active', tabName === 'register');
}

if (openLoginModal) openLoginModal.addEventListener('click', () => openAuthModal('login'));
if (openRegisterModal) openRegisterModal.addEventListener('click', () => openAuthModal('register'));
if (closeModalBtn) closeModalBtn.addEventListener('click', closeAuthModal);

if (authTabs) {
  authTabs.forEach(tab => {
    tab.addEventListener('click', () => switchAuthTab(tab.dataset.tab));
  });
}

if (switchToRegister) {
  switchToRegister.addEventListener('click', (e) => {
    e.preventDefault();
    switchAuthTab('register');
  });
}

if (switchToLogin) {
  switchToLogin.addEventListener('click', (e) => {
    e.preventDefault();
    switchAuthTab('login');
  });
}

window.addEventListener('click', (e) => {
  if (e.target === authModal) closeAuthModal();
});

// ======================
//  Funciones auxiliares
// ======================
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function handleAuthError(error) {
  switch (error.code) {
    case 'auth/email-already-in-use':
      alert("❌ Este email ya está registrado.");
      break;
    case 'auth/invalid-credential':
      alert("❌ Credenciales incorrectas. Verifica tu email y contraseña.");
      break;
    case 'auth/user-not-found':
      alert("❌ No existe una cuenta con este email.");
      break;
    case 'auth/wrong-password':
      alert("❌ Contraseña incorrecta.");
      break;
    case 'auth/too-many-requests':
      alert("🔒 Demasiados intentos fallidos. Intenta más tarde.");
      break;
    case 'auth/weak-password':
      alert("🔐 La contraseña debe tener al menos 6 caracteres.");
      break;
    case 'auth/invalid-email':
      alert("📧 El formato del email no es válido.");
      break;
    default:
      alert("❌ Error: " + error.message);
  }
}

// ======================
//  Registro mejorado
// ======================
if (registerForm) {
  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = registerForm['registerEmail'].value;
    const password = registerForm['registerPassword'].value;
    const username = registerForm['registerUsername'].value;

    // Validaciones
    if (!isValidEmail(email)) {
      alert("Por favor ingresa un email válido.");
      return;
    }

    if (password.length < 6) {
      alert("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    try {
      // Crear usuario
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Guardar en Firestore INMEDIATAMENTE
      await setDoc(doc(db, "users", user.uid), {
        username: username,
        email: user.email,
        emailVerified: false,
        createdAt: new Date(),
        photoURL: "imagenes/default-avatar.png"
      });

      // Enviar email de verificación
      await sendEmailVerification(user);
      
      alert("¡Cuenta creada! 🎉 Se ha enviado un email de verificación a tu correo.");
      closeAuthModal();
      registerForm.reset();

    } catch (error) {
      console.error("Error en registro:", error);
      handleAuthError(error);
    }
  });
}

// ======================
//  Login mejorado
// ======================
if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = loginForm['loginEmail'].value;
    const password = loginForm['loginPassword'].value;

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Verificar email (pero permitir acceso de todos modos)
      if (!user.emailVerified) {
        if (confirm("⚠️ Tu email no está verificado. ¿Quieres que reenviemos el email de verificación?")) {
          await sendEmailVerification(user);
          alert("📧 Email de verificación reenviado. Revisa tu bandeja de entrada.");
        }
      }

      // Actualizar Firestore
      await setDoc(doc(db, "users", user.uid), {
        emailVerified: user.emailVerified,
        lastLogin: new Date()
      }, { merge: true });

      closeAuthModal();
      
    } catch (error) {
      console.error("Error en login:", error);
      handleAuthError(error);
    }
  });
}

// ======================
//  Login con Google
// ======================
const googleBtn = document.getElementById("googleLoginBtn");
if (googleBtn) {
  googleBtn.addEventListener("click", async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      await setDoc(doc(db, "users", user.uid), {
        email: user.email,
        username: user.displayName,
        provider: "google",
        emailVerified: true,
        photoURL: user.photoURL || "imagenes/default-avatar.png",
        createdAt: new Date()
      });
      closeAuthModal();
    } catch (error) {
      alert("Error con Google: " + error.message);
    }
  });
}

// ======================
//  Estado del usuario UNIFICADO
// ======================
onAuthStateChanged(auth, async (user) => {
    const userInfo = document.getElementById("userInfo");
    const loginBtns = document.querySelector(".auth-buttons");
    const userIconContainer = document.getElementById("userIconContainer");
    const userMenu = document.getElementById("userMenu");
    const upgradeProHeaderBtn = document.getElementById("upgradeProHeaderBtn");
    
    if (user) {
        // Ocultar botones de login y mostrar icono de usuario + botón Pro
        if (loginBtns) loginBtns.style.display = "none";
        if (userInfo) userInfo.style.display = "none";
        if (userIconContainer) userIconContainer.style.display = "block";
        if (upgradeProHeaderBtn) upgradeProHeaderBtn.classList.remove("hidden");
        
        // Actualizar información del perfil
        await updateUserProfile(user);
        
    } else {
        // Usuario no logueado - ocultar botón Pro
        if (loginBtns) loginBtns.style.display = "flex";
        if (userInfo) userInfo.style.display = "none";
        if (userIconContainer) userIconContainer.style.display = "none";
        if (userMenu) userMenu.classList.remove("show");
        if (upgradeProHeaderBtn) upgradeProHeaderBtn.classList.add("hidden");
    }
});

// ======================
//  MENÚ DE PERFIL DE USUARIO
// ======================
let currentUser = null;

// Función para actualizar perfil de usuario
async function updateUserProfile(user) {
  currentUser = user;
  
  const userName = document.getElementById("userName");
  const userEmail = document.getElementById("userEmail");
  const profilePic = document.getElementById("profilePic");
  const userIcon = document.getElementById("userIcon");
  
  try {
    // Obtener datos del usuario desde Firestore
    const userDoc = await getDoc(doc(db, "users", user.uid));
    if (userDoc.exists()) {
      const userData = userDoc.data();
      
      // Mostrar username en lugar del email
      if (userName) userName.textContent = userData.username || "Usuario";
      if (userEmail) userEmail.textContent = user.email;
    } else {
      // Fallback si no hay datos en Firestore
      if (userName) userName.textContent = user.displayName || "Usuario";
      if (userEmail) userEmail.textContent = user.email;
    }
  } catch (error) {
    console.error("Error al cargar perfil:", error);
    if (userName) userName.textContent = user.displayName || "Usuario";
    if (userEmail) userEmail.textContent = user.email;
  }

  // Cargar foto de perfil
  try {
    const storageRef = ref(storage, `profile_pics/${user.uid}.jpg`);
    const photoURL = await getDownloadURL(storageRef);
    if (profilePic) profilePic.src = photoURL;
    if (userIcon) userIcon.src = photoURL;
  } catch (error) {
    // Si no hay foto, usar default
    if (profilePic) profilePic.src = "imagenes/default-avatar.png";
    if (userIcon) userIcon.src = "imagenes/default-avatar.png";
  }
}

// Mostrar menú de perfil
const userIcon = document.getElementById("userIcon");
if (userIcon) {
  userIcon.addEventListener("click", () => {
    const userMenu = document.getElementById("userMenu");
    if (userMenu) userMenu.classList.add("show");
  });
}

// Cerrar menú de perfil
const closeProfile = document.getElementById("closeProfile");
if (closeProfile) {
  closeProfile.addEventListener("click", () => {
    const userMenu = document.getElementById("userMenu");
    if (userMenu) userMenu.classList.remove("show");
  });
}

// Cerrar menú al hacer click fuera
window.addEventListener("click", (e) => {
  const userMenu = document.getElementById("userMenu");
  if (e.target === userMenu) {
    userMenu.classList.remove("show");
  }
});

// Cambiar foto de perfil
const profilePicInput = document.getElementById("profilePicInput");
if (profilePicInput) {
  profilePicInput.addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file || !currentUser) return;

    try {
      const storageRef = ref(storage, `profile_pics/${currentUser.uid}.jpg`);
      await uploadBytes(storageRef, file);
      const photoURL = await getDownloadURL(storageRef);

      // Actualizar imágenes
      const profilePic = document.getElementById("profilePic");
      const userIcon = document.getElementById("userIcon");
      if (profilePic) profilePic.src = photoURL;
      if (userIcon) userIcon.src = photoURL;

      // Guardar URL en Firestore
      await setDoc(doc(db, "users", currentUser.uid), { 
        photoURL: photoURL 
      }, { merge: true });

      alert("Foto de perfil actualizada");

    } catch (error) {
      alert("Error al subir la foto: " + error.message);
    }
  });
}

// Cerrar sesión desde el panel de perfil
const logoutBtnProfile = document.getElementById("logoutBtnProfile");
if (logoutBtnProfile) {
  logoutBtnProfile.addEventListener("click", async () => {
    try {
      await signOut(auth);
      const userMenu = document.getElementById("userMenu");
      if (userMenu) userMenu.classList.remove("show");
    } catch (error) {
      alert("Error al cerrar sesión: " + error.message);
    }
  });
}

// ======================
//  BOTÓN MEJORAR A PRO
// ======================
const upgradeProBtn = document.getElementById("upgradeProBtn");
if (upgradeProBtn) {
  upgradeProBtn.addEventListener("click", () => {
    alert("🎉 ¡Próximamente! Función de mejora a Pro en desarrollo.\n\nPrecio: $19.99/mes\nBeneficios:\n• Acceso a juegos exclusivos\n• Estadísticas avanzadas\n• Sin anuncios\n• Soporte prioritario");
    
    // Cerrar el menú después de hacer click
    const userMenu = document.getElementById("userMenu");
    if (userMenu) userMenu.classList.remove("show");
  });
}

// ======================
//  PROTECCIÓN DE JUEGOS
// ======================

// Función para verificar autenticación antes de jugar
export function checkAuthBeforePlaying(gameUrl) {
    const user = auth.currentUser;
    if (!user) {
        openAuthModal('login');
        alert("🔐 Debes iniciar sesión para jugar");
        return false;
    }
    return true;
}

// Hacer las funciones disponibles globalmente
window.startFreestyleGame = function() {
    if (checkAuthBeforePlaying('freestyle_game.html')) {
        window.location.href = 'freestyle_game.html';
    }
};

window.startFreestyleMaster = function() {
    if (checkAuthBeforePlaying('freestyle_master.html')) {
        window.location.href = 'freestyle_master.html';
    }
};

// ======================
//  BOTÓN MEJORAR A PRO EN HEADER
// ======================
const upgradeProHeaderBtn = document.getElementById("upgradeProHeaderBtn");
if (upgradeProHeaderBtn) {
    upgradeProHeaderBtn.addEventListener("click", () => {
        alert("🎉 ¡Próximamente! Función de mejora a Pro en desarrollo.\n\nPrecio: $19.99/mes\nBeneficios:\n• Acceso a juegos exclusivos\n• Estadísticas avanzadas\n• Sin anuncios\n• Soporte prioritario");
    });
}
