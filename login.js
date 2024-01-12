//------------------------Firebase Config-----------------------//
// firesStore
import {
    firestore,
    collection,
    query,
    where,
    getDocs,
    updateDoc,
    doc,
    getDoc,
    addDoc
} from "./assets/repository/initialize.js";

//Auth 
import {
    auth,
    onAuthStateChanged,
    signOut,
    updatePassword,
    EmailAuthProvider,
    reauthenticateWithCredential,
    signInWithEmailAndPassword,
    sendPasswordResetEmail,
    createUserWithEmailAndPassword
} from "./assets/repository/initialize.js";

import {
    storage,
    ref,
    uploadBytes,
    getDownloadURL
} from "./assets/repository/initialize.js"
//------------------------------------------------------------------//

//--------------------- global var ---------------------------------//
var loggedIn = null

//--------------------------gloabal scripts---------------------------//
updateCart();
// fetchNavCategories();

//-------------------------cart dependency---------------------------//
/**
 * update cart function cart(dependency)
 * @returns promise
 * 
 * requires: 
 * getCart()
 */
function updateCart() {
    return new Promise(async (resolve) => {
        const shownCart = document.querySelector('#shown-cart')
        let cart = await getCart()

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

/**
 * to get cart 
 * @returns mydev
 */
async function getCart() {
    return new Promise(async (resolve) => {
        if (loggedIn) {
            const cartSnapshot = await getDocs(collection(firestore, 'users', auth.currentUser.uid, 'cart'))
            if (cartSnapshot.empty) {
                resolve([])
            }
            let cart = []
            cartSnapshot.forEach(doc => {
                cart.push(doc.data())
            })
            resolve(cart)
        }
        else {
            const cartSnapshot = JSON.parse(sessionStorage.getItem('cart'))
            if (!cartSnapshot) {
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


/**
 * Decrypting the password  
 * @param {*} password 
 * @returns mydev
 */
function decPass(password) {
    const secretKey = "yourSecretKey";
    const bytes = CryptoJS.AES.decrypt(password, secretKey);
    const decryptedPassword = bytes.toString(CryptoJS.enc.Utf8);
    return decryptedPassword;
}

document.addEventListener("DOMContentLoaded", function () {
    // Function to toggle password visibility
    function togglePasswordVisibility() {
        const passwordInput = document.getElementById("password");
        const passwordToggle = document.getElementById("passwordToggle");

        if (passwordInput.type === "password") {
            passwordInput.type = "text";
            passwordToggle.classList.remove("fi-rr-eye");
            passwordToggle.classList.add("fi-rr-eye-crossed");
        } else {
            passwordInput.type = "password";
            passwordToggle.classList.remove("fi-rr-eye-crossed");
            passwordToggle.classList.add("fi-rr-eye");
        }
    }

    // Add a click event listener to the password toggle icon
    const passwordToggle = document.getElementById("passwordToggle");
    if (passwordToggle) {
        passwordToggle.addEventListener("click", togglePasswordVisibility);
    }

    function saveLoginCredentials(email) {
        localStorage.setItem("rememberedEmail", email);
    }

    function getRememberedCredentials() {
        const rememberedEmail = localStorage.getItem("rememberedEmail");
        if (rememberedEmail) {
            document.getElementById("email").value = rememberedEmail;
            document.getElementById("rememberMe").checked = true;
        }
    }

    function rememberMe() {
        if (document.getElementById("rememberMe").checked) {
            const email = document.getElementById("email").value;
            saveLoginCredentials(email);
        } else {
            localStorage.removeItem("rememberedEmail");
        }
    }

    getRememberedCredentials();
    function detectUserRole(email) {
        const usersRef = collection(firestore, "users");
        const querySnapshot = getDocs(
            query(usersRef, where("email", "==", email))
        );
        querySnapshot
            .then((snapshot) => {
                if (!snapshot.empty) {
                    snapshot.forEach((doc) => {
                        const role = doc.data().role;
                        if (role === "ADMIN") {
                            window.location.href = "admin.html";
                            window.history.replaceState({}, "", "admin.html");
                        } else if (role === "CUSTOMER") {
                            window.location.href = "user.html";
                            window.history.replaceState({}, "", "user.html");
                        }
                        // else if (role === "AGENT") {
                        //     window.location.href = "agent.html";
                        //     window.history.replaceState({}, "", "agent.html");
                        // }
                    });
                } else {

                }
            })
            .catch((error) => {
            });
    }

    async function loginUser(email, password) {
        // const decryptedPassword = decPass(password);
        signInWithEmailAndPassword(auth, email, password)
            .then(async (userCredential) => {

                await convertLocalCartToRemote()
                document.querySelector('#sub_btn').textContent = 'Submit'
                displayMessage('Login Successful!', 'success')
                // User successfully signed in
                rememberMe();
                const user = userCredential.user;

                document.querySelector('#sub_btn').disabled = false
                sessionStorage.removeItem('cart')
                detectUserRole(email);

            })
            .catch((error) => {
                const authError = document.getElementById("loginError");
                console.error(error)
                // console.log(error.message.match(/Firebase:(.*)\(auth\/.*\)/))
                if (error.code && error.code.startsWith("auth/")) {
                    const errorCode = error.code.split("/")[1];
                    if (errorCode === 'wrong-password') {
                        authError.textContent = `Bad Credentials`;
                    }
                    else if (errorCode === 'missing-password')
                        authError.textContent = `Bad Credentials`;
                    else
                        authError.innerHTML = errorCode.split('-').join(' ') + '<br>' + error.message.match(/Firebase:(.*)\(auth\/.*\)/)[1];
                } else {
                    authError.textContent = "An error occurred. Please try again later.";
                }
                authError.style.display = "block";

                document.querySelector('#sub_btn').disabled = false
                document.querySelector('#sub_btn').textContent = 'Submit'
            });
    }

    // Function to show the login form and hide the forgot password form
    function showLoginForm() {
        const loginForm = document.getElementById("loginForm");
        const forgotPasswordForm =
            document.getElementById("forgotPasswordForm");

        loginForm.style.display = "block";
        forgotPasswordForm.style.display = "none";
    }

    // Add an event listener to the "Back to Login" button
    const backToLoginButton = document.getElementById("backToLoginButton");
    backToLoginButton.addEventListener("click", (e) => {
        e.preventDefault();
        showLoginForm();
    });

    //login Form find
    const loginForm = document.getElementById("formContainer");
    loginForm.addEventListener("submit", (e) => {
        e.preventDefault();
        document.querySelector('#sub_btn').disabled = true
        document.querySelector('#sub_btn').textContent = 'Logging in ...'
        const email = document.getElementById("email").value;
        const password = document.getElementById("password").value;
        loginUser(email, password);
    });

    onAuthStateChanged(auth, (user) => {
        // console.log('inside onauth')
        if (user) {
            // console.log("if");
            document.querySelectorAll('.logout-btn').forEach((btn) => {
                btn.classList.remove('d-none');
            });
        } else {
            // console.log("else");
            document.querySelectorAll('.logout-btn').forEach((btn) => {
                btn.classList.add('d-none');
            });
        }
    });

    // Function to show the "Forgot Password" form and hide the login form
    function showForgotPasswordForm() {
        const loginForm = document.getElementById("loginForm");
        const forgotPasswordForm = document.getElementById("forgotPasswordForm");
        loginForm.style.display = "none";
        forgotPasswordForm.style.display = "block";
    }

    const forgotPasswordLink =
        document.getElementById("forgotPasswordLink");
    forgotPasswordLink.addEventListener("click", (e) => {
        e.preventDefault();
        showForgotPasswordForm();
    });

    // Add a listener for the Forgot Password form submission
    const forgotPasswordSubmitButton = document.getElementById(
        "forgotPasswordSubmit"
    );
    forgotPasswordSubmitButton.addEventListener("click", (e) => {
        e.preventDefault();
        forgotPasswordSubmitButton.textContent = 'Sending Link ...'
        forgotPasswordSubmitButton.disabled = true
        const forgotEmail = document.getElementById("forgotEmail").value;
        sendPasswordResetEmail(auth, forgotEmail)
            .then(() => {
                // Password reset email sent successfully
                displayMessage('Password reset link sent successfully to your email!', 'success')

                forgotPasswordSubmitButton.textContent = 'Submit'
                forgotPasswordSubmitButton.disabled = false

                // Reset the email field
                document.getElementById("forgotEmail").value = "";
            })
            .catch((error) => {
                // Handle email-related errors
                displayMessage('Please enter your registered email!', 'danger')

                forgotPasswordSubmitButton.textContent = 'Submit'
                forgotPasswordSubmitButton.disabled = false

                // Reset the email field
                document.getElementById("forgotEmail").value = "";
            });
    });
});

//-------------------------------toast message-----------------------------------

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

    // console.log(toast)
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
//----------------------------------------------------------------

async function convertLocalCartToRemote() {
    return new Promise(async (resolve) => {
        if (sessionStorage.getItem('cart')) {
            // console.log(auth.currentUser.uid)
            // console.log('1')
            const userDoc = await getDoc(doc(firestore, 'users', auth.currentUser.uid))
            var cartSnapshot = await getDocs(collection(userDoc.ref, 'cart'))
            // console.log('2')
            const cart = JSON.parse(sessionStorage.getItem('cart'))
            // console.log(cart)


            // console.log('3')
            if (cartSnapshot.empty) {
                // console.log('4')
                cart.forEach(async (item) => {
                    // console.log(item)
                    await addDoc(collection(firestore, 'users', auth.currentUser.uid, 'cart'), {
                        productId: item.productId,
                        quantity: item.quantity
                    })
                })
            }
            else {
                // console.log('5')
                cart.forEach(async (item) => {
                    cartSnapshot = await getDocs(query(collection(userDoc.ref, 'cart'), where('productId', '==', item.productId)))
                    if (cartSnapshot.empty) {
                        await addDoc(collection(firestore, 'users', auth.currentUser.uid, 'cart'), {
                            productId: item.productId,
                            quantity: item.quantity
                        })
                    }
                    else {
                        await updateDoc(cartSnapshot.docs[0].ref, { quantity: item.quantity })
                    }
                })
            }
        }
        setTimeout(() => {
            resolve()
        }, 1000);
    })
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