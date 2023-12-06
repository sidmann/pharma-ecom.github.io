//auth
import { auth, onAuthStateChanged } from "./assets/repository/initialize.js";

//firesotre
import {
    firestore,
    getDoc,
    getDocs,
    collection,
    query,
    doc,
} from "./assets/repository/initialize.js";

//repo userCart
import { getCartCount } from "./assets/repository/userCart/userCart.js";

//repo orders
import { getOrderDetails } from "./assets/repository/orders/orders.js";

//repo product
import { getProductDetails} from "./assets/repository/products/products.js";

import { getAddress } from "./assets/repository/address/address.js";

//Global variables
let loggedIn = false
let userData = null
let orderDetails = null

//check order param in url
const orderId = new URLSearchParams(window.location.search).get('orderId')
if (!orderId) window.location.href = 'index.html'

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

        let count = 0
        if (loggedIn){
            count = await getCartCount(loggedIn, auth.currentUser.uid)
        }
        else count = await getCartCount(loggedIn)

        if (count) {
            document.querySelectorAll('.cart').forEach(ele => ele.textContent = count)
        }
        else {
            document.querySelectorAll('.cart').forEach(ele => ele.textContent = 0)
        }
        console.log("resolve")
        resolve()
    })
}

/**
 * Necessary fucntions to call after pageload
 */
async function postPageLoadFunctions() {
    await updateCart();
    await fetchNavCategories();
    await orderDetialsFunctions()
}

async function orderDetialsFunctions(){
    await getOrderedDetails()
    embedOrderId()
    embedBill()
    embedOrderStatus()
    embedOrderDateAndTime()
    embedMop()
    await embedOrderedProducts()
    embedAddress()
}

onAuthStateChanged(auth, async (user) => {
    if (user) {
        loggedIn = true
        onLoggedIn()

        const docRef = doc(firestore, "users", user.uid);
        const docSnap = getDoc(docRef);
        docSnap.then(async (docSnapshot) => {
            if (docSnapshot.exists()) {
                console.log("from onAuthStateChanged")
                loggedIn = true
                userData = docSnapshot.data();
                roleAccess(userData.role);
                updateProfileName(userData.role, userData.firstName);
                updateProfilePicture(userData.role, userData.profilePicture)
            }
        });
    }
    else {
        loggedIn = false
        onLoggedOut()
    }

    await postPageLoadFunctions()
})

/**
 * @description to execut upon logging in
 * 
 * @author dev
 */
function onLoggedIn() {
    var navItemList = document.querySelectorAll(".loggedIn");
    navItemList.forEach((navItem) => {
        navItem.style.display = "block";
    });

    navItemList = document.querySelectorAll(".loggedOut");
    navItemList.forEach((navItem) => {
        navItem.style.display = "none";
    });

    document.querySelector('#logout-btn').style.display = 'block';
}

/**
 * @description to execute upon logging out
 * 
 * @author dev
 */
function onLoggedOut() {
    var navItemList = document.querySelectorAll(".loggedOut");
    navItemList.forEach((navItem) => {
        navItem.style.display = "block";
    });

    navItemList = document.querySelectorAll(".loggedIn");
    navItemList.forEach((navItem) => {
        navItem.style.display = "none";
    });

    document.querySelector('#logout-btn').style.display = 'none';
}

/**
 * 
 * @param {*} role 
 * 
 * @author dev
 */
