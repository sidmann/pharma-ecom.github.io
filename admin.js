//------------------------Firebase Config-----------------------
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.3.1/firebase-app.js";
import { ref, uploadBytes, getDownloadURL, getStorage } from "https://www.gstatic.com/firebasejs/10.3.1/firebase-storage.js";
import {
    getFirestore,
    collection,
    query,
    where,
    getDocs,
    doc,
    getDoc,
    setDoc,
    onSnapshot
} from "https://www.gstatic.com/firebasejs/10.3.1/firebase-firestore.js";
import {
    getAuth,
    signOut,
    onAuthStateChanged,
    updatePassword,
    EmailAuthProvider,
    reauthenticateWithCredential
} from "https://www.gstatic.com/firebasejs/10.3.1/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyBrIAlkIyp5ALsv5RslbXA1oQVQL3eKhig",
    authDomain: "pharma-ecom-app.firebaseapp.com",
    projectId: "pharma-ecom-app",
    storageBucket: "pharma-ecom-app.appspot.com",
    messagingSenderId: "798776981223",
    appId: "1:798776981223:web:16f92da76fe7c2f1cf9442"
};

//global
const app = initializeApp(firebaseConfig);
const firestore = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);
const confirmLogoutBtn = document.getElementById("confirmLogoutBtn");
var userData = null;
var loggedIn = null;

// Function to check if the user is logged in
function isUserLoggedIn() {
    return !!auth.currentUser;
}

//***********************************event listener**************************************
// Add an event listener to the confirmation logout button
confirmLogoutBtn.addEventListener("click", () => {
    signOut(auth)
        .then(() => {
            // Redirect to the login page or perform any other actions
            console.log("User logged out successfully");
            window.location.href = "login.html"; // Redirect to the login page
        })
        .catch((error) => {
            console.error("Error during logout:", error);
        });
});

//event for phone number validation
document.querySelector("#phone").addEventListener("keyup", () => {
    // Validate phone number
    if (!isValidPhoneNumber(document.querySelector("#phone").value)) {
        // Display an error message
        document.getElementById("phoneError").textContent =
            "*Phone number must have 10 digits.";
        document.getElementById("phoneError").style.scale = "1"
        // Stop the function execution if validation fails
    } else {
        document.getElementById("phoneError").textContent = "";
    }
});

//event for firstName validation
document.querySelector("#displayName").addEventListener("keyup", () => {
    if (!isValidFirstName(document.querySelector("#displayName").value.split(' ')[0])) {
        // Display an error message
        document.getElementById("nameError").textContent =
            "*Name must have atleast 3 characters.";
    }
    else {
        document.getElementById("nameError").textContent = ''
    }
});

document.querySelector("#newPassword").addEventListener("keyup", () => {
    if (!isValidPassword(document.querySelector("#newPassword").value)) {
        // Display an error message
        document.getElementById("passwordError").textContent =
            "*Password must have atleast 6 characters."
    }
    else {
        document.getElementById("passwordError").textContent = ''
    }
});


//***************************************************************************************

//***********************************cart dependency**********************************
//update cart function cart(dependency)
/**
* 
* @returns promise
* 
* requires: 
* getCart()
*/
function updateCart() {
    return new Promise(async (resolve) => {
        console.log("from update cart")
        const shownCart = document.querySelector('#shown-cart')

        let cart = await getCart()
        console.log(cart.length)

        if (cart.length) {
            document.querySelectorAll('.cart').forEach(ele => ele.textContent = cart.length)
        }
        else {
            document.querySelectorAll('.cart').forEach(ele => ele.textContent = 0)
        }
        console.log("resolve")
        resolve()
    })
}

async function getCart() {
    return new Promise(async (resolve) => {
        if (loggedIn) {
            console.log("form getCArt()")
            const cartSnapshot = await getDocs(collection(firestore, 'users', auth.currentUser.uid, 'cart'))
            console.log("form getCArt(1.1)")
            if (cartSnapshot.empty) {
                console.log("form getCArt(1.2)")
                resolve([])
            }
            console.log("form getCArt(1.3)")
            let cart = []
            cartSnapshot.forEach(doc => {
                cart.push(doc.data())
            })
            console.log("form getCArt(1.4)")
            resolve(cart)
        }
        else {
            console.log("form getCArt1)")
            const cartSnapshot = JSON.parse(sessionStorage.getItem('cart'))
            if (!cartSnapshot) {
                console.log('from true')
                resolve([])
                return
            }
            var cart = []
            cartSnapshot.forEach(doc => {
                cart.push(doc)
            })
            resolve(cart)
        }
    })
}

