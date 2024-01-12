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

// storage
import {
    storage,
    ref,
    uploadBytes,
    getDownloadURL
} from "./assets/repository/initialize.js"

import { 
    updateProfileName,
    updateProfilePicture,
    displayMessage,
    fetchNavCategories,
    roleAccess,
    onLoggedIn,
    onLoggedOut
    } from "./assets/repository/common/common.js";
//------------------------------------------------------------------//

//------------------------------global variable--------------------//
var userData = null;
const confirmLogoutBtn = document.getElementById("confirmLogoutBtn");
var loggedIn = false;
//----------------------------------------------------------------//

// Function to check if the user is logged in
function isUserLoggedIn() {
    return !!auth.currentUser;
}


/**
 * logout Eventlistenser
 * @return mydev
 */
confirmLogoutBtn.addEventListener("click", () => {
    // console.log("1")
    signOut(auth)
        .then(() => {
            window.location.href = "login.html";
        })
        .catch((error) => {
            console.error("Error during logout:", error);
        });
});

/**
 * 
 * @returns promise
 * requires: getCart() 
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

/**
 * getCart() function
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

/**
 * Getting user snapshot or user details
 * @param {*} uid 
 * @returns mydev 
 */
function getUserSnapshot(uid) {
    const userRef = doc(firestore, 'users', uid)
    // console.log('3')
    return new Promise((resolve, reject) => {
        resolve(getDoc(userRef))
    })
}

/**
 * onAuthStateChanged firebase service
 * @returns mydev 
 * @requires 
 * roleAccess(role)
 * 
 */  
  onAuthStateChanged(auth, (user) => {
    if (user) {
        // console.log("if")
        document.querySelectorAll('.logout-btn').forEach((btn) => {
            btn.classList.remove('d-none');
        });
        loggedIn = true
        onLoggedIn();
        const docRef = doc(firestore, "users", user.uid);
        const docSnap = getDoc(docRef);
        docSnap.then((docSnapshot) => {
            if (docSnapshot.exists()) {
                userData = docSnapshot.data();
                // console.log(userData.role);
                roleAccess(userData.role);
                updateProfileName(userData.role,userData.firstName)
                updateCart();
                // fetchNavCategories();
                updateProfilePicture(userData.role,userData.profilePicture)
            }
        });
    } else {
        document.querySelectorAll('.logout-btn').forEach((btn) => {
            btn.classList.add('d-none');
        });
        // console.log("else");
        updateCart();
        // fetchNavCategories();
        // window.location.href = "login.html";
        onLoggedOut();
    }
});

/**
 * Role access function
 * @param {*} role 
 */
// function roleAccess(role) {
//     const roleMap = new Map([
//         ["ADMIN", "adminAppbar"],
//         ["CUSTOMER", "customerAppbar"],
//         // ["AGENT", "agentAppbar"],
//     ]);
//     const appbarList = document.querySelectorAll(`#${roleMap.get(role)}`);
//     appbarList.forEach((appbar) => {
//         appbar.classList.remove("d-none");
//     })
// }

/**
 * post login
 * @returns mydev
 */
// function onLoggedIn() {
//     console.log("loggedIn")
//     var navItemList = document.querySelectorAll(".loggedIn");
//     navItemList.forEach((navItem) => {
//         navItem.style.display = "block";
//     });

//     navItemList = document.querySelectorAll(".loggedOut");
//     navItemList.forEach((navItem) => {
//         navItem.style.display = "none";
//     });
// }

/**
 * pre login
 * @returns mydev
 */
// function onLoggedOut() {
//     console.log("loggedOut")
//     var navItemList = document.querySelectorAll(".loggedOut");
//     navItemList.forEach((navItem) => {
//         navItem.style.display = "block";
//     });

//     navItemList = document.querySelectorAll(".loggedIn");
//     navItemList.forEach((navItem) => {
//         navItem.style.display = "none";
//     });
// }


/**
 * 
 * @param {*} message 
 * @param {*} type 
 * 
 * Toast message
 */
// function displayMessage(message, type) {
//     const toastContainer = document.querySelector(".toast-container");

//     // Create a clone of the toast template
//     const toast = document.querySelector(".toast").cloneNode(true);

//     console.log(toast)
//     // Set the success message
//     toast.querySelector(".compare-note").innerHTML = message;

//     //set text type  success/danger
//     if (type === "danger") {
//         toast.classList.remove("bg-success");
//         toast.classList.add("bg-danger");
//     } else {
//         toast.classList.add("bg-success");
//         toast.classList.remove("bg-danger");
//     }

//     // Append the toast to the container
//     toastContainer.appendChild(toast);

//     // Initialize the Bootstrap toast and show it
//     const bsToast = new bootstrap.Toast(toast);
//     bsToast.show();

//     // Remove the toast after it's closed
//     toast.addEventListener("hidden.bs.toast", function () {
//         toast.remove();
//     });
// }

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