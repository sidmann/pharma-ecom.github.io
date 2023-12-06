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
const firebaseConfig = {
    apiKey: "AIzaSyBrIAlkIyp5ALsv5RslbXA1oQVQL3eKhig",
    authDomain: "pharma-ecom-app.firebaseapp.com",
    projectId: "pharma-ecom-app",
    storageBucket: "pharma-ecom-app.appspot.com",
    messagingSenderId: "798776981223",
    appId: "1:798776981223:web:16f92da76fe7c2f1cf9442"
  };

  const app = initializeApp(firebaseConfig);
  const firestore = getFirestore(app);
  const auth = getAuth(app);
  const storage = getStorage(app);
  var userData = null;
  var loggedIn = null;


  onAuthStateChanged(auth, async (user) => {
    if (user) {
        console.log("if")
        document.querySelector('#logout-btn').style.display='block';
        loggedIn = true
        onLoggedIn();
        // User is authenticated
        const docRef = doc(firestore, "users", user.uid);
        const docSnap = getDoc(docRef);
        const orders = await fetchOrdersForUser();
        displayOrdersInTable(orders);
        docSnap.then((docSnapshot) => {
            // console.log(docSnapshot)
            if (docSnapshot.exists()) {
                userData = docSnapshot.data();
                console.log(userData.role);
                roleAccess(userData.role);
                updateProfileName(userData.role,userData.firstName)
                updateCart();
                fetchNavCategories();
                updateProfilePicture(userData.role,userData.profilePicture)

                // updateCart();
            }
        });
    } else {
        console.log("else");
        updateCart();
        fetchNavCategories();
        // User is not authenticated, redirect to login page
        // window.location.href = "login.html";
        document.querySelector('#logout-btn').style.display='none';
    }
});

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
                aria-controls="v-pills-home" aria-selected="true">${doc.data().name}
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

  async function fetchOrdersForUser() {
    console.log(loggedIn)   
    const userRef = doc(firestore, "users", auth.currentUser.uid);
    const ordersRef = collection(userRef, "orders");

    try {
        const querySnapshot = await getDocs(ordersRef);
        const orders = [];

        if (!querySnapshot.empty) {
            querySnapshot.forEach((doc) => {
                const orderData = doc.data();
                // console.log(orderData);
                orders.push(orderData);
            });
        }
        console.log(orders);
        return orders;
    } catch (error) {
        console.error("Error fetching orders for user:", error);
        return [];
    }
}


async function displayOrdersInTable(orders) {
    const tableBody = document.querySelector('.wish-empt');
    tableBody.innerHTML = "";

    orders.forEach(order => {
        const newRow = document.createElement('tr');
        newRow.classList.add('pro-gl-content');
        newRow.innerHTML = `
            <td scope="row"><span>${order.orderId}</span></td>
            <td><div class="order-products"></div></td>
            <td><span>${order.orderDate}</span></td>
           <td><span class="avl">${order.status}</span></td>
            <td>
                <span class="tbl-btn">
                    <a class="gi-btn-2 add-to-cart m-r-5px" href="${order.trackUrl}" title="Track Order">
                        <i class="fi-rr-truck-moving"></i>
                    </a>
                    <a class="gi-btn-1 gi-remove-wish" href="order-details.html?orderId=${order.orderId}" title="Order Details">
                        <i class="fi-rr-list"></i>
                    </a>
                </span>
            </td>
        `;
        const orderProducts = newRow.querySelector('.order-products')
        order.productsDetails.forEach(product => {
            const span = document.createElement('span')
            span.innerHTML = `${product.name}`
            orderProducts.appendChild(span)
        });
        tableBody.appendChild(newRow);
    });
}