//get user snapshot cart(dependency)
function getUserSnapshot(uid) {
    const userRef = doc(firestore, 'users', uid)
    return new Promise((resolve, reject) => {
        resolve(getDoc(userRef))
    })
}
//**************************************************************************************

//*****************************loading and role access************************************
// Use onAuthStateChanged to control access to admin dashboard
onAuthStateChanged(auth, (user) => {
    if (user) {
        loggedIn = true
        document.querySelector('#logout-btn').style.display = 'block';
        onLoggedIn();
        // User is authenticated
        const docRef = doc(firestore, "users", user.uid);
        const docSnap = getDoc(docRef);
        docSnap.then((docSnapshot) => {
            // console.log(docSnapshot)
            if (docSnapshot.exists()) {
                userData = docSnapshot.data();
                console.log(userData)
                roleAccess(userData.role);
                populateShownDetails();
                populateProfileData(userData);
                updateCart();
                getUserRealTime();
                // fetchNavCategories();
            }
        });
    } else {
        document.querySelector('#logout-btn').style.display = 'none';
        window.location.href = "login.html";
    }
});

function roleAccess(role) {
    // console.log('inside role')
    const roleMap = new Map([
        ["ADMIN", "adminAppbar"],
        ["CUSTOMER", "customerAppbar"],
        // ["AGENT", "agentAppbar"],
    ]);
    const appbarList = document.querySelectorAll(`#${roleMap.get(role)}`);
    appbarList.forEach((appbar) => {
        appbar.classList.remove("d-none");
    })
}

function updateProfileName(role, fullName) {
    // Based on the role, select the appropriate element
    console.log(fullName)
    let profileNameElement;
    switch (role) {
        case 'CUSTOMER':
            profileNameElement = document.getElementById('customerAppbar').querySelector('.profile-name');
            break;
        // case 'AGENT':
        //     profileNameElement = document.getElementById('agentAppbar').querySelector('.profile-name');
        //     break;
        case 'ADMIN':
            profileNameElement = document.getElementById('adminAppbar').querySelector('.profile-name');
            break;
        default:
            console.error('Unknown role:', role);
            return;
    }
    profileNameElement.textContent = fullName;
}

function updateProfilePicture(role, profilePicture) {
    let profilePictureElement;
    const defaultProfilePicture = 'https://mdbcdn.b-cdn.net/img/Photos/new-templates/bootstrap-chat/ava1-bg.webp';

    switch (role) {
        case 'CUSTOMER':
            profilePictureElement = document.getElementById('customerAppbar').querySelector('#profile-picture');
            break;
        // case 'AGENT':
        //     profilePictureElement = document.getElementById('agentAppbar').querySelector('#profile-picture');
        //     break;
        case 'ADMIN':
            profilePictureElement = document.getElementById('adminAppbar').querySelector('#profile-picture');
            break;
        default:
            console.error('Unknown role:', role)
            return;
    }

    // Check if profilePicture is empty or undefined
    if (profilePicture && profilePicture.trim() !== '') {
        profilePictureElement.src = profilePicture;
    } else {
        // Set to the default profile picture if no picture is provided
        profilePictureElement.src = defaultProfilePicture;
    }
}

//to execut upon logging in
function onLoggedIn() {
    var navItemList = document.querySelectorAll(".loggedIn");
    navItemList.forEach((navItem) => {
        navItem.style.display = "block";
    });

    navItemList = document.querySelectorAll(".loggedOut");
    navItemList.forEach((navItem) => {
        navItem.style.display = "none";
    });
}

//to execute upon logging out
function onLoggedOut() {
    var navItemList = document.querySelectorAll(".loggedOut");
    navItemList.forEach((navItem) => {
        navItem.style.display = "block";
    });

    navItemList = document.querySelectorAll(".loggedIn");
    navItemList.forEach((navItem) => {
        navItem.style.display = "none";
    });
}



//**********************************************************************

