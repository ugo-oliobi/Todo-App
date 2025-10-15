// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  addDoc,
  onSnapshot,
  serverTimestamp,
  query,
  where,
  orderBy,
  doc,
  getDoc,
  deleteDoc,
  updateDoc,
} from "firebase/firestore";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile,
} from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB-w1y_r9tPY2TadKz22yg0DZJ4cLixauM",
  authDomain: "todoapp-df92b.firebaseapp.com",
  projectId: "todoapp-df92b",
  storageBucket: "todoapp-df92b.firebasestorage.app",
  messagingSenderId: "913871836797",
  appId: "1:913871836797:web:eb574eecd11fa936e5c314",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

//UI Elements
const loginView = document.querySelector(".login-view");
const logoutView = document.querySelector(".logout-view");
const googleSigninBtn = document.getElementById("google-signin");
const signInBtn = document.getElementById("sign-in");
const createAccountBtn = document.getElementById("create-account");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const modalBox = document.querySelector(".modal-display");
const overlay = document.querySelector(".overlay");
const createWithEmail = document.getElementById("create-with-email");
const createWithPwd = document.getElementById("create-with-pwd");
const createWithConfrimPwd = document.getElementById("create-with-confirm-pwd");
const createBtn = document.getElementById("create-btn");
const cancelBtn = document.getElementById("cancel-btn");
const createAccountMsg = document.getElementById("create-account-msg");
const signInMsg = document.getElementById("signin-msg");
const profileDialog = document.getElementById("profileDialog");
const signOutBtn = document.querySelector(".sign-out");
const profilePicture = document.querySelector(".profile-pic");
const proPicCont = document.querySelector(".profile-pic-container");
const greetingEl = document.querySelector(".greeting");
const saveProfileBtn = document.getElementById("saveBtn");
const profileName = document.getElementById("name");
const editProfileCancelBtn = document.getElementById("cancelBtn");
const displayPictureInput = document.getElementById("profile-picture");
const taskForm = document.querySelector(".task-form");
const addNewTaskBtn = document.querySelector(".add-new-task");
const closeFormTaskBtn = document.querySelector(".close-form-btn");
const taskTitleInput = document.getElementById("task-title");
const taskDateInput = document.getElementById("form-date");
const taskDescription = document.getElementById("form-description");
const confirmCloseFormModal = document.getElementById("confirm-close-dialog");
const closeTaskFormCancelBtn = document.getElementById("closeform-cancel-btn");
const discardTaskFormBtn = document.getElementById("closeform-discard-btn");
const todoContainer = document.getElementById("todo-container");
const addTaskBtn = document.querySelector(".add-task-btn");

onAuthStateChanged(auth, (user) => {
  if (user) {
    showLoginView();
    showUserProfilePicture(profilePicture, user);
    userGreeting(greetingEl, user);
    fetchTodoListRealTime(user);
  } else {
    showLogoutView();
  }
});

//Collection Name

const collectionName = "todoList";
let isUpdating = false;
let todoTaskId;

//Event Listeners

createAccountBtn.addEventListener("click", createAccount);
cancelBtn.addEventListener("click", closeModal);
createBtn.addEventListener("click", authCreateAccountWithEmailandPwd);
signInBtn.addEventListener("click", authSignInWithEmailandPwd);
signOutBtn.addEventListener("click", authSignout);
googleSigninBtn.addEventListener("click", authSignInWithGoogleAccount);
proPicCont.addEventListener("click", () => {
  profileDialog.showModal();
});
addNewTaskBtn.addEventListener("click", () => {
  addTaskBtn.innerText = "Add Task";
  isUpdating = false;
  toggleTaskForm();
});
closeFormTaskBtn.addEventListener("click", () => {
  confirmCloseFormModal.showModal();
});
discardTaskFormBtn.addEventListener("click", () => {
  confirmCloseFormModal.close();
  clearTaskFormFields();
  toggleTaskForm();
});
closeTaskFormCancelBtn.addEventListener("click", () => {
  confirmCloseFormModal.close();
});
saveProfileBtn.addEventListener("click", function (e) {
  e.preventDefault();
  const name = profileName.value.trim();
  if (!name) {
    alert("Please enter your name");
    return;
  }
  const firstName = name.split(" ")[0].toLowerCase();

  const newDisplayName = firstName.replace(
    firstName[0],
    firstName[0].toUpperCase()
  );
  const newDisplayPicture = displayPictureInput.value
    ? displayPictureInput.value
    : "https://i.imgur.com/6GYlSed.jpg";

  updateProfile(auth.currentUser, {
    displayName: newDisplayName,
    photoURL: newDisplayPicture,
  })
    .then(() => {
      // Profile updated!
      clearEditProfileFields();
    })
    .catch((error) => {
      console.log(error.message);
    });
});

editProfileCancelBtn.addEventListener("click", () => {
  clearEditProfileFields();
});
taskForm.addEventListener("submit", addTask);

//Functions

