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

// import { getCategoryCount } from "./assets/repository/products/products.js";

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

/**
 * logout function
 * @returns mydev
 */
confirmLogoutBtn.addEventListener("click", () => {
    signOut(auth)
        .then(() => {
            console.log("User logged out successfully");
            window.location.href = "login.html";
        })
        .catch((error) => {
            console.error("Error during logout:", error);
        });
});

/**
 * OnauthStateChanged function
 * @return mydev
 */
onAuthStateChanged(auth, async (user) => {
    // await embedCategoriesCard()
    await fetchProductsForSlider();
    // await newArrivalProducts();
    if (user) {
        // console.log("if");
        document.querySelectorAll('.logout-btn').forEach((btn)=>{
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
                updateProfileName(userData.role, userData.firstName);
                updateProfilePicture(userData.role, userData.profilePicture)
                // getUserRealTime()
                updateCart();
                // fetchNavCategories();
            }
        });
    } else {
        // console.log("else");
        updateCart();
        document.querySelectorAll('.logout-btn').forEach((btn)=>{
            btn.classList.add('d-none');
        });
        // fetchNavCategories();   
        // window.location.href = "login.html";
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

    if (profilePicture && profilePicture.trim() !== '') {
        profilePictureElement.src = profilePicture;
    } else {
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
 * @returns categories list = 
 * [{
 *  categoryId,
 *  name
 * }]
 */
// function fetchCategories() {
//     console.log('inside categories')
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
//     console.log('inside embed')
//     const categories = await fetchCategories()
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
//         items: 3,
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


// ------------------------- Featured Product-----------------------------
async function fetchProductsForSlider() {
    const productSlider = document.querySelector('#products-for-slider')
    productSlider.innerHTML = ''

    const productSliderCollection = collection(firestore, 'products')
    const productSliderSnapshot = await getDocs(productSliderCollection);
    let productCount = 0;
    productSliderSnapshot.forEach(async (doc) => {
            const productDoc = doc.data()
            // console.log(productDoc)
            const productDiv = document.createElement('div')
            productDiv.classList.add('gi-product-content')
            productDiv.innerHTML = `
                       <!-- <div class="gi-product-inner">
                            <div class="gi-pro-image-outer">
                                <div class="gi-pro-image">
                                    <a href="products.html" class="image">
                                        <span class="label veg">
                                            <span class="dot"></span>
                                        </span>
                                        <img class="main-image"
                                            src="${productDoc.imageUrl}"
                                            alt="Product">
                                        <img class="hover-image"
                                            src="${productDoc.imageUrl}"
                                            alt="Product">
                                    </a>-->
                                   <!-- <span class="flags">
                                        <span class="sale">Sale</span>
                                        
                                    </span>-->
                               <!-- </div>
                            </div>-->
                            <div class="gi-product-inner">
                            <div class="gi-pro-image-outer">
                                <div class="gi-pro-image">
                                        <a href="products.html">
                                        <img class="main-image"
                                        src="${productDoc.imageUrl}" style="width:235px; text-align:center; margin:auto; display:block;transition: transform 0.3s;" onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'"
                                        alt="Product">
                                    </a>
                                   <!-- <span class="flags">
                                        <span class="sale">Sale</span>
                                    </span>-->
                                </div>
                            </div>
                            <div class="gi-pro-content">
                                <a href="products.html">
                                </a>
                                <h5 class="gi-pro-title"><a href="products.html">
                                 ${productDoc.name}
                                </a></h5>
                                <h5 class="gi-pro-title"><a href="products.html">
                                 <i>${productDoc.tagLine}</i>
                                </a></h5>
                                <div class="gi-pro-rat-price">
                                    <!--<span class="gi-pro-rating">
                                        <i class="gicon gi-star fill"></i>
                                        <i class="gicon gi-star fill"></i>
                                        <i class="gicon gi-star fill"></i>
                                        <i class="gicon gi-star fill"></i>
                                        <i class="gicon gi-star"></i>
                                    </span> -->
                                    <span class="gi-price">
                                        <span class="new-price"><span>&#8377;</span>${productDoc.price}</span>
                                       <!-- <span class="old-price"><span>&#8377;</span>${productDoc.price + 30}</span>-->
                                    </span>
                                </div>
                            </div>
                        </div>`
            productSlider.appendChild(productDiv)
            productCount++;
    })

    // $('.gi-product-slider').owlCarousel({
    //     loop: true,
    //     dots: false,
    //     nav: false,
    //     smartSpeed: 10000,
    //     autoplay: true,
    //     items: 3,
    //     responsiveClass: true,
    //     responsive: {
    //         0: {
    //             items: 1
    //         },
    //         421: {
    //             items: 2
    //         },
    //         768: {
    //             items: 3
    //         },
    //         992: {
    //             items: 3
    //         },
    //         1200: {
    //             items: 4
    //         },
    //         1367: {
    //             items: 5
    //         }
    //     }
    // });

    var owl = $('.gi-product-slider');

    owl.owlCarousel({
        loop: true,
        dots: false,
        nav: false,
        smartSpeed: 5000,
        autoplay: true,
        items: 3,
        responsiveClass: true,
        responsive: {
            0: {
                items: 1
            },
            421: {
                items: 2
            },
            768: {
                items: 3
            },
            992: {
                items: 3
            },
            1200: {
                items: 4
            },
            1367: {
                items: 5
            }
        }
    });

    // Pause the slider on mouseenter
    owl.on('mouseenter', function () {
        owl.trigger('stop.owl.autoplay');
    });

    // Resume the slider on mouseleave
    owl.on('mouseleave', function () {
        owl.trigger('play.owl.autoplay');
    });

}


// -------------------new Arrival-----------------------------------------
// async function newArrivalProducts() {
//     const newArrivalProduct = document.querySelector('#new-product-arrival-section')
//     newArrivalProduct.innerHTML = ''

//     const newArrivalCollection = collection(firestore, 'products')
//     const newArrivalSnapShot = await getDocs(newArrivalCollection);
//     newArrivalSnapShot.forEach((doc) => {
//         const newArrivalData = doc.data();
//         if (newArrivalData.newProductArrivalStatus == true) {
//             // console.log(newArrivalData)
//             const newArrivalDiv = document.createElement('div')
//             newArrivalDiv.classList.add('col-md-4', 'col-sm-6', 'col-xs-6', 'gi-col-5', 'gi-product-box')
//             newArrivalDiv.innerHTML = `
//                 <div class="gi-product-content">
//                     <div class="gi-product-inner">
//                         <div class="gi-pro-image-outer">
//                             <div class="gi-pro-image">
//                                 <a href="products.html" class="image">
//                                     <span class="label veg">
//                                         <span class="dot"></span>
//                                     </span>
//                                     <img class="main-image"
//                                         src="${newArrivalData.imageUrl}"
//                                         alt="Product">
//                                     <img class="hover-image"
//                                         src="${newArrivalData.imageUrl}"
//                                         alt="Product">
//                                 </a>
//                                 <span class="flags">
//                                     <span class="sale">New</span>
//                                 </span>
//                             </div>
//                         </div>
//                         <div class="gi-pro-content">
//                             <a href="products.html">
//                             </a>
//                             <h5 class="gi-pro-title"><a href="products.html">
//                                     ${newArrivalData.name}</a></h5>
//                             <div class="gi-pro-rat-price">
//                                <!-- <span class="gi-pro-rating">
//                                     <i class="gicon gi-star fill"></i>
//                                     <i class="gicon gi-star fill"></i>
//                                     <i class="gicon gi-star fill"></i>
//                                     <i class="gicon gi-star"></i>
//                                     <i class="gicon gi-star"></i>
//                                 </span>-->
//                                 <span class="gi-price">
//                                     <span class="new-price"><span>&#8377</span>${newArrivalData.price}</span>
//                                     <!--<span class="old-price"><span>&#8377</span>$65.00</span> -->
//                                 </span>
//                             </div>
//                         </div>
//                     </div>
//                 </div>
//             `
//             newArrivalProduct.appendChild(newArrivalDiv);
//         }
//     })
// }

// -------------------------------------------------------------------


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
//-----------------------------------------------------------------------/

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
//--------------------------------------------------------------------------

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
    // mobileCategoryList.innerHTML = `
    // <div class='w-100 d-flex justify-content-center'>
    //     <div class="spinner-grow text-secondary" role="status">
    //         <span class="visually-hidden">Loading...</span>
    //     </div>
    // </div>
    // `
    // const categorySnapshot = await getDocs(collection(firestore, 'categories'))
    // if (categorySnapshot.empty) {
    //     console.log('from empty')
    //     resolve()
    //     return
    // }

    // categoryList.innerHTML = ``
    // mobileCategoryList.innerHTML = ``

    // categorySnapshot.forEach(doc => {
    //     const span = document.createElement('span')
    //     span.innerHTML = `
    //     <div class="gi-tab-list nav flex-column nav-pills me-3" id="v-pills-tab"
    //     role="tablist" aria-orientation="vertical">
    //         <button class="nav-link" id="v-pills-home-tab" data-bs-toggle="pill"
    //             data-bs-target="#v-pills-home" type="button" role="tab"
    //             aria-controls="v-pills-home" aria-selected="true">
    //             <a class="text-decoration-none text-black" href="products.html?categoryId=${doc.data().categoryId}">${doc.data().name}</a>
    //         </button>
    //     </div>
    //     `
    //     categoryList.appendChild(span)

        // const list = document.createElement('li')
        // list.innerHTML = `
        // <a class="text-decoration-none text-black" href="products.html?categoryId=${doc.data().categoryId}">${doc.data().name}</a>
        // `
        // mobileCategoryList.appendChild(list)
    // })
// }