function populateProfileData(userData) {
    // document.getElementById("profile-avatar").src = userData.profilePic || "default-profile-pic.jpg";
    document.getElementById("displayName").value =
        userData.firstName + " " + userData.lastName || "";
    document.getElementById("email").value = userData.email || "";
    document.getElementById("phone").value = userData.phoneNumber || "";
}

// Function to update the user profile
function updateProfile(uid, profileData) {
    const docRef = doc(firestore, "users", uid);
    setDoc(docRef, profileData, { merge: true })
        .then(() => {
            displayMessage("Profile updated successfully!", "success");
            console.log("Profile updated successfully!");

            document.querySelector('#saveProfileChangesBtn').disabled = false
            document.querySelector('#saveProfileChangesBtn').textContent = 'Save Changes'
        })
        .catch((error) => {
            displayMessage(
                "Error updating profile. Please try again.",
                "danger"
            );

            document.querySelector('#saveProfileChangesBtn').disabled = false
            document.querySelector('#saveProfileChangesBtn').textContent = 'Save Changes'

            console.error("Error updating profile:", error);
        });
}

// Event listener for the "Edit Profile" button
// document.getElementById("edit-profile").addEventListener("click", () => {
//     // Get the current user

//     if (userData) {
//         // Populate the modal with the user's current data
//         populateProfileData(userData);
//     }
// });

//populate shown details
function populateShownDetails() {
    if (userData) {
        // const shownEmail = document.getElementById("shown-email");
        // const shownPhoneNumber = document.getElementById("shown-phoneNumber");
        // const shownName = document.getElementById("shown-name");
        // const shownRole = document.getElementById("shown-role");
        const shownProfilePicture = document.getElementById("shown-profilePicture");


        // Populate the elements with user information
        // shownEmail.textContent = userData.email || "";
        // shownPhoneNumber.textContent = userData.phoneNumber || "";
        // shownName.textContent = (userData.firstName || '') + " " + (userData.lastName || "");
        // shownRole.textContent = userData.role || "";
        shownProfilePicture.src = userData.profilePicture || "https://mdbcdn.b-cdn.net/img/Photos/new-templates/bootstrap-chat/ava1-bg.webp";
    }
}

// Function to handle file input change and update the profile picture preview
function handleProfilePictureChange() {
    const profilePictureInput = document.getElementById("profilePicture");
    const shownProfilePicture = document.getElementById("shown-profilePicture");

    const file = profilePictureInput.files[0];

    if (file) {
        // Read the selected file as a data URL
        const reader = new FileReader();
        reader.onload = function (e) {
            shownProfilePicture.src = e.target.result; // Set the preview image source
        };

        reader.readAsDataURL(file);
    } else {
        // If no file is selected, reset the preview to the default image
        shownProfilePicture.src =
            "https://mdbcdn.b-cdn.net/img/Photos/new-templates/bootstrap-chat/ava1-bg.webp";
    }
}

// Attach the event listener to the file input
document.getElementById("profilePicture").addEventListener("change", handleProfilePictureChange);

// Event listener for the "Save Changes" button in the edit profile modal
document.getElementById("saveProfileChangesBtn").addEventListener("click", async () => {
    // Get the current user
    const user = auth.currentUser;
    if (user) {
        //fields to be saved
        // displayMessage("Updating!", 'success');
        document.querySelector('#saveProfileChangesBtn').disabled = true
        document.querySelector('#saveProfileChangesBtn').textContent = 'Updating Profile....'
        const [firstName, lastName] = document
            .getElementById("displayName")
            .value.split(" ");
        const phone = document.getElementById("phone").value;
        const email = document.getElementById("email").value;
        const profilePictureInput = document.getElementById("profilePicture");
        const profilePictureFile = profilePictureInput.files[0];

        // Validate first name (minimum 3 characters)
        if (!isValidFirstName(firstName) || (!isValidPhoneNumber(phone))) {
            document.querySelector('#saveProfileChangesBtn').disabled = false
            document.querySelector('#saveProfileChangesBtn').textContent = 'Save Changes'
            displayMessage('Please check your entered values!', 'danger')
            return; // Stop the function execution if validation fails
        }

        // If a new profile picture is selected, upload it to Firebase Storage
        if (profilePictureFile) {
            const storageRef = ref(storage, "avatars/" + user.uid + '.' + 'jpeg');
            const uploadTask = await uploadBytes(storageRef, profilePictureFile);
            const url = await getDownloadURL(uploadTask.ref)
            const userJson = {
                firstName: firstName,
                lastName: lastName,
                phoneNumber: phone,
                email: email,
                profilePicture: url, // Add the download URL to user data
            };
            // Update the user's profile data (including the profile picture URL)
            updateProfile(user.uid, userJson);
            // uploadTask.then((snapshot) => {
            //     getDownloadURL(snapshot.ref).then((downloadURL) => {
            //     // Include the profile picture URL in the user's profile data
            //     const userJson = {
            //       firstName: firstName,
            //       lastName: lastName,
            //       phoneNumber: phone,
            //       email: email,
            //       profilePicture: downloadURL, // Add the download URL to user data
            //     };

            //       // Update the user's profile data (including the profile picture URL)
            //       updateProfile(user.uid, userJson);
            //   });
            // });
        } else {
            // If no new profile picture is selected, update the user's profile data without the picture

            const userJson = {
                firstName: firstName,
                lastName: lastName,
                phoneNumber: phone,
                email: email,
            };
            // Update the user's profile data
            updateProfile(user.uid, userJson);
        }
    }
});