function addTask(e) {
  addTaskToDB(e);
  toggleTaskForm();
  clearTaskFormFields();
  addTaskBtn.innerText = "Add Task";
}
async function addTaskToDB(e) {
  e.preventDefault();

  try {
    if (isUpdating) {
      const todoRef = doc(db, collectionName, todoTaskId);
      await updateDoc(todoRef, {
        title: taskTitleInput.value,
        dueDate: taskDateInput.value,
        description: taskDescription.value,
      });
    } else {
      await addDoc(collection(db, collectionName), {
        title: taskTitleInput.value,
        dueDate: taskDateInput.value,
        description: taskDescription.value,
        uid: auth.currentUser.uid,
        createdAt: serverTimestamp(),
      });
    }
  } catch (error) {
    console.error("Document not added", error.message);
  }
}
function clearTaskFormFields() {
  taskTitleInput.value = "";
  taskDateInput.value = "";
  taskDescription.value = "";
}
function toggleTaskForm() {
  taskForm.classList.toggle("hidden");
}

function clearCreateFields() {
  createWithEmail.value = "";
  createWithPwd.value = "";
  createWithConfrimPwd.value = "";
}
function clearSignInFields() {
  emailInput.value = "";
  passwordInput.value = "";
}
function clearEditProfileFields() {
  profileName.value = "";
  displayPictureInput.value = "";
  profileDialog.close();
}
function openModal() {
  modalBox.showModal();
  overlay.style.display = "block";
}
function closeModal() {
  modalBox.close();
  clearCreateFields();
  overlay.style.display = "none";
}
function showLogoutView() {
  logoutView.style.display = "block";
  loginView.style.display = "none";
  signInMsg.textContent = "";
}

function showLoginView() {
  loginView.style.display = "block";
  logoutView.style.display = "none";
  signInMsg.textContent = "";
  clearSignInFields();
}

function createAccount() {
  openModal();
}
function authCreateAccountWithEmailandPwd() {
  createAccountMsg.textContent = "";
  const email = createWithEmail.value;
  const password = createWithPwd.value;
  if (password === createWithConfrimPwd.value) {
    createUserWithEmailAndPassword(auth, email, password)
      .then(() => {
        closeModal();
      })
      .catch((error) => {
        createAccountMsg.textContent = "invalid email";
        console.error(error.message);
      });
  } else {
    createAccountMsg.textContent = "Password mismatch!";
  }
}
function authSignInWithEmailandPwd() {
  const email = emailInput.value;
  const password = passwordInput.value;
  signInWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {})
    .catch((error) => {
      signInMsg.textContent = "invalid login credentials";
      console.error(error.message);
    });
}
function authSignout() {
  signOut(auth)
    .then(() => {})
    .catch((error) => {});
}
function authSignInWithGoogleAccount() {
  signInWithPopup(auth, provider)
    .then((result) => {
      // This gives you a Google Access Token. You can use it to access the Google API.
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const token = credential.accessToken;
      // The signed-in user info.
      const user = result.user;
    })
    .catch((error) => {
      console.error(error.message);
    });
}
function showUserProfilePicture(imgElement, user) {
  // const user = auth.currentUser;
  if (user !== null) {
    const photoURL = user.photoURL;
    imgElement.src = photoURL ? photoURL : "assests/user.svg";
  }
}

function userGreeting(element, user) {
  if (user !== null) {
    const displayName = user.displayName?.split(" ")[0];

    element.textContent = `Welcome, ${displayName ? displayName : "friend"}!`;
  }
}

window.deleteTask = async function (buttonEl) {
  await deleteDoc(doc(db, collectionName, buttonEl.parentElement.id));
};
window.editTask = async function (buttonEl) {
  const taskId = buttonEl.parentElement.id;
  const docRef = doc(db, collectionName, taskId);
  const docSnap = await getDoc(docRef);
  const task = docSnap.data();
  taskTitleInput.value = task.title;
  taskDateInput.value = task.dueDate;
  taskDescription.value = task.description;
  addTaskBtn.innerText = "Update Task";
  isUpdating = true;
  todoTaskId = taskId;
  toggleTaskForm();
};

function renderTask(doc, containerEl) {
  const task = doc.data();
  const taskId = doc.id;

  containerEl.innerHTML += `
      <div id="${taskId}" class="task">
          <p><strong>Title:</strong> ${task.title}</p>
          <p><strong>Date:</strong> ${task.dueDate}</p>
          <p><strong>Description:</strong> ${lineBreaks(task.description)}</p>
          <button onclick="editTask(this)" type="button" class="btn todoEdit">Edit</button>
          <button onclick="deleteTask(this)" type="button" class="btn todoDelete">Delete</button>
        </div>
  `;
}
function lineBreaks(str) {
  return str.replace(/\n/g, "<br />");
}

function fetchTodoListRealTime(user) {
  const todoRef = collection(db, collectionName);

  const q = query(
    todoRef,
    where("uid", "==", user.uid),
    orderBy("createdAt", "desc")
  );

  onSnapshot(q, (querySnapshot) => {
    todoContainer.innerHTML = "";
    querySnapshot.forEach((doc) => {
      renderTask(doc, todoContainer);
    });
  });
}
