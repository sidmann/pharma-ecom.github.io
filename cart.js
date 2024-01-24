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
var userData = null;
const app = initializeApp(firebaseConfig);
const firestore = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);
//--------------------------------------gobal scripts---------------------------
const productsRef = collection(firestore, 'products');
const confirmLogoutBtn = document.getElementById("confirmLogoutBtn");
var loggedIn = false
var cartList = []
var checkoutSummaryProcess = false
let productDocs = null
//-------------------------------------------------------------------------

//--------------------------Event listener---------------------------------
//check validity of membership id
// document.querySelector('#membership-id-input').addEventListener('keyup', validateMembershipId)

// document.querySelector('#membership-id-input').addEventListener('change', validateMembershipId)

// document.querySelector('#checkout-proceed').addEventListener('click', getMembershipId)

// document.querySelector('#skip-continue-btn').addEventListener('click', goToCheckout)

// document.querySelector('.proceed-btn').addEventListener('click', goToCheckout)


//-------------------------------cart dependency-----------------------------
//get user snapshot cart(dependency)
async function getUserSnapshot(uid) {
    return new Promise((resolve, reject) => {
        const userRef = doc(firestore, 'users', uid)
        // console.log('getUserSnapshot')
        resolve(getDoc(userRef))
    })
}

/**
 * Necessary functions to call after pageload
 */
async function postPageLoadFunctions() {
    await updateCart();
    // await fetchNavCategories();
    await fetchAndDisplayProducts();
}

/**
 * Necessary event listeners to call after pageload
 * 
 * @author dev
 */
function postPageLoadEventListener() {
    document.querySelector('.checkout-btn').addEventListener('click', checkout)
}
/**
 * 
 * @returns promise<cart<List>>
 * 
 * @author dev
 */