// Event listener for changing the password
document
    .getElementById("changePasswordBtn")
    .addEventListener("click", () => {
        document.querySelector('#changePasswordBtn').disabled = true
        document.querySelector('#changePasswordBtn').textContent = 'Updating Password...'
        // Get the current user
        const user = auth.currentUser;
        if (user) {
            const currentPassword =
                document.getElementById("currentPassword").value;
            const newPassword = document.getElementById("newPassword").value;
            const confirmNewPassword =
                document.getElementById("confirmNewPassword").value;

            // Verify that the current password and new password match
            if (currentPassword === newPassword) {
                displayMessage(
                    "Current password and new password should not be the same.",
                    "danger"
                );
                document.querySelector('#changePasswordBtn').disabled = false
                document.querySelector('#changePasswordBtn').textContent = 'Change Password'
                return;
            }

            // Verify that the new password and confirm new password match
            if (newPassword !== confirmNewPassword) {
                displayMessage(
                    "New password and confirm new password do not match.",
                    "danger"
                );
                document.querySelector('#changePasswordBtn').disabled = false
                document.querySelector('#changePasswordBtn').textContent = 'Change Password'
                // alert("New password and confirm new password do not match.");
                return;
            }

            // Change the user's password
            updatePasswordFn(user, currentPassword, newPassword);

            // Close the change password modal
            const changePasswordModal = new bootstrap.Modal(
                document.getElementById("changePasswordModalLabel")
            );
            changePasswordModal.hide();
        }
    });

// Function to update the user's password
function updatePasswordFn(user, currentPassword, newPassword) {
    //check new password validity, else return
    if (!isValidPassword(document.querySelector("#newPassword").value)) return;

    const credentials = EmailAuthProvider.credential(
        user.email,
        currentPassword
    );

    // Reauthenticate the user with their current password
    reauthenticateWithCredential(user, credentials)
        .then(() => {
            // Password reauthentication successful, now update the password
            updatePassword(user, newPassword)
                .then(() => {
                    displayMessage("Password updated successfully!", "success");
                    document.querySelector('#changePasswordBtn').disabled = false
                    document.querySelector('#changePasswordBtn').textContent = 'Change Password'
                    // Close the change password modal
                    const changePasswordModal = new bootstrap.Modal(
                        document.getElementById("changePasswordModalLabel")
                    );
                    changePasswordModal.hide();
                })
                .catch((error) => {
                    console.error("Error updating password:", error);
                    displayMessage(
                        "Error updating password. Please try again.",
                        "danger"
                    );
                    document.querySelector('#changePasswordBtn').disabled = false
                    document.querySelector('#changePasswordBtn').textContent = 'Change Password'
                });
        })
        .catch((error) => {
            console.error("Error reauthenticating user:", error);
            displayMessage(
                "Error reauthenticating user. Please check your current password.",
                "danger"
            );
            document.querySelector('#changePasswordBtn').disabled = false
            document.querySelector('#changePasswordBtn').textContent = 'Change Password'
        });
}

