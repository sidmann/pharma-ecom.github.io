import { initializeApp } from "https://www.gstatic.com/firebasejs/10.3.1/firebase-app.js";
import { getFirestore, collection, addDoc, query, where, getDocs, updateDoc, doc, getDoc, setDoc, deleteField } from "https://www.gstatic.com/firebasejs/10.3.1/firebase-firestore.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.3.1/firebase-auth.js"
import { getStorage, ref, uploadBytes, getDownloadURL, uploadBytesResumable } from "https://www.gstatic.com/firebasejs/10.3.1/firebase-storage.js";

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
            // console.log("User logged out successfully");
            window.location.href = "login.html"; // Redirect to the login page
        })
        .catch((error) => {
            console.error("Error during logout:", error);
        });
});

//************************cart dependency**********************************
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
        // console.log("from update cart")
        const shownCart = document.querySelector('#shown-cart')

        let cart = await getCart()
        // console.log(cart.length)

        if (cart.length) {
            document.querySelectorAll('.cart').forEach(ele => ele.textContent = cart.length)
        }
        else {
            document.querySelectorAll('.cart').forEach(ele => ele.textContent = 0)
        }
        // console.log("resolve")
        resolve()
    })
}

async function getCart() {
    return new Promise(async (resolve) => {
        if (loggedIn) {
            // console.log("form getCArt()")
            const cartSnapshot = await getDocs(collection(firestore, 'users', auth.currentUser.uid, 'cart'))
            // console.log("form getCArt(1.1)")
            if (cartSnapshot.empty) {
                // console.log("form getCArt(1.2)")
                resolve([])
            }
            // console.log("form getCArt(1.3)")
            let cart = []
            cartSnapshot.forEach(doc => {
                cart.push(doc.data())
            })
            // console.log("form getCArt(1.4)")
            resolve(cart)
        }
        else {
            // console.log("form getCArt1)")
            const cartSnapshot = JSON.parse(sessionStorage.getItem('cart'))
            if (!cartSnapshot) {
                // console.log('from true')
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
    // console.log('3')
    return new Promise((resolve, reject) => {
        resolve(getDoc(userRef))
    })
}
//************************************************************************

//*****************************loading and role access************************************
// Use onAuthStateChanged to control access to admin dashboard
onAuthStateChanged(auth, (user) => {
    // console.log("inside onAuth")
    if (user) {
        // console.log("if")
        loggedIn = true
        document.querySelectorAll('.logout-btn').forEach((btn) => {
            btn.classList.remove('d-none');
        });
        onLoggedIn();
        // User is authenticated
        const docRef = doc(firestore, "users", user.uid);
        const docSnap = getDoc(docRef);
        docSnap.then((docSnapshot) => {
            // console.log(docSnapshot)
            if (docSnapshot.exists()) {
                userData = docSnapshot.data();
                roleAccess(userData.role);
                updateProfileName(userData.role, userData.firstName)
                updateProfilePicture(userData.role, userData.profilePicture)
                updateCart();
                // fetchNavCategories();
            }
        });
    } else {
        // console.log("else")
        document.querySelectorAll('.logout-btn').forEach((btn) => {
            btn.classList.add('d-none');
        });
        // User is not authenticated, redirect to login page
        loggedIn = false;
        updateCart();
        // fetchNavCategories();
    }
});

function updateProfileName(role, fullName) {
    // Based on the role, select the appropriate element
    // console.log(fullName)
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

//stop the loader show the main body
function stopLoader() {
    document.querySelector('#overlay').classList.add('hidden');
    document.querySelector('#main').classList.remove('hidden');
}

//Email sending part
document.addEventListener('DOMContentLoaded', function (event) {
    var careerForm = document.getElementById('careerForm');
    // var resultDiv = document.getElementById('result');

    careerForm.addEventListener('submit', function (event) {
        event.preventDefault(); // Prevent the default form submission

        // Collect form data
        var firstName = document.getElementById('first_name').value;
        var lastName = document.getElementById('last_name').value;
        var email = document.getElementById('email').value;
        var phoneNumber = document.getElementById('phoneNumber').value;
        var jobRole = document.getElementById('job_role').value;
        var address = document.getElementById('address').value;
        var city = document.getElementById('city').value;
        var date = document.getElementById('date').value;
        var uploadInput = document.getElementById('upload');
        var uploadFile = uploadInput.files[0];

        //Peform validation
        const firstNameValid = isValidFirstName(firstName);
        const lastNameValid = lastName !== "";
        const emailValid = isValidEmail(email);
        const phoneNumberValid = isValidPhoneNumber(phoneNumber);
        const jobRoleValid = jobRole !== "";
        const addressValid = address !== "";
        const cityValid = city !== "";
        const dateValid = date !== "";
        const fileValid = uploadFile !== undefined;

        //Display error
        displayError('firstNameError', firstNameValid, '*Please enter a valid first name');
        displayError('lastNameError', lastNameValid, '*Please enter a valid last name');
        displayError('emailError', emailValid, '*Please enter a valid email');
        displayError('phoneNumberError', phoneNumberValid, '*Please enter a valid 10-digit phone number');
        displayError('jobRoleError', jobRoleValid, '*Please enter a job role');
        displayError('addressError', addressValid, '*Please enter your address');
        displayError('cityError', cityValid, '*Please enter your city name');
        displayError('dateError', dateValid, '*Please select a date');
        displayError('uploadError', fileValid, '*Please upload your CV');

        if (firstNameValid && lastNameValid && emailValid && phoneNumberValid && jobRoleValid && addressValid && cityValid && dateValid && fileValid) {
            // console.log("dasadsadsad");
            // All fields are valid, proceed with form submission
            document.querySelector('#submitBtn').disabled = true;
            document.querySelector('#submitBtn').textContent = 'Applying ...';

            // Upload PDF to Firebase Storage
            const storageRef = ref(storage, 'resumes/' + uploadFile.name);
            const uploadTask = uploadBytesResumable(storageRef, uploadFile);

            uploadTask.on('state_changed',
                (snapshot) => {
                    // Update progress bar or display percentage
                    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    console.log('Upload is ' + progress + '% done');
                },
                (error) => {
                    console.error('Error uploading PDF:', error);
                    document.querySelector('#submitBtn').disabled = false;
                    document.querySelector('#submitBtn').textContent = 'Apply Now';
                },
                () => {
                    // Upload complete, now get the download URL
                    getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
                        // Prepare form data
                        const formData = new FormData();
                        formData.append('firstName', firstName);
                        formData.append('lastName', lastName);
                        formData.append('email', email);
                        formData.append('phoneNumber', phoneNumber);
                        formData.append('jobRole', jobRole);
                        formData.append('address', address);
                        formData.append('city', city);
                        formData.append('date', date);
                        formData.append('upload', downloadURL);

                        sendEmail(formData);
                    });
                }
            );
        }
    });
});

// Email sending function
function sendEmail(formData) {
    // console.log(formData);
    // Perform AJAX request to send email
    var xhr = new XMLHttpRequest();
    xhr.open('POST', 'https://api.emailjs.com/api/v1.0/email/send', true);
    xhr.setRequestHeader('Content-Type', 'application/json');

    var formData = JSON.stringify({
        user_id: 'Id-zWQwk4g0yRS25q',
        service_id: 'service_bf1n6au',
        template_id: 'template_z4ybr8q',
        template_params: Object.fromEntries(formData)
    });
    // console.log(data);

    xhr.onload = function () {
        if (xhr.status === 200) {
            document.querySelector('#submitBtn').disabled = false;
            document.querySelector('#submitBtn').textContent = 'Apply Now';
            // resultDiv.textContent = 'Your mail is sent!';
            displayMessage('Your details submitted successfully!', 'success');
            document.getElementById('careerForm').reset();
        } else {
            document.querySelector('#submitBtn').disabled = false;
            document.querySelector('#submitBtn').textContent = 'Apply Now';
            // resultDiv.textContent = 'Oops... ' + xhr.responseText;
            displayMessage('Something went wrong!, Try again.', 'danger');
            document.getElementById('careerForm').reset();
        }
    };
    // console.log(formData);
    xhr.send(formData);
}

//*************************************toast message**********************************
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

//*************************Validation**************************
// Function to validate first name (minimum 3 characters)
function isValidFirstName(name) {
    return name.length >= 3;
}

//Function to validate email 
function isValidEmail(email) {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailPattern.test(email);
}

// Function to validate phone number (must be exactly 10 digits)
function isValidPhoneNumber(phoneNumber) {
    const phoneNumberRegex = /^\d{10}$/;
    return phoneNumberRegex.test(phoneNumber);
}

// Function to display error messages
function displayError(errorElementId, isValid, errorMessage) {
    const errorElement = document.getElementById(errorElementId);
    if (!isValid) {
        errorElement.textContent = errorMessage;
    } else {
        errorElement.textContent = "";
    }
}

/**
 *
 * @returns promise
 */
// async function fetchNavCategories() {
//     const categoryList = document.querySelector('.nav-category')
//     const mobileCategoryList = document.querySelector('.mobile-nav-category')

//     categoryList.innerHTML = `
//     <div class='w-100 d-flex justify-content-center'>
//         <div class="spinner-grow text-secondary" role="status">
//             <span class="visually-hidden">Loading...</span>
//         </div>
//     </div>
//     `
//     mobileCategoryList.innerHTML = `
//     <div class='w-100 d-flex justify-content-center'>
//         <div class="spinner-grow text-secondary" role="status">
//             <span class="visually-hidden">Loading...</span>
//         </div>
//     </div>
//     `
//     const categorySnapshot = await getDocs(collection(firestore, 'categories'))
//     if (categorySnapshot.empty) {
//         console.log('from empty')
//         resolve()
//         return
//     }

//     categoryList.innerHTML = ``
//     mobileCategoryList.innerHTML = ``

//     categorySnapshot.forEach(doc => {
//         const span = document.createElement('span')
//         span.innerHTML = `
//         <div class="gi-tab-list nav flex-column nav-pills me-3" id="v-pills-tab"
//         role="tablist" aria-orientation="vertical">
//             <button class="nav-link" id="v-pills-home-tab" data-bs-toggle="pill"
//                 data-bs-target="#v-pills-home" type="button" role="tab"
//                 aria-controls="v-pills-home" aria-selected="true">
//                 <a class="text-decoration-none text-black" href="products.html?categoryId=${doc.data().categoryId}">${doc.data().name}</a>
//             </button>
//         </div>
//         `
//         categoryList.appendChild(span)

//         const list = document.createElement('li')
//         list.innerHTML = `
//         <a class="text-decoration-none text-black" href="products.html?categoryId=${doc.data().categoryId}">${doc.data().name}</a>
//         `
//         mobileCategoryList.appendChild(list)
//     })
// }