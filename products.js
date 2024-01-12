import { initializeApp } from "https://www.gstatic.com/firebasejs/10.3.1/firebase-app.js";
import {
    getAuth,
    onAuthStateChanged,
    signOut,
} from "https://www.gstatic.com/firebasejs/10.3.1/firebase-auth.js";
import {
    getFirestore,
    collection,
    query,
    where,
    getDocs,
    doc,
    getDoc,
    setDoc,
    updateDoc,
    onSnapshot,
    addDoc,
    deleteDoc,
    or,
    and,
    limit,
    startAfter,
    endAt,
    orderBy
} from "https://www.gstatic.com/firebasejs/10.3.1/firebase-firestore.js";
import { getStorage, ref, uploadBytes } from "https://www.gstatic.com/firebasejs/10.3.1/firebase-storage.js";
// import { getCategoryCount } from "./assets/repository/products/products.js";

const firebaseConfig = {
    apiKey: "AIzaSyBrIAlkIyp5ALsv5RslbXA1oQVQL3eKhig",
    authDomain: "pharma-ecom-app.firebaseapp.com",
    projectId: "pharma-ecom-app",
    storageBucket: "pharma-ecom-app.appspot.com",
    messagingSenderId: "798776981223",
    appId: "1:798776981223:web:16f92da76fe7c2f1cf9442"
};

//************************global variable*********************************
const app = initializeApp(firebaseConfig);
const firestore = getFirestore(app);
const auth = getAuth(app);
const productsRef = collection(firestore, 'products');
var userData = null;
var loggedIn = false;
var cart = null
var unsubscribeOnSnapshot = null
const confirmLogoutBtn = document.getElementById("confirmLogoutBtn");
let fetchAndDisplayProductsProcess = false
let fetchProcess = false
let querySnapshot = null
let productsDocs = null
let productsPerPage = 12
let currentPage = 0
let pageCounter = 1
let filterChange = true
let pageNotebook = []
let sortOrderChange = true
let priceFilterChange = true
let nextPageFlag = false
let prevPageFlag = false
let doNotFetch = false

// const productFilterFieldMap = {
//     category: 'categoryId',
//     size: 'sizeId',
//     price: 'price',
// }

const productSortFieldMap = {
    name: 'name',
    price: 'price'
}

//****************************event listener*******************************

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

//to be added after loading all products
function addEventListenerToProducts() {
    // console.log("inside add event")
    document.querySelectorAll('.minus').forEach(btn => {
        btn.addEventListener('click', minusQuantity)
    })
    
    document.querySelectorAll('.plus').forEach(btn => {
        btn.addEventListener('click', plusQuantity)
    })
}

function filterEventListeners() {
    // console.log("inside fliterEventListeners")
    // document.getElementById('filter-clear-all').addEventListener('click', clearAllFilters)
    // document.getElementById('filter-search').addEventListener('click', fetch)
    // document.querySelector('.sort-by').addEventListener('change', sortChange)
    document.querySelector('.prev-page').addEventListener('click', prevPage)
    document.querySelector('.next-page').addEventListener('click', nextPage)
    // const slider = document.getElementById('gi-sliderPrice');
    // if (slider) {
    //     const rangeMin = parseInt(slider.dataset.min);
    //     const rangeMax = parseInt(slider.dataset.max);
    //     const step = parseInt(slider.dataset.step);
    //     const filterInputs = document.querySelectorAll('input.filter__input');

    //     noUiSlider.create(slider, {
    //         start: [rangeMin, rangeMax],
    //         connect: true,
    //         step: step,
    //         range: {
    //             'min': rangeMin,
    //             'max': rangeMax
    //         },

    //         // make numbers whole
    //         format: {
    //             to: value => value,
    //             from: value => value
    //         }
    //     });

    //     // bind inputs with noUiSlider 
    //     slider.noUiSlider.on('update', (values, handle) => {
    //         filterInputs[handle].value = values[handle];
    //         // console.log(fetchProcess)
    //         priceFilterChange = true
    //         if (!fetchProcess) fetch()
    //         // console.log('from uislider')
    //     });

    //     filterInputs.forEach((input, indexInput) => {
    //         input.addEventListener('change', () => {
    //             slider.noUiSlider.setHandle(indexInput, input.value);
    //         })
    //     });
    // }
}
//------------------------------------------------------------------------------------


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

//get user snapshot cart(dependency)
function getUserSnapshot(uid) {
    const userRef = doc(firestore, 'users', uid)
    // console.log('3')
    return new Promise((resolve, reject) => {
        resolve(getDoc(userRef))
    })
}

function checkUrlParam(field) {
    const urlParam = new URLSearchParams(window.location.search)
    return urlParam.get(field)
}

// function redirectedCategory() {
//     // console.log("redirect")
//     const categoryId = checkUrlParam('categoryId')
//     if (categoryId) {
//         // console.log(categoryId)
//         const category = document.getElementById(`${ categoryId }`).querySelector('input')
//         // console.log(category)
//         const applyBtn = document.querySelector('#filter-search')
//         category.checked = true
//         doNotFetch = false
//         category.dispatchEvent(new Event('change'))
//         applyBtn.dispatchEvent(new Event('click'))
//     }
//     else {
//         doNotFetch = false
//     }
// }

/**
 * Necessary fucntions to call after pageload
 */
async function postPageLoadFunctions() {
    await updateCart();
    // await fetchNavCategories();
    // await fetchCategories();
    // await embedCategoriesCard();
    // await embedSizesFilter()
    await fetch()
    // redirectedCategory()
    filterEventListeners()
}
//----------------------------------------------------------------

// Use onAuthStateChanged to control access to admin dashboard
onAuthStateChanged(auth, async (user) => {
    const adminAppbar = document.getElementById("adminAppbar");
    const userAppbar = document.getElementById("userAppbar");
    // const agentAppbar = document.getElementById("agentAppbar");
    if (user) {
        // // console.log("if")
        loggedIn = true
        document.querySelectorAll('.logout-btn').forEach((btn) => {
            btn.classList.remove('d-none');
        });       
        const docRef = doc(firestore, "users", user.uid);
        onLoggedIn();
        const docSnap = getDoc(docRef);
        docSnap.then(async (docSnapshot) => {
            if (docSnapshot.exists()) {
                // // console.log("from onAuthStateChanged")
                loggedIn = true
                userData = docSnapshot.data();
                roleAccess(userData.role);
                updateProfileName(userData.role, userData.firstName);
                updateProfilePicture(userData.role, userData.profilePicture);
            }
        });
    } else {
        document.querySelectorAll('.logout-btn').forEach((btn) => {
            btn.classList.add('d-none');
        });
        loggedIn = false;
    }
    await postPageLoadFunctions()
});

//-----------------------------loading and role access---------------------------------

function roleAccess(role) {
    const roleMap = new Map([
        ["ADMIN", "adminAppbar"],
        ["CUSTOMER", "customerAppbar"],
        // ["AGENT", "agentAppbar"],
    ]);
    const appbarList = document.querySelectorAll(`#${roleMap.get(role)}`);
    let vdsf = ""
    appbarList.forEach((appbar) => {
        appbar.classList.remove("d-none");
    })
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
        profilePictureElement.src = defaultProfilePicture;
    }
}

