import { initializeApp } from "https://www.gstatic.com/firebasejs/10.3.1/firebase-app.js";
import {
    getFirestore,
    collection,
    addDoc,
    query,
    where,
    getDocs,
    updateDoc,
    doc,
    getDoc,
    setDoc,
    deleteDoc
} from "https://www.gstatic.com/firebasejs/10.3.1/firebase-firestore.js";
import {
    getAuth,
    signInWithEmailAndPassword,
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/10.3.1/firebase-auth.js"
import {
    getStorage,
    ref,
    uploadBytes,
    getDownloadURL,
    deleteObject
} from "https://www.gstatic.com/firebasejs/10.3.1/firebase-storage.js";

/**
 * Index :
 * event listener
 * role access
 * update product
 * Fetch operaion
 * toast message
 * */


const firebaseConfig = {
    apiKey: "AIzaSyBrIAlkIyp5ALsv5RslbXA1oQVQL3eKhig",
    authDomain: "pharma-ecom-app.firebaseapp.com",
    projectId: "pharma-ecom-app",
    storageBucket: "pharma-ecom-app.appspot.com",
    messagingSenderId: "798776981223",
    appId: "1:798776981223:web:16f92da76fe7c2f1cf9442"
};
//global
var userData = null;
const app = initializeApp(firebaseConfig);
const firestore = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);
function isUserLoggedIn() {
    return !!auth.currentUser;
}

/**
 * Global Variables
 */
const confirmLogoutBtn = document.getElementById("confirmLogoutBtn");
let loggedIn = false

const urlParam = new URLSearchParams(window.location.search)
const productId = urlParam.get('data')
// console.log(productId)

if (!productId) {
    window.location.href = 'products.html'
}
else {
    getAndEmbedProductData(productId)
}
//******************************event listener********************************************
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
//****************************************************************************************
/************************************Event listener**************************** */
document.querySelector('.add-to-cart').addEventListener('click', addToCart)