// Function to toggle password visibility
function togglePasswordVisibility(inputId, toggleBtnId) {
    const passwordInput = document.getElementById(inputId);
    const toggleBtn = document.getElementById(toggleBtnId);

    toggleBtn.addEventListener("click", () => {
        if (passwordInput.type === "password") {
            passwordInput.type = "text";
            toggleBtn.innerHTML = '<i class="fi-rr-eye-crossed"></i>'; // Change the icon to an eye-slash
        } else {
            passwordInput.type = "password";
            toggleBtn.innerHTML = '<i class="fi-rr-eye"></i>'; // Change the icon back to an eye
        }
    });
}

// Toggle password visibility for current password and new password fields
togglePasswordVisibility("currentPassword", "currentPasswordToggle");
togglePasswordVisibility("newPassword", "newPasswordToggle");

//*************************Toast Message*********************************
//display message function
/**
 * 
 * @param {*} message 
 * @param {*} type 
 * 
 * Toast message
 */
function displayMessage(message, type) {
    // Get the toast container element
    const toastContainer = document.querySelector(".toast-container");

    // Create a clone of the toast template
    const toast = document.querySelector(".toast").cloneNode(true);

    console.log(toast)
    // Set the success message
    toast.querySelector(".compare-note").innerHTML = message;

    //set text type  success/danger
    if (type === "danger") {
        toast.classList.remove("bg-success");
        toast.classList.add("bg-danger");
    } else {
        toast.classList.add("bg-success");
        toast.classList.remove("bg-danger");
    }

    // Append the toast to the container
    toastContainer.appendChild(toast);

    // Initialize the Bootstrap toast and show it
    const bsToast = new bootstrap.Toast(toast);
    bsToast.show();

    // Remove the toast after it's closed
    toast.addEventListener("hidden.bs.toast", function () {
        toast.remove();
    });
}

//*************************Real Time***************************
function getUserRealTime() {
    onSnapshot(doc(firestore, 'users', auth.currentUser.uid), (doc) => {
        userData = doc.data();
        populateShownDetails();
        updateProfileName(userData.role, userData.firstName);
        updateProfilePicture(userData.role, userData.profilePicture);
    })
}
//*************************************************************

//*************************Validation**************************
// Function to validate first name (minimum 3 characters)
function isValidFirstName(name) {
    return name.length >= 3;
}

// Function to validate phone number (must be exactly 10 digits)
function isValidPhoneNumber(phone) {
    const phoneNumberRegex = /^\d{10}$/;
    return phoneNumberRegex.test(phone);
}

function isValidPassword(password) {
    return password.length >= 6;
}
//***************************************************************

/**
 * 
 * @returns promise
 */
async function fetchNavCategories() {
    const categoryList = document.querySelector('.nav-category')
    const mobileCategoryList = document.querySelector('.mobile-nav-category')

    categoryList.innerHTML = `
    <div class='w-100 d-flex justify-content-center'>
        <div class="spinner-grow text-secondary" role="status">
            <span class="visually-hidden">Loading...</span>
        </div>
    </div>
    `
    mobileCategoryList.innerHTML = `
    <div class='w-100 d-flex justify-content-center'>
        <div class="spinner-grow text-secondary" role="status">
            <span class="visually-hidden">Loading...</span>
        </div>
    </div>
    `
    const categorySnapshot = await getDocs(collection(firestore, 'categories'))
    if (categorySnapshot.empty) {
        console.log('from empty')
        resolve()
        return
    }

    categoryList.innerHTML = ``
    mobileCategoryList.innerHTML = ``

    categorySnapshot.forEach(doc => {
        const span = document.createElement('span')
        span.innerHTML = `
        <div class="gi-tab-list nav flex-column nav-pills me-3" id="v-pills-tab"
        role="tablist" aria-orientation="vertical">
            <button class="nav-link" id="v-pills-home-tab" data-bs-toggle="pill"
                data-bs-target="#v-pills-home" type="button" role="tab"
                aria-controls="v-pills-home" aria-selected="true">
                <a class="text-decoration-none text-black" href="products.html?categoryId=${doc.data().categoryId}">${doc.data().name}</a>
            </button>
        </div>
        `
        categoryList.appendChild(span)

        const list = document.createElement('li')
        list.innerHTML = `
        <a class="text-decoration-none text-black" href="products.html?categoryId=${doc.data().categoryId}">${doc.data().name}</a>
        `
        mobileCategoryList.appendChild(list)
    })
}
