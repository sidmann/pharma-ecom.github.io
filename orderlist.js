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


  onAuthStateChanged(auth , async (user) => {
    console.log('form onauth')
    if (user){
        loggedIn = true
        const orders = await fetchOrdersForUser();
    }
    else{
        loggedIn = false
        window.location.href = 'login.html'
    }
  })


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
// Your Firebase initialization and fetching logic...

async function displayOrdersInTable(orders) {
    const tableBody = document.querySelector('.wish-empt');

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
                    <a class="gi-btn-1 gi-remove-wish" href="${order.detailsUrl}" title="Order Details">
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

onAuthStateChanged(auth, async (user) => {
    console.log('from onauth');
    if (user) {
        loggedIn = true;
        const orders = await fetchOrdersForUser();
        displayOrdersInTable(orders);
    } else {
        loggedIn = false;
        window.location.href = 'login.html';
    }
});