function updateProfileName(role, fullName) {
    // // console.log(fullName)
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


// Function to fetch and display products
async function fetchAndDisplayProducts(customQuery = false, customDocs = null) {
    return new Promise(async (resolve) => {
        fetchAndDisplayProductsProcess = true
        const productsContainer = document.querySelector('.product-box');
        productsContainer.innerHTML = ``
        const productsRef = collection(firestore, 'products');
        var productIds = []
        cart = await getCart()
        // // console.log(cart)
        if (cart.length) {
            cart.forEach(doc => productIds.push(doc.productId))
        }
        var cartStatus = false

        if (customQuery) {
            // console.log('from coustom')
            productsDocs = customDocs
        }
        else {
            querySnapshot = await getDocs(productsRef)
            productsDocs = querySnapshot.docs
        }

        productsDocs.forEach((doc) => {
            const productData = doc.data();
            // // console.log(productData)
            //check if the product is present in cart
            const resultIndex = productIds.findIndex(id => id === productData.productId)
            if (resultIndex >= 0) cartStatus = true
            else cartStatus = false

            let productDescriptionPoints = '';
            if (productData.ProductDescription) {
                productDescriptionPoints = formatDescription(productData.ProductDescription);
            }

            // if (cartStatus) // console.log(productData, productData.quantity >= 1 && cartStatus, cart[resultIndex].quantity)
            // Create a product card
            const productCard = document.createElement('div');
            productCard.classList.add('col-xl-4', 'col-lg-4', 'col-md-6', 'col-sm-6', 'col-xs-6', 'mb-6', 'gi-product-box', 'pro-gl-content')
            productCard.innerHTML = `
                                    <div class="gi-product-content product" data-aos="fade-up" data-id="${productData.productId}">
                                        <div class="gi-product-inner">
                                            <div class="gi-pro-image-outer">
                                                <div class="gi-pro-image">
                                                    <div href="#" class="quickview" data-link-action="quickview" title="Quick view">
                                                        <a href="#" class="image">
                                                            <span class="label veg">
                                                                <span class="dot"></span>
                                                            </span>
                                                            <img class="product-image" src="${productData.imageUrl}"
                                                                alt="Product">
                                                            <img class="hover-image product-image" src="${productData.imageUrl}"
                                                                alt="Product">
                                                        </a>
                                                    </div>
                                                    <div class="gi-pro-actions">
                                                       <!-- <a href="#" class="gi-btn-group quickview"
                                                            data-link-action="quickview" title="Quick view"><i
                                                            class="fi-rr-eye"></i></a>-->
                                                    </div>
                                                </div>
                                            </div>
                                            <div class="gi-pro-content">
                                                <h5 class="gi-pro-title"><a href="#">${productData.name}</a></h5>
                                                <h5 class="gi-pro-title"><a href="#"><i>${productData.tagLine}</i></a></h5>
                                                <div class="gi-info"><strong>Description:</strong><p>${productDescriptionPoints}</p></div>
                                                <div class="gi-pro-rat-price">
                                                    <span class="gi-price d-flex justify-content-between">
                                                        <span class="new-price"><span>&#8377;</span><span
                                                        class="product-price">${productData.price}</span></span>
                                                        <span class="gi-price">
                                                            <div class="gi-quickview-qty">
                                                                <div class="gi-quickview-cart">
                                                                    <a href="javascript:void(0)" title="Add To Cart"><button class="gi-btn-1 add-to-cart"><i class="fi-rr-shopping-basket"></i> Add To
                                                                        Cart</button></a>
                                                                </div>
                                                            </div>
                                                        </span>
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
            `

            // Append the product card to the container
            productsContainer.appendChild(productCard);
            productCard.querySelector('.quickview').addEventListener('click', () => {
                productQuickView(productData)
            })
            productCard.querySelector('.add-to-cart').addEventListener('click', () => {
                redirectToProductDetails(productData.productId)
            })
        });

        //adding event listener to cart
        // addEventListenerToProducts()
        //add realtime updates
        // {
        //     if (!customQuery) {
        //         unsubscribeOnSnapshot = onSnapshot(collection(firestore, 'products'),
        //             (querySnapshot => {
        //                 if (!querySnapshot.empty) {
        //                     // console.log('inside onSnapshot')
        //                     // console.log("dfaf")
        //                     querySnapshot.forEach(doc => {
        //                         const itemCard = document.querySelector(`#product-${doc.data().productId}`)
        //                         itemCard.querySelector('.product-quantity').textContent = doc.data().quantity
        //                         if (doc.data().quantity < 1) {
        //                             itemCard.querySelector('.shown-stock').classList.add('d-none')
        //                             itemCard.querySelector('.quantity').classList.add('d-none')
        //                             itemCard.querySelector('.cart-btn').classList.add('d-none')
        //                             itemCard.querySelector('.out-of-stock').classList.remove('d-none')
        //                         }
        //                         else {
        //                             itemCard.querySelector('.shown-stock').classList.remove('d-none')
        //                             // itemCard.querySelector('.quantity').classList.remove('d-none')
        //                             itemCard.querySelector('.cart-btn').classList.remove('d-none')
        //                             itemCard.querySelector('.out-of-stock').classList.add('d-none')
        //                         }

        //                         if (itemCard.querySelector('.quantity input').value > +itemCard.querySelector('.product-quantity').textContent) {
        //                             itemCard.querySelector('.quantity input').value = 1
        //                         }
        //                     })
        //                 }
        //             })
        //         )
        //     }
        // }
        fetchAndDisplayProductsProcess = false
        resolve()
    })
}

// Function to format product description points
function formatDescription(description) {
    if (!description) {
        return '';
    }

    const pointsArray = description.split('•').map((point) => point.trim());
    return pointsArray.map((point) => `<li>${point}</li>`).join('');
}

/**
 * get cart 
 * @returns 
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
            let cart = []
            cartSnapshot.forEach(doc => {
                cart.push(doc.data())
            })
            // console.log(cart)
            resolve(cart)
        }
        else {
            // console.log("form getCArt1")
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
            // console.log(cart);
            resolve(cart)
        }
    })
}


function fetchManufacturers() {
    return new Promise(async (resolve) => {
        const filterOptionClone = document.querySelector('.filter-option').cloneNode(true)
        const manufacturerContainer = document.querySelector('.manufacturer-filter-card')

        const manufacturerSnapshot = await getDocs(collection(firestore, 'manufacturers'))

        const filterOption = filterOptionClone.cloneNode(true)
        const input = filterOption.querySelector('input')
        input.setAttribute('name', 'manufacturers')
        input.setAttribute('value', 'all')
        input.setAttribute('id', 'all-manufacturer')

        const label = filterOption.querySelector('label')
        label.setAttribute('for', 'all-manufacturer')
        label.innerHTML = 'All'
        filterOption.classList.remove('d-none')
        input.addEventListener('click', fetchFilteredProducts)
        manufacturerContainer.appendChild(filterOption)

        manufacturerSnapshot.forEach(doc => {
            // console.log(doc.data())

            const filterOption = filterOptionClone.cloneNode(true)
            const input = filterOption.querySelector('input')
            input.setAttribute('name', 'manufacturers')
            input.setAttribute('value', `${doc.data().manufacturerId}`)
            input.setAttribute('id', `id-${doc.data().manufacturerId}`)
            input.setAttribute('field', `manufacturerId`)
            const label = filterOption.querySelector('label')
            label.setAttribute('for', `id-${doc.data().manufacturerId}`)
            label.innerHTML = `${doc.data().name}`
            filterOption.classList.remove('d-none')
            input.addEventListener('click', fetchFilteredProducts)
            manufacturerContainer.appendChild(filterOption)
        })
        resolve()
    })
}

// function fetchCategories() {
//     return new Promise(async (resolve) => {
//         const categorySnapshot = await getDocs(collection(firestore, 'categories'))
//         if (categorySnapshot.empty) {
//             // console.log('from empty')
//             resolve()
//             return
//         }

//         const categoryList = document.querySelector('.category-list')
//         categoryList.innerHTML = ``
//         categorySnapshot.forEach(doc => {
//             const list = document.createElement('li')
//             list.id = doc.id
//             list.innerHTML = `
//                                             <div class="gi-sidebar-block-item">
//                                                 <input type="checkbox">
//                                                 <a href="javascript:void(0)">
//                                                     <span class="category" data-id="${doc.data().categoryId}">${doc.data().name}</span>
//                                                 </a>
//                                                 <span class="checked"></span>
//                                             </div>
//             `
//             categoryList.appendChild(list)
//             list.querySelector('input').addEventListener('change', (e) => {
//                 if (e.target.checked) addFilterCard(doc.data().name, 'category', doc.data().categoryId)
//                 else removeFilterCard('category', doc.data().categoryId)
//             })
//         })
//         resolve()
//     })
// }

async function fetchFilteredProducts(event) {
    // console.log('from fetchFilteredProducts')
    const filterCards = document.querySelectorAll('.filter-card')
    // // console.log(filterCards)
    const sortBy = []
    var fieldValues = []
    filterCards.forEach(filterCard => {
        const radios = filterCard.querySelectorAll('div .filter-option input')
        // // console.log(radios)
        var field = null
        fieldValues = []
        radios.forEach(radio => {
            // // console.log(radio)
            // console.log(radio.value, radio.value !== 'all')
            if (radio.value !== 'all') {
                // console.log('from if', radio.checked)
                if (radio.checked) {
                    field = radio.getAttribute('field')
                    fieldValues.push(radio.value)
                }
            }
            else {
                // console.log('from else')
                if (radio.checked) {
                    radios.forEach(radio => {
                        if (radio.value !== 'all') radio.checked = false
                    })
                    const result = sortBy.findIndex(feild => feild === radio.getAttribute('field'))
                    if (result >= 0) {
                        sortBy.splice(result, 1)
                    }
                }
            }
        })

        if (fieldValues.length) {
            sortBy.push({
                field: field,
                by: fieldValues
            })
        }
    })
    // console.log(sortBy)
    // return

    if (sortBy.length) {
        if (sortBy.length == 1) {
            const productSnapshot = await getDocs(
                query(
                    collection(firestore, 'products'),
                    or(
                        where(sortBy[0].field, 'in', sortBy[0].by)
                    )
                )
            )
            unsubscribeOnSnapshot()
            await fetchAndDisplayProducts(true, productSnapshot)
            unsubscribeOnSnapshot = onSnapshot(
                query(
                    collection(firestore, 'products'),
                    or(
                        where(sortBy[0].field, 'in', sortBy[0].by)
                    )
                ),
                (querySnapshot => {
                    if (!querySnapshot.empty) {
                        // console.log('inside onSnapshot')
                        // console.log("dfaf")
                        querySnapshot.forEach(doc => {
                            realTimeActions(doc.data())
                        })
                    }
                })
            )
        }
        if (sortBy.length == 2) {
            const productSnapshot = await getDocs(
                query(
                    collection(firestore, 'products'),
                    where(sortBy[0].field, 'in', sortBy[0].by),
                    where(sortBy[1].field, 'in', sortBy[1].by)
                )
            )
            unsubscribeOnSnapshot()
            await fetchAndDisplayProducts(true, productSnapshot)
            unsubscribeOnSnapshot = onSnapshot(
                query(
                    collection(firestore, 'products'),
                    collection(firestore, 'products'),
                    where(sortBy[0].field, 'in', sortBy[0].by),
                    where(sortBy[1].field, 'in', sortBy[1].by)
                ),
                (querySnapshot => {
                    if (!querySnapshot.empty) {
                        // console.log('inside onSnapshot')
                        // console.log("dfaf")
                        querySnapshot.forEach(doc => {
                            realTimeActions(doc.data())
                        })
                    }
                })
            )
        }
    }
    else {
        fetchAndDisplayProducts()
    }
}

function realTimeActions(data) {
    // console.log('from realTimeActions')
    const itemCard = document.querySelector(`#product-${data.productId}`)
    itemCard.querySelector('.product-quantity').textContent = data.quantity
    if (data.quantity < 1) {
        itemCard.querySelector('.shown-stock').classList.add('d-none')
        itemCard.querySelector('.quantity').classList.add('d-none')
        itemCard.querySelector('.cart-btn').classList.add('d-none')
        itemCard.querySelector('.out-of-stock').classList.remove('d-none')
    }
    else {
        itemCard.querySelector('.shown-stock').classList.remove('d-none')
        // itemCard.querySelector('.quantity').classList.remove('d-none')
        itemCard.querySelector('.cart-btn').classList.remove('d-none')
        itemCard.querySelector('.out-of-stock').classList.add('d-none')
    }

    if (itemCard.querySelector('.quantity input').value > +itemCard.querySelector('.product-quantity').textContent) {
        itemCard.querySelector('.quantity input').value = 1
    }

}

/**
 * 
 * @returns promise
 */
// async function fetchNavCategories() {
//     const categoryList = document.querySelector('.nav-category')
//     const mobileCategoryList = document.querySelector('.mobile-nav-category')

//     mobileCategoryList.innerHTML = `
//     <div class='w-100 d-flex justify-content-center'>
//         <div class="spinner-grow text-secondary" role="status">
//             <span class="visually-hidden">Loading...</span>
//         </div>
//     </div>
//     `
//     const categorySnapshot = await getDocs(collection(firestore, 'categories'))
//     if (categorySnapshot.empty) {
//         // console.log('from empty')
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

/**
 * 
 * @returns categories list = 
 * [{
 *  categoryId,
 *  name
 * }]
 */
// function fetchCategories_1() {
//     // console.log('inside categories')
//     return new Promise(async (res) => {
//         const categories = []
//         const categorySnapshot = await getDocs(collection(firestore, 'categories'))
//         if (categorySnapshot.empty) {
//             res(categories)
//         }
//         else {
//             categorySnapshot.forEach(doc => {
//                 categories.push(doc.data())
//             })
//             res(categories)
//         }
//     })
// }

/**
 * Function to embed Categories card in home page
 */
// async function embedCategoriesCard() {
//     // console.log('inside embed')
//     const categories = await fetchCategories_1()
//     const categoryBox = document.querySelector('.category-box')
//     categoryBox.innerHTML = ''
//     let count = 1
//     let categoryCountPromises = categories.map(category => getCategoryCount(category.categoryId));

//     const categoryCounts = await Promise.all(categoryCountPromises);

//     let allPromises = categories.map((category, index) => {
//         if (count == 6) count = 1
//         const categoryCount = categoryCounts[index];
//         const categoryCard = document.createElement('span')
//         categoryCard.innerHTML = `
//             <div class="gi-cat-box gi-cat-box-${count}">
//                 <div class="gi-cat-icon">
//                     <i class="fa fa-user-md"></i><br>
//                     <div class="gi-cat-detail category-id" data-id="${category.categoryId}">
//                         <a class="text-decoration-none text-black" href="products.html?categoryId=${category.categoryId}">
//                             <h4 class="gi-cat-title">${category.name}</h4>
//                         </a>
//                         <p class="items">${categoryCount} Items</p> 
//                     </div>
//                 </div>
//             </div>
//         `
//         categoryBox.appendChild(categoryCard)
//         count++
//     })

//     // Determine the number of items based on the category count
//     const totalCategoryCount = categoryCounts.reduce((total, count) => total + count, 0);
//     const itemsToShow = Math.min(totalCategoryCount, 6); // Set a maximum of 6 items

//     $('.gi-category-block').owlCarousel({
//         margin: 24,
//         loop: true,
//         dots: false,
//         nav: false,
//         smartSpeed: 10000,
//         autoplay: true,
//         items: itemsToShow,
//         responsiveClass: true,
//         responsive: {
//             0: {
//                 items: 1
//             },
//             420: {
//                 items: 2
//             },
//             768: {
//                 items: 3
//             },
//             992: {
//                 items: 4
//             },
//             1200: {
//                 items: 5
//             },
//             1400: {
//                 items: 6
//             }
//         }
//     });
// }

/**'
 * @returns promise = [{unit, size}]
 */
function fetchSizes() {
    return new Promise(async (res) => {
        const sizes = []
        const sizesSnapshot = await getDocs(collection(firestore, 'sizes'))
        if (sizesSnapshot.empty) {
            res([])
        }
        else {
            sizesSnapshot.forEach(doc => {
                sizes.push(doc.data())
            })
            sizes.sort((a, b) => a.size - b.size)
            res(sizes)
        }
    })
}

async function embedSizesFilter() {
    const sizeContainer = document.querySelector('.size-list')
    const sizes = await fetchSizes()
    // // console.log(sizes)
    if (sizes.length) {
        sizes.forEach(ele => {
            const size = document.createElement('li')
            size.id = ele.sizeId
            size.innerHTML = `
                                    <div class="gi-sidebar-block-item">
                                        <input type="checkbox" value="">
                                        <a href="#"><span class="size">${ele.size}</span></span></a>
                                        <span class="checked"></span>
                                    </div>
            `
            sizeContainer.appendChild(size)
            // // console.log(size.querySelector('input'))
            size.querySelector('input').addEventListener('change', (e) => {
                if (e.target.checked) addFilterCard(ele.size, 'size', ele.sizeId)
                else removeFilterCard('size', ele.sizeId)
            })
        })
    }
}

// function filter() {
//     const categoryList = document.querySelector('.category-list')
//     const sizeList = document.querySelector('.size-list')
// }

/**
 * 
 * @param {*} parameter : value to show to in html
 * @param {*} field : field of document
 * @param {*} value : actual field value
 * @param {*} sizeParameter : temparory parameter to be removed
 */
function addFilterCard(parameter, field, value = null) {
    filterChange = true
    const filterCards = document.querySelector('.filter-cards')

    const span = document.createElement('span')
    span.classList.add('gi-select-btn', 'filter-option')
    span.setAttribute('field', field)
    span.setAttribute('value', value)
    span.innerHTML = `${parameter}<a class="gi-select-cancel filter-card-close" href="javascript:void(0)">×</a>`
    filterCards.appendChild(span)
    span.querySelector('.filter-card-close').addEventListener('click', (e) => {
        // console.log('from remove')
        span.remove(value)
        document.getElementById(`${value}`).querySelector('input').checked = false
        const filterCards = document.querySelector('.filter-cards')
        // console.log(filterCards.childNodes)
        if (filterCards.querySelectorAll('span').length == 2) fetch()
    })
}

function removeFilterCard(field, value) {
    filterChange = true
    // console.log('from remove filter card')
    const filterCards = document.querySelector('.filter-cards')
    filterCards.querySelector(`span[field='${field}'][value='${value}']`).remove()
    if (filterCards.querySelectorAll('span').length == 2) fetch()
    // // console.log(querySnapshot.docs)
}

function clearAllFilters() {
    const filterList = document.querySelectorAll('.filter-cards .filter-option')
    filterList.forEach(span => {
        document.getElementById(span.getAttribute('value')).querySelector('input').checked = false
        span.remove()
    })
    resetPageNotebook()
    // fetch()
}

/**
 * 
 * @returns documents of a snapshot
 * 
 * called to fetch the data based on filter
 * if reads the filter and sorting cards to fetch accordingly
 * along with default fetch
 * 
 * @author dev
 */
async function fetch() {
    return new Promise(async (res) => {
        // console.log('1.1')
        fetchProcess = true
        let priceFilter = false
        let categoryFilter = false
        let sizeFilter = false
        let lastVisibleDoc = null
        let selectedValue = getSortOder()

        if (!filterChange && !sortOrderChange && nextPageFlag) {
            // console.log('from lastVisibleDoc')
            lastVisibleDoc = querySnapshot.docs[querySnapshot.docs.length - 1]
            if (!lastVisibleDoc) {
                // console.log('from not lastVisibleDoc')
                if (pageNotebook.length) {
                    if (pageNotebook[pageNotebook.length - 1].length) {
                        lastVisibleDoc = pageNotebook[pageNotebook.length - 1][pageNotebook[pageNotebook.length - 1].length - 1]
                    }
                }
            }
        }

        // sort categories
        const categories = []

        //sort sizes
        const sizes = []

        //read the filter cards
        const filterCards = document.querySelectorAll('.filter-cards .filter-option')
        filterCards.forEach(span => {
            if (span.getAttribute('field') === 'category') {
                categories.push(span.getAttribute('value'))
                categoryFilter = true
            }
            else if (span.getAttribute('field') == 'size') {
                sizes.push(span.getAttribute('value'))
                sizeFilter = true
            }
        })

        //sort price
        // const slider = document.getElementById('gi-sliderPrice');
        // const price = [slider.dataset.min, slider.dataset.max]
        // const priceFrom = document.querySelector('.price-from')
        // const priceTo = document.querySelector('.price-to')

        // // console.log(priceTo.value)
        // if ((priceFrom.value === slider.dataset.min && priceTo.value === slider.dataset.max) || !priceTo.value || !priceFrom.value) priceFilter = false
        // else {
        //     price.splice(0)
        //     // console.log(price)
        //     price.push(parseInt(priceFrom.value))
        //     price.push(parseInt(priceTo.value))
        //     priceFilter = true
        // }

        // // console.log(categories, sizes, price)
        // // console.log(categoryFilter, sizeFilter, priceFilter)

        let q = null
        if (categoryFilter && !sizeFilter && !priceFilter) {
            if (selectedValue == 1) {
                // console.log('from categories 1', selectedValue, filterChange, sortOrderChange)
                if (!filterChange && !sortOrderChange) {
                    q = query(collection(firestore, 'products'),
                        where(productFilterFieldMap.category, 'in', categories),
                        orderBy(productSortFieldMap.name), limit(productsPerPage),
                        startAfter(lastVisibleDoc)
                    )
                }
                else {
                    q = query(collection(firestore, 'products'),
                        where(productFilterFieldMap.category, 'in', categories),
                        orderBy(productSortFieldMap.name),
                        limit(productsPerPage)
                    )
                }
            }
            else if (selectedValue == 2) {
                // console.log('from categories 2', selectedValue, filterChange, sortOrderChange)
                if (!filterChange && !sortOrderChange) {
                    q = query(collection(firestore, 'products'),
                        where(productFilterFieldMap.category, 'in', categories),
                        orderBy(productSortFieldMap.name, 'desc'),
                        limit(productsPerPage),
                        startAfter(lastVisibleDoc)
                    )
                }
                else {
                    q = query(collection(firestore, 'products'),
                        where(productFilterFieldMap.category, 'in', categories),
                        orderBy(productSortFieldMap.name, 'desc'),
                        limit(productsPerPage)
                    )
                }
            }
            else if (selectedValue == 3) {
                // console.log('from categories 3', selectedValue, filterChange, sortOrderChange)
                if (!filterChange && !sortOrderChange && lastVisibleDoc) {
                    q = query(collection(firestore, 'products'),
                        where(productFilterFieldMap.category, 'in', categories),
                        orderBy(productSortFieldMap.price),
                        limit(productsPerPage),
                        startAfter(lastVisibleDoc)
                    )
                }
                else {
                    q = query(collection(firestore, 'products'),
                        where(productFilterFieldMap.category, 'in', categories),
                        orderBy(productSortFieldMap.price),
                        limit(productsPerPage)
                    )
                }
            }
            else if (selectedValue == 4) {
                // console.log('from categories 4', selectedValue, filterChange, sortOrderChange)
                if (!filterChange && !sortOrderChange && lastVisibleDoc) {
                    q = query(collection(firestore, 'products'),
                        where(productFilterFieldMap.category, 'in', categories),
                        orderBy(productSortFieldMap.price, 'desc'),
                        limit(productsPerPage),
                        startAfter(lastVisibleDoc)
                    )
                }
                else {
                    q = query(collection(firestore, 'products'),
                        where(productFilterFieldMap.category, 'in', categories),
                        orderBy(productSortFieldMap.price, 'desc'),
                        limit(productsPerPage)
                    )
                }
            }
            else {
                // console.log('from categories else', selectedValue, filterChange, sortOrderChange)
                if (!filterChange && !sortOrderChange && lastVisibleDoc) {
                    q = query(collection(firestore, 'products'),
                        where(productFilterFieldMap.category, 'in', categories),
                        limit(productsPerPage),
                        startAfter(lastVisibleDoc)
                    )
                }
                else {
                    q = query(collection(firestore, 'products'),
                        where(productFilterFieldMap.category, 'in', categories),
                        limit(productsPerPage)
                    )
                }
            }

        }

        else if (!categoryFilter && sizeFilter && !priceFilter) {
            if (selectedValue == 1) {
                // console.log('from sizefilter 1', selectedValue, filterChange, sortOrderChange)
                if (!filterChange && !sortOrderChange && lastVisibleDoc) {
                    q = query(collection(firestore, 'products'),
                        where(productFilterFieldMap.size, 'in', sizes),
                        orderBy(productSortFieldMap.name, 'desc'),
                        limit(productsPerPage),
                        startAfter(lastVisibleDoc)
                    )
                }
                else {
                    q = query(collection(firestore, 'products'),
                        where(productFilterFieldMap.size, 'in', sizes),
                        orderBy(productSortFieldMap.name, 'desc'),
                        limit(productsPerPage)
                    )
                }
            }
            else if (selectedValue == 2) {
                // console.log('from sizefilter 2', selectedValue, filterChange, sortOrderChange)
                if (!filterChange && !sortOrderChange && lastVisibleDoc) {
                    q = query(collection(firestore, 'products'),
                        where(productFilterFieldMap.size, 'in', sizes),
                        orderBy(productSortFieldMap.name),
                        limit(productsPerPage),
                        startAfter(lastVisibleDoc)
                    )
                }
                else {
                    q = query(collection(firestore, 'products'),
                        where(productFilterFieldMap.size, 'in', sizes),
                        orderBy(productSortFieldMap.name),
                        limit(productsPerPage)
                    )
                }
            }
            else if (selectedValue == 3) {
                // console.log('from sizefilter 3', selectedValue, filterChange, sortOrderChange)
                if (!filterChange && !sortOrderChange && lastVisibleDoc) {
                    q = query(collection(firestore, 'products'),
                        where(productFilterFieldMap.size, 'in', sizes),
                        orderBy(productSortFieldMap.price),
                        limit(productsPerPage),
                        startAfter(lastVisibleDoc)
                    )
                }
                else {
                    q = query(collection(firestore, 'products'), 
                        where(productFilterFieldMap.size, 'in', sizes),
                        orderBy(productSortFieldMap.price),
                        limit(productsPerPage)
                    )
                }
            }
            else if (selectedValue == 4) {
                // console.log('from sizefilter 4', selectedValue, filterChange, sortOrderChange)
                if (!filterChange && !sortOrderChange && lastVisibleDoc) {
                    q = query(collection(firestore, 'products'),
                        where(productFilterFieldMap.size, 'in', sizes),
                        orderBy(productSortFieldMap.price, 'desc'),
                        limit(productsPerPage),
                        startAfter(lastVisibleDoc)
                    )
                }
                else {
                    q = query(collection(firestore, 'products'),
                        where(productFilterFieldMap.size, 'in', sizes),
                        orderBy(productSortFieldMap.price, 'desc'),
                        limit(productsPerPage)
                    )
                }
            }
            else {
                // console.log('from size else', selectedValue, filterChange, sortOrderChange)
                if (!filterChange && !sortOrderChange && lastVisibleDoc) {
                    q = query(collection(firestore, 'products'),
                        where(productFilterFieldMap.size, 'in', sizes),
                        limit(productsPerPage),
                        startAfter(lastVisibleDoc)
                    )
                }
                else {
                    q = query(collection(firestore, 'products'),
                        where(productFilterFieldMap.size, 'in', sizes),
                        limit(productsPerPage)
                    )
                }
            }
        }
        else if (categoryFilter && sizeFilter && !priceFilter) {
            if (selectedValue == 1) {
                // console.log('from cate size 1', selectedValue, filterChange, sortOrderChange)
                if (!filterChange && !sortOrderChange && lastVisibleDoc) {
                    q = query(collection(firestore, 'products'),
                        and(
                            where(productFilterFieldMap.category, 'in', categories),
                            where(productFilterFieldMap.size, 'in', sizes)
                        ),
                        orderBy(productSortFieldMap.name, 'desc'),
                        limit(productsPerPage),
                        startAfter(lastVisibleDoc)
                    )
                }
                else {
                    q = query(collection(firestore, 'products'),
                        and(
                            where(productFilterFieldMap.category, 'in', categories),
                            where(productFilterFieldMap.size, 'in', sizes)
                        ),
                        orderBy(productSortFieldMap.name, 'desc'),
                        limit(productsPerPage)
                    )
                }
            }
            else if (selectedValue == 2) {
                // console.log('from cate size 2', selectedValue, filterChange, sortOrderChange)
                if (!filterChange && !sortOrderChange && lastVisibleDoc) {
                    q = query(collection(firestore, 'products'),
                        and(
                            where(productFilterFieldMap.category, 'in', categories),
                            where(productFilterFieldMap.size, 'in', sizes)
                        ),
                        orderBy(productSortFieldMap.name),
                        limit(productsPerPage),
                        startAfter(lastVisibleDoc)
                    )
                }
                else {
                    q = query(collection(firestore, 'products'),
                        and(
                            where(productFilterFieldMap.category, 'in', categories),
                            where(productFilterFieldMap.size, 'in', sizes)
                        ),
                        orderBy(productSortFieldMap.name),
                        limit(productsPerPage)
                    )
                }
            }
            else if (selectedValue == 3) {
                // console.log('from cate size 3', selectedValue, filterChange, sortOrderChange)
                if (!filterChange && !sortOrderChange && lastVisibleDoc) {
                    q = query(collection(firestore, 'products'),
                        and(
                            where(productFilterFieldMap.category, 'in', categories),
                            where(productFilterFieldMap.size, 'in', sizes)
                        ),
                        orderBy(productSortFieldMap.price),
                        limit(productsPerPage),
                        startAfter(lastVisibleDoc)
                    )
                }
                else {
                    q = query(collection(firestore, 'products'), and(
                        where(productFilterFieldMap.category, 'in', categories),
                        where(productFilterFieldMap.size, 'in', sizes)
                    ),
                        orderBy(productSortFieldMap.price),
                        limit(productsPerPage)
                    )
                }
            }
            else if (selectedValue == 4) {
                // console.log('from cate size 4', selectedValue, filterChange, sortOrderChange)
                if (!filterChange && !sortOrderChange && lastVisibleDoc) {
                    q = query(collection(firestore, 'products'),
                        and(
                            where(productFilterFieldMap.category, 'in', categories),
                            where(productFilterFieldMap.size, 'in', sizes)
                        ),
                        orderBy(productSortFieldMap.price, 'desc'),
                        limit(productsPerPage),
                        startAfter(lastVisibleDoc)
                    )
                }
                else {
                    q = query(collection(firestore, 'products'),
                        and(
                            where(productFilterFieldMap.category, 'in', categories),
                            where(productFilterFieldMap.size, 'in', sizes)
                        ),
                        orderBy(productSortFieldMap.price, 'desc'),
                        limit(productsPerPage)
                    )
                }
            }
            else {
                // console.log('from categories size else', selectedValue, filterChange, sortOrderChange)
                if (!filterChange && !sortOrderChange && lastVisibleDoc) {
                    q = query(collection(firestore, 'products'),
                        and(
                            where(productFilterFieldMap.category, 'in', categories),
                            where(productFilterFieldMap.size, 'in', sizes)
                        ),
                        limit(productsPerPage),
                        startAfter(lastVisibleDoc)
                    )
                }
                else {
                    q = query(collection(firestore, 'products'),
                        and(
                            where(productFilterFieldMap.category, 'in', categories),
                            where(productFilterFieldMap.size, 'in', sizes)
                        ),
                        limit(productsPerPage)
                    )
                }
            }
        }
        else if (categoryFilter && !sizeFilter && priceFilter) {
            if (selectedValue == 1) {
                // console.log('from cate price 1', selectedValue, filterChange, sortOrderChange)
                if (!filterChange && !sortOrderChange && lastVisibleDoc) {
                    q = query(collection(firestore, 'products'),
                        and(
                            where(productFilterFieldMap.price, '>=', price[0]),
                            where(productFilterFieldMap.price, '<=', price[1]),
                            where(productFilterFieldMap.category, 'in', categories)
                        ),
                        orderBy(productSortFieldMap.name, 'desc'),
                        limit(productsPerPage),
                        startAfter(lastVisibleDoc))
                }
                else {
                    q = query(collection(firestore, 'products'),
                        and(
                            where(productFilterFieldMap.price, '>=', price[0]),
                            where(productFilterFieldMap.price, '<=', price[1]),
                            where(productFilterFieldMap.category, 'in', categories)
                        ),
                        orderBy(productSortFieldMap.name, 'desc'),
                        limit(productsPerPage)
                    )
                }
            }
            else if (selectedValue == 2) {
                // console.log('from cate price 2', selectedValue, filterChange, sortOrderChange)
                if (!filterChange && !sortOrderChange && lastVisibleDoc) {
                    q = query(collection(firestore, 'products'),
                        and(
                            where(productFilterFieldMap.price, '>=', price[0]),
                            where(productFilterFieldMap.price, '<=', price[1]),
                            where(productFilterFieldMap.category, 'in', categories)
                        ),
                        orderBy(productSortFieldMap.name),
                        limit(productsPerPage),
                        startAfter(lastVisibleDoc)
                    )
                }
                else {
                    q = query(collection(firestore, 'products'),
                        and(
                            where(productFilterFieldMap.price, '>=', price[0]),
                            where(productFilterFieldMap.price, '<=', price[1]),
                            where(productFilterFieldMap.category, 'in', categories)
                        ),
                        orderBy(productSortFieldMap.name),
                        limit(productsPerPage)
                    )
                }
            }
            else if (selectedValue == 3) {
                // console.log('from cate price 3', selectedValue, filterChange, sortOrderChange)
                if (!filterChange && !sortOrderChange && lastVisibleDoc) {
                    q = query(collection(firestore, 'products'),
                        and(
                            where(productFilterFieldMap.price, '>=', price[0]),
                            where(productFilterFieldMap.price, '<=', price[1]),
                            where(productFilterFieldMap.category, 'in', categories)
                        ),
                        orderBy(productSortFieldMap.price),
                        limit(productsPerPage),
                        startAfter(lastVisibleDoc)
                    )
                }
                else {
                    q = query(collection(firestore, 'products'),
                        and(
                            where(productFilterFieldMap.price, '>=', price[0]),
                            where(productFilterFieldMap.price, '<=', price[1]),
                            where(productFilterFieldMap.category, 'in', categories)
                        ),
                        orderBy(productSortFieldMap.price),
                        limit(productsPerPage)
                    )
                }
            }
            else if (selectedValue == 4) {
                // console.log('from cate price 4', selectedValue, filterChange, sortOrderChange)
                if (!filterChange && !sortOrderChange && lastVisibleDoc) {
                    q = query(collection(firestore, 'products'),
                        and(
                            where(productFilterFieldMap.price, '>=', price[0]),
                            where(productFilterFieldMap.price, '<=', price[1]),
                            where(productFilterFieldMap.category, 'in', categories)
                        ),
                        orderBy(productSortFieldMap.price, 'desc'),
                        limit(productsPerPage),
                        startAfter(lastVisibleDoc)
                    )
                }
                else {
                    q = query(collection(firestore, 'products'),
                        and(
                            where(productFilterFieldMap.price, '>=', price[0]),
                            where(productFilterFieldMap.price, '<=', price[1]),
                            where(productFilterFieldMap.category, 'in', categories)
                        ),
                        orderBy(productSortFieldMap.price, 'desc'),
                        limit(productsPerPage)
                    )
                }
            }
            else {
                // console.log('from cate price else', selectedValue, filterChange, sortOrderChange)
                if (!filterChange && !sortOrderChange && lastVisibleDoc) {
                    q = query(collection(firestore, 'products'),
                        and(
                            where(productFilterFieldMap.price, '>=', price[0]),
                            where(productFilterFieldMap.price, '<=', price[1]),
                            where(productFilterFieldMap.category, 'in', categories)
                        ),
                        limit(productsPerPage),
                        startAfter(lastVisibleDoc))
                }
                else {
                    q = query(collection(firestore, 'products'),
                        and(
                            where(productFilterFieldMap.price, '>=', price[0]),
                            where(productFilterFieldMap.price, '<=', price[1]),
                            where(productFilterFieldMap.category, 'in', categories)
                        ),
                        limit(productsPerPage)
                    )
                }
            }
        }
        else if (!categoryFilter && sizeFilter && priceFilter) {
            if (selectedValue == 1) {
                // console.log('from size price 1', selectedValue, filterChange, sortOrderChange)
                if (!filterChange && !sortOrderChange && lastVisibleDoc) {
                    q = query(collection(firestore, 'products'),
                        and(
                            where(productFilterFieldMap.price, '>=', price[0]),
                            where(productFilterFieldMap.price, '<=', price[1]),
                            where(productFilterFieldMap.size, 'in', sizes)
                        ),
                        orderBy(productSortFieldMap.name, 'desc'),
                        limit(productsPerPage),
                        startAfter(lastVisibleDoc)
                    )
                }
                else {
                    q = query(collection(firestore, 'products'),
                        and(
                            where(productFilterFieldMap.price, '>=', price[0]),
                            where(productFilterFieldMap.price, '<=', price[1]),
                            where(productFilterFieldMap.size, 'in', sizes)
                        ),
                        orderBy(productSortFieldMap.name, 'desc'),
                        limit(productsPerPage)
                    )
                }
            }
            else if (selectedValue == 2) {
                // console.log('from size price 2', selectedValue, filterChange, sortOrderChange)
                if (!filterChange && !sortOrderChange && lastVisibleDoc) {
                    q = query(collection(firestore, 'products'),
                        and(
                            where(productFilterFieldMap.price, '>=', price[0]),
                            where(productFilterFieldMap.price, '<=', price[1]),
                            where(productFilterFieldMap.size, 'in', sizes)
                        ),
                        orderBy(productSortFieldMap.name),
                        limit(productsPerPage),
                        startAfter(lastVisibleDoc)
                    )
                }
                else {
                    q = query(collection(firestore, 'products'),
                        and(
                            where(productFilterFieldMap.price, '>=', price[0]),
                            where(productFilterFieldMap.price, '<=', price[1]),
                            where(productFilterFieldMap.size, 'in', sizes)
                        ),
                        orderBy(productSortFieldMap.name),
                        limit(productsPerPage)
                    )
                }
            }
            else if (selectedValue == 3) {
                // console.log('from size price 3', selectedValue, filterChange, sortOrderChange)
                if (!filterChange && !sortOrderChange && lastVisibleDoc) {
                    q = query(collection(firestore, 'products'),
                        and(
                            where(productFilterFieldMap.price, '>=', price[0]),
                            where(productFilterFieldMap.price, '<=', price[1]),
                            where(productFilterFieldMap.size, 'in', sizes)
                        ),
                        orderBy(productSortFieldMap.price),
                        limit(productsPerPage),
                        startAfter(lastVisibleDoc)
                    )
                }
                else {
                    q = query(collection(firestore, 'products'),
                        and(
                            where(productFilterFieldMap.price, '>=', price[0]),
                            where(productFilterFieldMap.price, '<=', price[1]),
                            where(productFilterFieldMap.size, 'in', sizes)
                        ),
                        orderBy(productSortFieldMap.price),
                        limit(productsPerPage)
                    )
                }
            }
            else if (selectedValue == 4) {
                // console.log('from size price 4', selectedValue, filterChange, sortOrderChange)
                if (!filterChange && !sortOrderChange && lastVisibleDoc) {
                    q = query(collection(firestore, 'products'),
                        and(
                            where(productFilterFieldMap.price, '>=', price[0]),
                            where(productFilterFieldMap.price, '<=', price[1]),
                            where(productFilterFieldMap.size, 'in', sizes)
                        ),
                        orderBy(productSortFieldMap.price, 'desc'),
                        limit(productsPerPage),
                        startAfter(lastVisibleDoc)
                    )
                }
                else {
                    q = query(collection(firestore, 'products'),
                        and(
                            where(productFilterFieldMap.price, '>=', price[0]),
                            where(productFilterFieldMap.price, '<=', price[1]),
                            where(productFilterFieldMap.size, 'in', sizes)
                        ),
                        orderBy(productSortFieldMap.price, 'desc'),
                        limit(productsPerPage)
                    )
                }
            }
            else {
                // console.log('from size price else', selectedValue, filterChange, sortOrderChange)
                if (!filterChange && !sortOrderChange && lastVisibleDoc) {
                    q = query(collection(firestore, 'products'),
                        and(
                            where(productFilterFieldMap.price, '>=', price[0]),
                            where(productFilterFieldMap.price, '<=', price[1]),
                            where(productFilterFieldMap.size, 'in', sizes)
                        ),
                        limit(productsPerPage),
                        startAfter(lastVisibleDoc)
                    )
                }
                else {
                    q = query(collection(firestore, 'products'),
                        and(
                            where(productFilterFieldMap.price, '>=', price[0]),
                            where(productFilterFieldMap.price, '<=', price[1]),
                            where(productFilterFieldMap.size, 'in', sizes)
                        ),
                        limit(productsPerPage)
                    )
                }
            }
        }
        else if (!categoryFilter && !sizeFilter && priceFilter) {
            if (selectedValue == 1) {
                // console.log('from price 1', selectedValue, filterChange, sortOrderChange)
                if (!filterChange && !sortOrderChange && lastVisibleDoc) {
                    q = query(collection(firestore, 'products'),
                        and(
                            where(productFilterFieldMap.price, '>=', price[0]),
                            where(productFilterFieldMap.price, '<=', price[1]),
                        ),
                        orderBy(productSortFieldMap.price),
                        orderBy(productSortFieldMap.name),
                        limit(productsPerPage),
                        startAfter(lastVisibleDoc)
                    )
                }
                else {
                    // console.log('form target')
                    q = query(collection(firestore, 'products'),
                        and(
                            where(productFilterFieldMap.price, '>=', price[0]),
                            where(productFilterFieldMap.price, '<=', price[1]),
                        ),
                        orderBy(productSortFieldMap.price),
                        orderBy(productSortFieldMap.name),
                        limit(productsPerPage)
                    )
                }
            }
            else if (selectedValue == 2) {
                // console.log('from price 2', selectedValue, filterChange, sortOrderChange)
                if (!filterChange && !sortOrderChange && lastVisibleDoc) {
                    q = query(collection(firestore, 'products'),
                        where(productFilterFieldMap.price, '>=', price[0]),
                        where(productFilterFieldMap.price, '<=', price[1]),
                        orderBy(productSortFieldMap.price, 'desc'),
                        limit(productsPerPage),
                        startAfter(lastVisibleDoc)
                    )
                }
                else {
                    q = query(collection(firestore, 'products'),
                        where(productFilterFieldMap.price, '>=', price[0]),
                        where(productFilterFieldMap.price, '<=', price[1]),
                        orderBy(productSortFieldMap.price, 'desc'),
                        limit(productsPerPage)
                    )
                }
            }
            else if (selectedValue == 3) {
                // console.log('from price 3', selectedValue, filterChange, sortOrderChange)
                if (!filterChange && !sortOrderChange && lastVisibleDoc) {
                    q = query(collection(firestore, 'products'),
                        where(productFilterFieldMap.price, '>=', price[0]),
                        where(productFilterFieldMap.price, '<=', price[1]),
                        orderBy(productSortFieldMap.price),
                        limit(productsPerPage),
                        startAfter(lastVisibleDoc)
                    )
                }
                else {
                    q = query(collection(firestore, 'products'),
                        where(productFilterFieldMap.price, '>=', price[0]),
                        where(productFilterFieldMap.price, '<=', price[1]),
                        orderBy(productSortFieldMap.price),
                        limit(productsPerPage))
                }
            }
            else if (selectedValue == 4) {
                // console.log('from price 4', selectedValue, filterChange, sortOrderChange)
                if (!filterChange && !sortOrderChange && lastVisibleDoc) {
                    q = query(collection(firestore, 'products'),
                        where(productFilterFieldMap.price, '>=', price[0]),
                        where(productFilterFieldMap.price, '<=', price[1]),
                        orderBy(productSortFieldMap.price, 'desc'),
                        limit(productsPerPage),
                        startAfter(lastVisibleDoc)
                    )
                }
                else {
                    q = query(collection(firestore, 'products'),
                        where(productFilterFieldMap.price, '>=', price[0]),
                        where(productFilterFieldMap.price, '<=', price[1]),
                        orderBy(productSortFieldMap.price, 'desc'),
                        limit(productsPerPage)
                    )
                }
            }
            else {
                // console.log('from price else', selectedValue, filterChange, sortOrderChange)
                // console.log(lastVisibleDoc)
                if (!filterChange && !sortOrderChange && lastVisibleDoc && lastVisibleDoc) {
                    q = query(collection(firestore, 'products'),
                        where(productFilterFieldMap.price, '>=', price[0]),
                        where(productFilterFieldMap.price, '<=', price[1]),
                        limit(productsPerPage),
                        startAfter(lastVisibleDoc)
                    )
                }
                else {
                    q = query(collection(firestore, 'products'),
                        where(productFilterFieldMap.price, '>=', price[0]),
                        where(productFilterFieldMap.price, '<=', price[1]),
                        limit(productsPerPage)
                    )
                }
            }
        }
        else if (categoryFilter && sizeFilter && priceFilter) {
            if (selectedValue == 1) {
                // console.log('from cate size price 1', selectedValue, filterChange, sortOrderChange)
                if (!filterChange && !sortOrderChange && lastVisibleDoc) {
                    q = query(collection(firestore, 'products'),
                        and(
                            where(productFilterFieldMap.price, '>=', price[0]),
                            where(productFilterFieldMap.price, '<=', price[1]),
                            where(productFilterFieldMap.category, 'in', categories),
                            where(productFilterFieldMap.size, 'in', sizes)
                        ),
                        orderBy(productSortFieldMap.price),
                        limit(productsPerPage),
                        startAfter(lastVisibleDoc)
                    )
                }
                else {
                    q = query(collection(firestore, 'products'),
                        and(
                            where(productFilterFieldMap.price, '>=', price[0]),
                            where(productFilterFieldMap.price, '<=', price[1]),
                            where(productFilterFieldMap.category, 'in', categories),
                            where(productFilterFieldMap.size, 'in', sizes)
                        ),
                        orderBy(productSortFieldMap.price),
                        limit(productsPerPage)
                    )
                }
            }
            else if (selectedValue == 2) {
                // console.log('from cate size price 2', selectedValue, filterChange, sortOrderChange)
                if (!filterChange && !sortOrderChange && lastVisibleDoc) {
                    q = query(collection(firestore, 'products'),
                        and(
                            where(productFilterFieldMap.price, '>=', price[0]),
                            where(productFilterFieldMap.price, '<=', price[1]),
                            where(productFilterFieldMap.category, 'in', categories),
                            where(productFilterFieldMap.size, 'in', sizes)
                        ),
                        orderBy(productSortFieldMap.price, 'desc'),
                        limit(productsPerPage),
                        startAfter(lastVisibleDoc)
                    )
                }
                else {
                    q = query(collection(firestore, 'products'),
                        and(
                            where(productFilterFieldMap.price, '>=', price[0]),
                            where(productFilterFieldMap.price, '<=', price[1]),
                            where(productFilterFieldMap.category, 'in', categories),
                            where(productFilterFieldMap.size, 'in', sizes)
                        ),
                        orderBy(productSortFieldMap.price, 'desc'),
                        limit(productsPerPage)
                    )
                }
            }
            else if (selectedValue == 3) {
                // console.log('from cate size price 3', selectedValue, filterChange, sortOrderChange)
                if (!filterChange && !sortOrderChange && lastVisibleDoc) {
                    q = query(collection(firestore, 'products'),
                        and(
                            where(productFilterFieldMap.price, '>=', price[0]),
                            where(productFilterFieldMap.price, '<=', price[1]),
                            where(productFilterFieldMap.category, 'in', categories),
                            where(productFilterFieldMap.size, 'in', sizes)
                        ),
                        orderBy(productSortFieldMap.price),
                        limit(productsPerPage),
                        startAfter(lastVisibleDoc)
                    )
                }
                else {
                    q = query(collection(firestore, 'products'),
                        and(
                            where(productFilterFieldMap.price, '>=', price[0]),
                            where(productFilterFieldMap.price, '<=', price[1]),
                            where(productFilterFieldMap.category, 'in', categories),
                            where(productFilterFieldMap.size, 'in', sizes)
                        ),
                        orderBy(productSortFieldMap.price),
                        limit(productsPerPage)
                    )
                }
            }
            else if (selectedValue == 4) {
                // console.log('from cate size price 4', selectedValue, filterChange, sortOrderChange)
                if (!filterChange && !sortOrderChange && lastVisibleDoc) {
                    q = query(collection(firestore, 'products'),
                        and(
                            where(productFilterFieldMap.price, '>=', price[0]),
                            where(productFilterFieldMap.price, '<=', price[1]),
                            where(productFilterFieldMap.category, 'in', categories),
                            where(productFilterFieldMap.size, 'in', sizes)
                        ),
                        orderBy(productSortFieldMap.price, 'desc'),
                        limit(productsPerPage),
                        startAfter(lastVisibleDoc)
                    )
                }
                else {
                    q = query(collection(firestore, 'products'),
                        and(
                            where(productFilterFieldMap.price, '>=', price[0]),
                            where(productFilterFieldMap.price, '<=', price[1]),
                            where(productFilterFieldMap.category, 'in', categories),
                            where(productFilterFieldMap.size, 'in', sizes)
                        ),
                        orderBy(productSortFieldMap.price, 'desc'),
                        limit(productsPerPage)
                    )
                }
            }
            else {
                // console.log('from cate size price else', selectedValue, filterChange, sortOrderChange)
                if (!filterChange && !sortOrderChange && lastVisibleDoc) {
                    q = query(collection(firestore, 'products'),
                        and(
                            where(productFilterFieldMap.price, '>=', price[0]),
                            where(productFilterFieldMap.price, '<=', price[1]),
                            where(productFilterFieldMap.category, 'in', categories),
                            where(productFilterFieldMap.size, 'in', sizes)
                        ),
                        limit(productsPerPage),
                        startAfter(lastVisibleDoc)
                    )
                }
                else {
                    q = query(collection(firestore, 'products'),
                        and(
                            where(productFilterFieldMap.price, '>=', price[0]),
                            where(productFilterFieldMap.price, '<=', price[1]),
                            where(productFilterFieldMap.category, 'in', categories),
                            where(productFilterFieldMap.size, 'in', sizes)
                        ),
                        limit(productsPerPage)
                    )
                }
            }
        }
        else {
            if (selectedValue == 1) {
                // console.log('from else 1', selectedValue, filterChange, sortOrderChange)
                if (!filterChange && !sortOrderChange && lastVisibleDoc) {
                    q = query(collection(firestore, 'products'),
                        orderBy(productSortFieldMap.name),
                        limit(productsPerPage),
                        startAfter(lastVisibleDoc)
                    )
                }
                else q = query(collection(firestore, 'products'),
                    orderBy(productSortFieldMap.name),
                    limit(productsPerPage)
                )
            }
            else if (selectedValue == 2) {
                // console.log('from else 2', selectedValue, filterChange, sortOrderChange)
                if (!filterChange && !sortOrderChange && lastVisibleDoc) {
                    q = query(collection(firestore, 'products'),
                        orderBy(productSortFieldMap.name, 'desc'),
                        limit(productsPerPage),
                        startAfter(lastVisibleDoc)
                    )
                }
                else q = query(collection(firestore, 'products'),
                    orderBy(productSortFieldMap.name, 'desc'),
                    limit(productsPerPage)
                )
            }
            else if (selectedValue == 3) {
                // console.log('from else 3', selectedValue, filterChange, sortOrderChange)
                if (!filterChange && !sortOrderChange && lastVisibleDoc) {
                    orderByuery(collection(firestore, 'products'),
                        orderBy(productSortFieldMap.price),
                        limit(productsPerPage),
                        startAfter(lastVisibleDoc)
                    )
                }
                else q = query(collection(firestore, 'products'),
                    orderBy(productSortFieldMap.price),
                    limit(productsPerPage)
                )
            }
            else if (selectedValue == 4) {
                if (!filterChange && !sortOrderChange && lastVisibleDoc) {
                    // console.log('from else 4', selectedValue, filterChange, sortOrderChange)
                    q = query(collection(firestore, 'products'),
                        orderBy(productSortFieldMap.price, 'desc'),
                        limit(productsPerPage),
                        startAfter(lastVisibleDoc)
                    )
                }
                else q = query(collection(firestore, 'products'),
                    orderBy(productSortFieldMap.price, 'desc'),
                    limit(productsPerPage)
                )
            }
            else {
                // console.log('from else else', selectedValue, filterChange, sortOrderChange)
                if (!filterChange && !sortOrderChange && lastVisibleDoc) {
                    // console.log('end')
                    q = query(collection(firestore, 'products'),
                        limit(productsPerPage),
                        startAfter(lastVisibleDoc)
                    )
                }
                else {
                    q = query(collection(firestore, 'products'),
                        limit(productsPerPage)
                    )
                }
            }
        }

        // console.log('out of if else')

        querySnapshot = await getDocs(q)
        if (querySnapshot.empty) {
            fetchProcess = false
            if (nextPageFlag) {
                displayMessage('This is the last page. !', 'danger')
                nextPageFlag = false
                currentPage--
                res()
                return
            }
            else if (prevPageFlag) {
                displayMessage('This is the first page. !', 'danger')
                prevPageFlag = false
                res()
                return
            }
            else {
                displayMessage('Sorry no products found !', 'danger')
                res()
                return
            }
        }
        else {
            // console.log(filterChange, sortOrderChange, priceFilterChange)
            if (!filterChange && !sortOrderChange && !priceFilterChange) {
                pageNotebook.push(querySnapshot.docs)
            }
            else {
                resetPageNotebook()
                pageNotebook.push(querySnapshot.docs)
            }
            await fetchAndDisplayProducts(true, querySnapshot.docs)
            priceFilterChange = false
            sortOrderChange = false
            filterChange = false
            // sortProduct()
        }
        // console.log(pageNotebook)
        fetchProcess = false
        res()
    })
}

/**
 * 
 * @param {*} productData 
 * To show modal with more product details
 * 
 * @author dev
 */
function productQuickView(productData) {
    const modal = document.getElementById('gi_quickview_modal').cloneNode(true);
    const modalProductImage = modal.querySelector('.modal-product-image');
    const modalProductName = modal.querySelector('.modal-product-name');
    const modalProductDesc = modal.querySelector('.modal-product-desc');
    const modalProductPrice = modal.querySelector('.modal-product-price');

    modalProductImage.src = productData.imageUrl;
    modalProductName.textContent = productData.name;
    modalProductPrice.textContent = parseFloat(productData.price);
    modalProductDesc.innerHTML = formatModalDescription(productData.ProductDescription);
    modal.querySelector('.add-to-cart').addEventListener('click', redirectToProductDetails.bind(this, productData.productId));

    // For zoom
    const mymodal = new bootstrap.Modal(modal);
    mymodal.show();
}

function formatModalDescription(description) {
    if (!description) {
        return '';
    }

    const pointsArray = description.split('•').map((point) => point.trim());
    return pointsArray.map((point) => `<li>${point}</li>`).join('');
}

/**
 * 
 * @param {*} e : Event
 * Function to Sort
 * number of sort orders : 4
 * @author dev
 */
function sortChange(e) {
    // console.log('from sortChange')
    sortOrderChange = true
    fetch()
}

/**
 * 
 * @param {*} e : Event
 * Function to Sort
 * number of sort orders : 4
 * @author dev
 */
function getSortOder(e) {
    const sortSelect = document.querySelector('.sort-by')
    const selectedValue = sortSelect.options[sortSelect.selectedIndex].value
    return selectedValue
}


/**
 * 
 * @param {*} productId : Product to see details for
 * redirect to see product details
 * @author dev
 */
function redirectToProductDetails(productId) {
    window.location.href = `product-detail.html?data=${productId}`
}

/**
 * Move to next page
 * @author dev
 */
function nextPage() {
    // console.log('from nextPage')
    nextPageFlag = true
    currentPage++
    if (!filterChange && !sortOrderChange) {
        if (!pageNotebook[currentPage]) fetch()
        else {
            fetchAndDisplayProducts(true, pageNotebook[currentPage])
        }
    }
}

/**
 * Move to prev page
 * @author dev
 */
function prevPage() {
    // console.log('from prev')
    prevPageFlag = true
    currentPage--
    if (currentPage != -1) {
        fetchAndDisplayProducts(true, pageNotebook[currentPage])
    }
    else {
        currentPage++
        displayMessage('This is the first page. !', 'danger')
    }
}

function resetPageNotebook() {
    pageNotebook = []
    currentPage = 0
}