function roleAccess(role) {
    // console.log('inside role')
    const roleMap = new Map([
        ["ADMIN", "adminAppbar"],
        ["CUSTOMER", "customerAppbar"],
        ["AGENT", "agentAppbar"],
    ]);
    const appbarList = document.querySelectorAll(`#${roleMap.get(role)}`);
    let vdsf = ""
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
        case 'AGENT':
            profileNameElement = document.getElementById('agentAppbar').querySelector('.profile-name');
            break;
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
        case 'AGENT':
            profilePictureElement = document.getElementById('agentAppbar').querySelector('#profile-picture');
            break;
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



/**
 * 
 * @returns promise
 */
async function fetchNavCategories() {
    const categoryList = document.querySelector('.nav-category')
    const mobileCategoryList = document.querySelector('.mobile-nav-category')

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
                aria-controls="v-pills-home" aria-selected="true"><a class="text-decoration-none text-black" href="products.html?categoryId=${doc.data().categoryId}">${doc.data().name}</a>
            </button>
        </div>
        `
        categoryList.appendChild(span)

        const list = document.createElement('li')
        list.innerHTML = `
        <a href="javascript:void(0)">${doc.data().name}</a>
        `
        mobileCategoryList.appendChild(list)
    })
}

/**
 * 
 * @param {*} message 
 * 
 * Message to be displayed
 * 
 * @param {*} type 
 * 
 * Message type - success, danger
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

function embedOrderId(){
    const orderIdEle = document.querySelector('.order-id')
    if (orderIdEle){
        orderIdEle.textContent = orderId
    }
}


function embedOrderDateAndTime(){
    const orderDate = document.querySelector('.order-date')
    const orderTime = document.querySelector('.order-time')

    orderDate.textContent = orderDetails.orderDate
    orderDate.classList.add('text-muted')
    orderTime.textContent = orderDetails.orderTime
    orderTime.classList.add('text-muted')
}

async function getOrderedDetails(){
    orderDetails = await getOrderDetails(orderId, auth.currentUser.uid)
    console.log(orderDetails)
}

async function embedOrderStatus(){
    const orderStatus = document.querySelector('.order-status')
    orderStatus.textContent = orderDetails.status
}


/**
 * @description
 * Embed order bill in html
 * 
 * @author dev
 */
async function embedBill(){
    const orderTotalList = document.querySelectorAll('.order-total')
    const orderDelivery = document.querySelector('.order-delivery')
    const orderSubtotal = document.querySelector('.order-subtotal')

    orderTotalList.forEach(orderTotal => {
        orderTotal.textContent = orderDetails.bill.total
    })
    orderDelivery.textContent = orderDetails.bill.deliveryFee
    orderSubtotal.textContent = orderDetails.bill.subTotal
}

async function embedMop(){
    const orderMop = document.querySelector('.order-mop')
    const orderMopId = document.querySelector('.order-payment-id')

    orderMop.textContent = orderDetails.mop[0]
    orderMopId.textContent = orderDetails.mop[1]['razorpay_payment_id']
}

/**
 * @author dev
 */
async function embedOrderedProducts(){
    const orderedProductsContainer = document.querySelector('.ordered-products')
    orderedProductsContainer.innerHTML = ``

    const orderedProducts = orderDetails.productsDetails

    const allPromises = orderedProducts.map(async (item) => {
        const productDetails = await getProductDetails(item.productId)
        const tr = document.createElement('tr')
        tr.innerHTML = `
                          <td>
                            <div class="d-flex mb-2">
                              <div class="flex-shrink-0">
                                <img src="${productDetails.imageUrl ? productDetails.imageUrl : './assets/img/logo/logo.ico'}" alt="" width="35" class="img-fluid">
                              </div>
                              <div class="flex-lg-grow-1 ms-3">
                                <h6 class="small mb-0"><a href="product-details.js?productId=${item.productId}" class="text-reset">${productDetails.name}</a></h6>
                                <span class="small">Color: Black</span>
                              </div>
                            </div>
                          </td>
                          <td>${item.quantity}</td>
                          <td class="text-end"><span>&#8377</span><span>${item.price}</span></td>
        `
        orderedProductsContainer.appendChild(tr)
    })
    await Promise.all(allPromises)
}

async function embedAddress(){
    console.log(orderDetails.addressRef.id)
    const addressData = await getAddress(orderDetails.addressRef)
    // const addressData = 
    // embedBillingAddress()
    // embedShippingAddress()
}
function embedBillingAddress(addressData){
    const billingPhone = document.querySelector('.billing-phone')
    const billingPincode = document.querySelector('.billing-pincode')
    const billingState = document.querySelector('.billing-state')
    const billingCity = document.querySelector('.billing-city')
    const billingRoadAreaColony = document.querySelector('.billing-road-area-colony')
    const billingHouseBuilding = document.querySelector('.billing-house-building')
    const billingFullname = document.querySelector('. billing-fullname')
   
}
function embedShippingAddress(addressData){
    const billingPhone = document.querySelector('.billing-phone')
    const billingPincode = document.querySelector('.billing-pincode')
    const billingState = document.querySelector('.billing-state')
    const billingCity = document.querySelector('.billing-city')
    const billingRoadAreaColony = document.querySelector('.billing-road-area-colony')
    const billingHouseBuilding = document.querySelector('.billing-house-building')
    const billingFullname = document.querySelector('. billing-fullname')
   
}