async function getCart() {
    return new Promise(async (resolve) => {
        if (loggedIn) {
            // console.log("if")
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
            // console.log("else")
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
 * 
 * @author dev
 */
function updateCart() {
    return new Promise(async (resolve) => {
        // console.log("from update cart")
        // const shownCart = document.querySelector('#shown-cart')
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

// Use onAuthStateChanged to control access to admin dashboard
onAuthStateChanged(auth, async (user) => {
    if (user) {
        // User is logged in
        const docRef = doc(firestore, "users", user.uid);
        const docSnap = getDoc(docRef);
        var userData = null;
        loggedIn = true
        document.querySelectorAll('.logout-btn').forEach((btn) => {
            btn.classList.remove('d-none');
        });
        onLoggedIn();
        docSnap.then(async (docSnapshot) => {
            // console.log(docSnapshot)
            if (docSnapshot.exists()) {
                //set the navbar according to role
                userData = docSnapshot.data();

                roleAccess(userData.role)
                updateProfileName(userData.role, userData.firstName);
                updateProfilePicture(userData.role, userData.profilePicture);
            }
        });
    } else {
        // User is not logged in
        loggedIn = false
        // console.log("form else")
        document.querySelectorAll('.logout-btn').forEach((btn) => {
            btn.classList.add('d-none');
        });
    }
    await postPageLoadFunctions()
    postPageLoadEventListener()
});

//-------------------------------------loading and role access-----------------------------------

function updateProfileName(role, fullName) {
    // Based on the role, select the appropriate element
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

// Add an event listener to the confirmation logout button
confirmLogoutBtn.addEventListener("click", () => {
    signOut(auth)
        .then(() => {
            // Redirect to the login page or perform any other actions
            console.log("User logged out successfully");
            window.location.href = "login.html";
        })
        .catch((error) => {
            console.error("Error during logout:", error);
        });
});

// Function to fetch and display products
async function fetchAndDisplayProducts() {
    if (loggedIn) {
        //get the user id for storage
        const userDoc = await getUserSnapshot(auth.currentUser.uid)
        const cartSnapshot = await getDocs(collection(userDoc.ref, 'cart'))

        if (cartSnapshot.empty) {
            displayMessage('Cart is Empty!', 'danger')
            stopProductLoader()
            showEmptyCart()
            return
        }
        //get the cart from user doc
        cartList = []
        cartSnapshot.forEach(doc => {
            // console.log(doc.data());
            cartList.push(doc.data())
        })
    }
    else {
        if (sessionStorage.getItem('cart')) {
            cartList = JSON.parse(sessionStorage.getItem('cart'))
        }
        else {
            stopProductLoader()
            showEmptyCart()
            return
        }
    }

    //product
    var cartItems = []
    cartList.forEach(item => {
        cartItems.push(item.productId)
    })
    // console.log(cartList)
    const productsRef = collection(firestore, 'products');
    const q = query(productsRef, where('productId', 'in', cartItems))
    // console.log(cartItems)

    const unsubscribe = getDocs(q)
        .then(async (cartSnapshot) => {
            // console.log(cartSnapshot.docs)
            if (cartItems.length > cartSnapshot.size) {
                displayMessage('Some Products seems to have been removed. !', 'danger')
                if (cartSnapshot.size == 0) {
                    showEmptyCart()
                    return
                }
            }
            productDocs = cartSnapshot.docs
            cartSnapshot.forEach(async (doc) => {
                const productsContainer = document.querySelector('.cart-products');
                const productData = doc.data();
                // console.log(productData);
                const productUrl = productData.imageUrl;
                // console.log(productUrl);

                var result = cartList.findIndex(item => item.productId === doc.data().productId)
                // console.log(result);
                var userQuantity = +cartList[result].quantity
                // console.log(doc.data().productId, userQuantity)

                // Create a product card
                const tableRow = document.createElement('tr')
                tableRow.className = `product-${productData.productId}`
                tableRow.innerHTML = `
                                                    <td data-label="Product" class="gi-cart-pro-name">
                                                        <a href="product-left-sidebar.html">
                                                            <img class="gi-cart-pro-img mr-4"
                                                                src=${productUrl} alt="">${productData.name}
                                                        </a>
                                                    </td>
                                                    <td data-label="Price" class="gi-cart-pro-price">
                                                        <span class="amount">&#8377;${productData.price}</span>
                                                    </td>
                                                    <td data-label="Quantity" class="gi-cart-pro-qty"
                                                        style="text-align: center;">
                                                        <div class="cart-qty-plus-minus quantity">
                                                            <input class="cart-plus-minus user-quantity" type="text"
                                                                name="cartqtybutton " value="${userQuantity}">
                                                                <div class="ms_cart_qtybtn">
                                                                <div class="inc ms_qtybtn">+</div>
                                                                <div class="dec ms_qtybtn">-</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td data-label="Total" class="gi-cart-pro-subtotal">&#8377;<span class="product-total">${productData.price * userQuantity}</span></td>
                                                    <td data-label="Remove" class="gi-cart-pro-remove">
                                                        <a href="#" class="remove-product-parent mx-md-5"><i class="gicon gi-trash-o remove-product" data-id="${productData.productId}"></i></a>
                                                    </td>
                        `

                // Append the product card to the container
                productsContainer.appendChild(tableRow);

                //add remove function to delete icon
                tableRow.querySelector('.remove-product').addEventListener('click', removeProduct.bind(this, productData.productId))
                // bind() will always getting the copy the function on which funcction is calling 
                tableRow.querySelector('.inc').addEventListener('click', increaseQuantity.bind(this, productData))
                tableRow.querySelector('.dec').addEventListener('click', decreaseQuantity.bind(this, productData))

                await checkoutSummary()
                // console.log("2.1")
            });

            stopProductLoader()
            //call the event listener
            //add realtime updates
            // applyRealTime()
        })
        .catch((error) => {
            console.error('Error fetching products:', error);
        });
}


/**
 * 
 * @param {*} message 
 * @param {*} type 
 * 
 * Toast Message
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
        toast.querySelector(".compare-note").classList.remove("text-success");
        toast.querySelector(".compare-note").classList.add("text-danger");
    } else {
        toast.querySelector(".compare-note").classList.add("text-success");
        toast.querySelector(".compare-note").classList.remove("text-danger");
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

//----------------------------------checkout summary------------------------------
function waitForCheckoutSummary() {
    return new Promise(resolve => {
        const checkProcess = () => {
            if (!checkoutSummaryProcess) {
                resolve()
            }
            else {
                setTimeout(checkProcess, 1000);
            }
        }
        checkProcess()
    })
}

/**
 * 
 * @returns promise
 * 
 * @author dev
 */
async function checkoutSummary() {
    return new Promise(async (resolve) => {
        const checkoutSummarySubtotal = document.querySelector('.checkout-summary-subtotal')
        // const checkoutSummarydelivery = document.querySelector('.checkout-summary-delivery')
        const checkoutSummarytotal = document.querySelector('.checkout-summary-total')
        const checkoutSummaryCoupan = document.querySelector('.checkout-summary-coupan')
        // const deliveryFee = getDeliveryFee()
        // const coupan = getCoupanDiscount()

        let subTotal = 0
        cartList.forEach(item => {
            const price = getProductPrice(item.productId)
            if (price) {
                subTotal += price * item.quantity
            }
        })

        if (checkoutSummarySubtotal) checkoutSummarySubtotal.textContent = subTotal
        // if (checkoutSummarydelivery) checkoutSummarydelivery.textContent = deliveryFee
        if (checkoutSummarytotal) checkoutSummarytotal.textContent = subTotal
        // if (checkoutSummaryCoupan) checkoutSummaryCoupan.textContent = coupan
        resolve()
    })

}

// function getDeliveryFee() {
//     return 500;
// }

// function getCoupanDiscount() {
//     return 100;
// }

//convert summary to json
function getJsonBill(element) {
    const itemPrototype = {
        productName: "",
        // productCategory: "",
        productColor: "",
        productColorShade: "",
        productSize: "",
        productPrice: "",
        productQuantity: 0
    }
    const checkoutSummary = {
        items: [],
        billSummary: {
            subTotal: 0,
            // deliveryFee: 0,
            grandTotal: 0
        }
    }

    //convert the items to json
    document.querySelectorAll('.checkout-item').forEach((item) => {
        if (item.style.display === 'block') {
            const checkoutItem = {
                productId: item.getAttribute('product-id'),
                productName: item.querySelector('.product-name').textContent,
                // productCategory: item.querySelector('.product-categoryName').textContent,
                productColor: item.querySelector('.product-color').textContent,
                productColorShade: item.querySelector('.product-colorShadeName').textContent,
                productSize: item.querySelector('.product-size').textContent,
                productPrice: item.querySelector('.product-price').textContent,
                productTotal: item.querySelector('.product-total').textContent,
                productQuantity: item.querySelector('.product-quantity').textContent
            }
            checkoutSummary.items.push(checkoutItem)
        }
    })

    //convert bill summary
    const bill = document.querySelector('.bill')
    checkoutSummary.billSummary = {
        subTotal: bill.querySelector('.bill-subtotal').textContent,
        // deliveryFee: bill.querySelector('.bill-delivery-fee').textContent,
        grandTotal: bill.querySelector('.bill-grand-total').textContent
    }

    // console.log(element.classList.contains('proceed-btn'))
    // console.log(element)
    if (element.classList.contains('proceed-btn')) {
        checkoutSummary.referralId = document.querySelector('#membership-id-input').value
    }
    // console.log(checkoutSummary)

    localStorage.setItem('checkoutSummary', JSON.stringify(checkoutSummary))
}

//creates and returns a list of product ids from user cart data
function getProductIds() {
    var productIds = []
    cartList.forEach(item => productIds.push(item.productId))
    // console.log(productIds)
    return productIds
}

/**
 * Stop the loader for product
 */
function stopProductLoader() {
    // console.log('from stopLoader')
    document.querySelector('.product-loader').classList.add('d-none')
    document.querySelector('.cart-section').classList.remove('d-none')

}

/**
 * Remove a product
 * 
 * @author dev
 */
async function removeProduct(productId, e) {
    // console.log(e)
    const parentNode = e.target.closest('.remove-product-parent')
    parentNode.innerHTML = `
    <div class="spinner-border" role="status" style="scale: 0.7;">
      <span class="visually-hidden">Loading...</span>
    </div>
    `
    // console.log(productId)

    if (loggedIn) {
        // console.log('productId', productId)
        await deleteDoc(doc(firestore, 'users', auth.currentUser.uid, 'cart', productId))
    }
    else {
        const cart = JSON.parse(sessionStorage.getItem('cart'))
        const result = cart.findIndex(product => product.productId === productId)
        if (result >= 0) {
            cart.splice(result, 1)
            if (cart.length){
                sessionStorage.setItem('cart', JSON.stringify(cart))
            }
            else sessionStorage.removeItem('cart')
        }
    }

    document.querySelector(`.product-${productId}`).remove();
    displayMessage('Removed From Cart !', 'success');

    const cart = await getCart();
    if (cart.length == 0) {
        showEmptyCart();
    }
    await updateCart();
}

/**
 * 
 * @returns promise
 * 
 * @author dev
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

/**
 * Show Empty Cart
 * @author dev
 */
function showEmptyCart() {
    document.querySelector('.product-loader').classList.add('d-none')
    document.querySelector('.empty-cart').classList.remove('d-none')
    document.querySelector('.cart-section').classList.add('d-none')
}

/**
 * 
 * @param {*} productId 
 * @returns if product not found : boolean | product max stock if found : number
 * 
 * @author dev
 */
function getProductStock(productId) {
    // console.log('from getProductStock', productDocs.length)
    if (!productDocs.length) {
        return false
    }
    const result = productDocs.findIndex(doc => doc.data().productId === productId)
    // console.log(result)
    if (result >= 0) {
        return +productDocs[result].data().quantity
    }
    return false
}

/**
 * 
 * @param {*} productId 
 * @returns product price if found | false if not
 * 
 * @author dev
 */
function getProductPrice(productId) {
    // console.log('from getProductStock', productDocs.length)
    if (!productDocs.length) {
        return false
    }
    const result = productDocs.findIndex(doc => doc.data().productId === productId)
    // console.log(result)
    if (result >= 0) {
        return +productDocs[result].data().price
    }
    return false
}

async function increaseQuantity(productData, event) {
    const productId = productData.productId
    await preIncreaseDecreaseQuantity()
    let targetButton = event.target
    let userInput = document.querySelector(`.product-${productId} .user-quantity`)

    //disable button
    targetButton.disabled = true

    const productMaxStock = getProductStock(productId)
    // console.log(productMaxStock)
    if (productMaxStock === false) {
        displayMessage('Oops! Something went wrong. please refresh.', 'danger')
    }

    if (userInput.value < productMaxStock) {
        if (loggedIn) {
            const cartDocs = await getDocs(
                query(
                    collection(firestore, 'users', auth.currentUser.uid, 'cart'),
                    where('productId', '==', productId)
                )
            )
            await updateDoc(cartDocs.docs[0].ref, { quantity: ++userInput.value })
        }
        else {
            const cart = JSON.parse(sessionStorage.getItem('cart'))
            const result = cart.findIndex(item => item.productId === productId);
            if (result >= 0) {
                cart[result].quantity += 1
            }
            sessionStorage.setItem('cart', JSON.stringify(cart))
            userInput.value = ++userInput.value
        }
    }
    else {
        displayMessage('you have reached max stock. !', 'danger')
    }
    await postIncreaseDecreaseQuantity(productData)
}

/**
 * 
 * @param {*} productId 
 * @param {*} event 
 * 
 * @author dev
 */
async function decreaseQuantity(productData, event) {
    const productId = productData.productId
    // console.log('from decreaseQuantity')
    // console.log(1)
    let targetButton = event.target
    let userInput = document.querySelector(`.product-${productId} .user-quantity`)

    //disable button
    targetButton.disabled = true

    // console.log(2)
    if (userInput.value >= 2) {
        await preIncreaseDecreaseQuantity()
        if (loggedIn) {
            // console.log(3)
            const cartDocs = await getDocs(
                query(
                    collection(firestore, 'users', auth.currentUser.uid, 'cart'),
                    where('productId', '==', productId)
                )
            )
            await updateDoc(cartDocs.docs[0].ref, { quantity: --userInput.value })
        }
        else {
            // console.log(5)
            const cart = JSON.parse(sessionStorage.getItem('cart'))
            const result = cart.findIndex(item => item.productId === productId);
            if (result >= 0) {
                cart[result].quantity -= 1
            }
            sessionStorage.setItem('cart', JSON.stringify(cart))
            userInput.value = --userInput.value
        }
        // console.log(6)
    }
    else {

    }
    await postIncreaseDecreaseQuantity(productData)
}

function preIncreaseDecreaseQuantity() {
    return new Promise(async (res) => {
        showOverlay()
        res()
    })
}

/**
 * 
 * @param {string} productData 
 * @returns {Promise}
 */
function postIncreaseDecreaseQuantity(productData) {
    return new Promise(async (res) => {
        cartList = await getCart()
        await checkoutSummary()
        setTimeout(() => {
            hideOverlay()
        }, 1000);
        updateProductCardTotal(productData)
        res()
    })
}

/**
 * @author dev
 */
function showOverlay() {
    const overlay = document.getElementById('overlay')
    overlay.classList.remove('show-loader')
    overlay.classList.remove('hide-loader')
    overlay.classList.remove('d-none')
    overlay.classList.add('show-loader')
}

/**
 * @author dev
 */
function hideOverlay() {
    // console.log('hide overlay', 1)
    const overlay = document.getElementById('overlay')
    overlay.classList.remove('show-loader')
    overlay.classList.remove('hide-loader')
    // console.log('hide overlay', 2)
    overlay.classList.add('hide-loader')
    // console.log('hide overlay', 3)
    setTimeout(() => {
        document.getElementById('overlay').classList.add('d-none')
    }, 500);
    // console.log('hide overlay', 4)
}

function updateProductCardTotal(productData) {
    // console.log(productData)
    const productCard = document.querySelector(`.product-${productData.productId}`)
    const productTotal = productCard.querySelector('.product-total')
    productTotal.textContent = productData.price * +productCard.querySelector('.user-quantity').value
}


function checkout() {
    if (!loggedIn) {
        displayMessage('Please Login to continue. !', 'danger')
        return
    }
    // console.log('from checkout')
    const subtotal = document.querySelector('.checkout-summary-subtotal').textContent
    // const deliveryFee = document.querySelector('.checkout-summary-delivery').textContent
    const total = document.querySelector('.checkout-summary-total').textContent

    const bill = {
        subTotal: subtotal ? subtotal : null,
        // deliveryFee: deliveryFee ? deliveryFee : null,
        total: total ? total : null
    }

    // console.log(bill)

    sessionStorage.setItem('bill', JSON.stringify(bill))
    window.location.href = `checkout.html`

    // console.log('from checkout end')
}