onAuthStateChanged(auth, (user) => {
    if (user) {
        loggedIn = true
        onLoggedIn();
        document.querySelectorAll('.logout-btn').forEach((btn) => {
            btn.classList.remove('d-none');
        });
        // User is authenticated
        const docRef = doc(firestore, "users", user.uid);
        const docSnap = getDoc(docRef);
        docSnap.then((docSnapshot) => {
            // console.log(docSnapshot)
            if (docSnapshot.exists()) {
                const userData = docSnapshot.data();
                // console.log(userData)
                roleAccess(userData.role);
                // populateShownDetails();
                updateCart();
                updateProfileName(userData.role, userData.firstName);
                updateProfilePicture(userData.role, userData.profilePicture);
                // fetchNavCategories();
                // getUserRealTime()
            }
        });
    } else {
        // window.location.href = "login.html";
        loggedIn = false;
        document.querySelectorAll('.logout-btn').forEach((btn) => {
            btn.classList.add('d-none');
        });
        updateCart();
        // fetchNavCategories();
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

/**
 * 
 * @param {*} productId 
 * 
 * product class attributes :
 * product-section
 * product-loader
 * product-name
 * product-price
 * product-first-image
 */
async function getAndEmbedProductData(productId) {
    const productSnapshot = await getDocs(query(collection(firestore, 'products'), where('productId', '==', productId)))
    // console.log(productSnapshot.docs)
    const productData = productSnapshot.docs[0].data()
    // console.log(productData);
    const productLoader = document.querySelector('.product-loader')
    const productName = document.querySelector('.product-name')
    // const productStock = document.querySelector('.product-stock')
    const productPrice = document.querySelector('.product-price')
    // const productOldPrice = document.querySelector('.product-old-price')
    const productFirstImageList = document.querySelector('.product-first-image')
    const productSize = document.querySelector('.product-size')
    const productManufacturer = document.querySelector('.product-manufacturer')
    const productIdNo = document.querySelector('.product-id')
    // const productCategory = document.querySelector('.product-category')
    const productSection = document.querySelector('.product-section')
    const productColorContainer = document.querySelector('#color-pro-container');
    // const selectedColorsContainer = document.querySelector('.selected-color')
    let productDesc = document.querySelector('.gi-single-desc')
    let productDetails = document.querySelector('.gi-single-pro-tab-details')
    let productSpecifications = document.querySelector('.gi-single-pro-tab-spec');
    productColorContainer.innerHTML = '';

    // console.log(productFirstImageList[0],productFirstImageList[1])
    productFirstImageList.src = productData.imageUrl
    // productFirstImageList[1].src = productData.imageUrl
    // productFirstImage.src = productData.imageUrl
    productName.textContent = productData.name
    productPrice.textContent = productData.price
    // productOldPrice.textContent = 40 + +productData.price

    //product Description
    let productDescDiv = document.createElement('div');
    let productDescriptionPoints = '';
    if (productData.ProductDescription) {
        productDescriptionPoints = formatDescription(productData.ProductDescription);
    }
    productDescDiv.innerHTML = `${productDescriptionPoints}`
    productDesc.appendChild(productDescDiv);

    productSize.textContent = productData.size + ' ';
    productManufacturer.textContent = productData.manufacturerName;
    // productIdNo.textContent = productData.productId;
    // productCategory.textContent = productData.categoryName;

    //Product Details
    let productDetailsDiv = document.createElement('div');
    let productDetailsPoints = ''
    if (productData.productDetails) {
        productDetailsPoints = formatDetails(productData.productDetails);
    }
    productDetailsDiv.innerHTML = `${productDetailsPoints}`;
    productDetails.appendChild(productDetailsDiv);

    //Product Specifications
    let productSpecificationsDiv = document.createElement('div');
    let productSpecificationsPoints = ''
    if (productData.productSpecifications) {
        productSpecificationsPoints = formatSpecifications(productData.productSpecifications);
    }
    productSpecificationsDiv.innerHTML = `${productSpecificationsPoints}`;
    productSpecifications.appendChild(productSpecificationsDiv);
    // productStock.textContent = productData.quantity ? 'IN STOCK' : 'OUT STOCK'

    setTimeout(() => {
        productLoader.classList.add('d-none')
        productSection.style.height = 'auto'
        productSection.style.opacity = '1'
        setTimeout(() => {
            $('.single-product-cover').slick({
                slidesToShow: 1,
                slidesToScroll: 1,
                arrows: false,
                fade: false,
                asNavFor: '.single-nav-thumb',
            });

            $('.single-nav-thumb').slick({
                slidesToShow: 4,
                slidesToScroll: 1,
                asNavFor: '.single-product-cover',
                dots: false,
                arrows: true,
                focusOnSelect: true
            });
            // $('.zoom-image-hover').zoom()
        }, 10);
    }, 1000);
}

// Function to format product description points
function formatDescription(description) {
    if (!description) {
        return '';
    }

    const pointsArray = description.split('•').map((point) => point.trim());
    return pointsArray.map((point) => `<li>${point}</li>`).join('');
}

// Function to format product detail points
function formatDetails(details) {
    if (!details) {
        return '';
    }

    const detailsArray = details.split('•').map((detail) => detail.trim());
    return detailsArray.map((detail) => `<li>${detail}</li>`).join('');
}

// Function to format product detail points
function formatSpecifications(specifications) {
    if (!specifications) {
        return '';
    }

    const specificationsArray = specifications.split('•').map((specification) => specification.trim());
    return specificationsArray.map((specification) => `<li>${specification}</li>`).join('');
}

/**
 * Add to Cart
 * @author dev
 */
async function addToCart() {
    const addToCartButton = document.querySelector('.add-to-cart')
    addToCartButton.disabled = true
    addToCartButton.textContent = 'ADDING ...'
    // console.log(document.querySelector('.user-quantity').value)

    if (loggedIn) {
        const cartSnapshot = await getDocs(
            query(
                collection(firestore, 'users', auth.currentUser.uid, 'cart'),
                where('productId', '==', productId)
            )
        )
        // console.log(cartSnapshot.docs[0]);
        if (cartSnapshot.empty) {
            // console.log(document.querySelector('.user-quantity').value)
            await setDoc(doc(collection(firestore, 'users', auth.currentUser.uid, 'cart'), productId), {
                productId: productId,
                quantity: +document.querySelector('.user-quantity').value
                // selectedColor: selectedColor.textContent,
            })
        }
        else {
            await updateDoc(cartSnapshot.docs[0].ref, { quantity: +document.querySelector('.user-quantity').value })
        }
    }
    else {
        const cart = JSON.parse(sessionStorage.getItem('cart'))
        // console.log("form else")
        if (cart) {
            // console.log(productId)
            const result = cart.findIndex(doc => doc.productId === productId)
            // console.log(result)
            if (result >= 0) {
                cart[result].quantity = +document.querySelector('.user-quantity').value;
                sessionStorage.setItem('cart', JSON.stringify(cart))
            }
            else {
                cart.push({
                    productId: productId,
                    quantity: +document.querySelector('.user-quantity').value,
                })
                sessionStorage.setItem('cart', JSON.stringify(cart))
            }
        }
        else {
            sessionStorage.setItem('cart', JSON.stringify([{
                productId: productId,
                quantity: +document.querySelector('.user-quantity').value,
            }]))
        }

    }
    addToCartButton.disabled = false
    addToCartButton.textContent = 'ADD TO CART'
    displayMessage('Added To Cart !', 'success')
    await updateCart()
}

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

/**
 * 
 * @returns promise<cart<List>>
 * 
 */
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
//                 aria-controls="v-pills-home" aria-selected="true"><a class="text-decoration-none text-black" href="products.html?categoryId=${doc.data().categoryId}">${doc.data().name}</a>
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