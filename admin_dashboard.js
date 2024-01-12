
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.3.1/firebase-app.js";
import { getFirestore, collection, addDoc, query, where, getDocs, updateDoc, doc, getDoc, setDoc, deleteField, deleteDoc } from "https://www.gstatic.com/firebasejs/10.3.1/firebase-firestore.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.3.1/firebase-auth.js"
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.3.1/firebase-storage.js";

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
var loggedIn = false;

// Function to check if the user is logged in
function isUserLoggedIn() {
    return !!auth.currentUser;
}

//--------------------------------------Event Listenser------------------------------------------- 
// Add an event listener to the confirmation logout button
confirmLogoutBtn.addEventListener("click", () => {
    signOut(auth)
        .then(() => {
            // Redirect to the login page or perform any other actions
            window.location.href = "login.html"; // Redirect to the login page
        })
        .catch((error) => {
            console.error("Error during logout:", error);
        });
});

//AddEventListener to loading the Options when we open DropDown
document.querySelector('#manufacturerDropdown').addEventListener('click', fetchManufacturers)
// document.querySelector('#categoryDropdown').addEventListener('click', fetchCategories)
// document.querySelector('#colorShadeDropdown').addEventListener('click', fetchColorShades)
document.querySelector('#productSizeDropdown').addEventListener('click', fetchProductSizes);
// document.querySelector('#colorShadeManufacturer').addEventListener('change', populateColorShadeList)

//--------------------------------------------------------------------------------- 
// Function to fetch and display user data
function fetchAndDisplayUserData() {

    const userRole = userData.role
    const usersRef = collection(firestore, 'users');

    // Check if the user has the admin role
    if (userRole === 'ADMIN') {
        getDocs(usersRef)
            .then((querySnapshot) => {
                const userDetails = document.getElementById('userDetailsData');
                querySnapshot.forEach((doc) => {
                    const userData = doc.data();
                    const userRow = createTableRow(userData, doc);
                    userDetails.appendChild(userRow);
                });
            })
            .catch((error) => {
                console.error("Error fetching user data:", error);
            });
    }
}

//Create User Role
function createTableRow(userData, doc) {
    const userRow = document.createElement('tr');
    // console.log(userData)
    userRow.innerHTML = `
                <td>${userData.firstName || ''}</td>
                <td>${userData.lastName || ''}</td>
                <td>${userData.email || ''}</td>
                <td>${userData.phoneNumber || ''}</td>
                <td>${userData.role || ''}</td>
                <td>
                    <a class="btn btn-primary" type="button"
                            href="orderlist.html?userId=${doc.id}">
                        View Orders
                    </a>
                </td>
                `;

    // const viewOrdersBtn = userRow.querySelector(".view-orders-btn");
    // viewOrdersBtn.addEventListener("click", async (event) => {
    //     const userId = event.target.getAttribute('data-user-id');
    //     console.log(userId, event.target)

        // Open order modal
        // orderModal.show();
    //     await fetchAndDisplayAllOrders(userId, event.target);
    // });
    return userRow;
}


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
//------------------------------------------------------------------------------

//------------------------------loading and role access--------------------------
// Use onAuthStateChanged to control access to admin dashboard
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
            if (docSnapshot.exists()) {
                userData = docSnapshot.data();
                roleAccess(userData.role);
                fetchAndDisplayUserData();
                updateProfileName(userData.role, userData.firstName);
                updateProfilePicture(userData.role, userData.profilePicture)
                // fetchNavCategories();
                updateCart();
            }
        });
    } else {
        document.querySelectorAll('.logout-btn').forEach((btn) => {
            btn.classList.add('d-none');
        });
        window.location.href = "login.html";
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

let totalNumberOfCustomers = 0;
//******************************** Display orders ***********************************************

// Function to display all orders for a customer in the modal
async function displayAllOrders(orders) {
    // console.log("inside display all orders");

    return new Promise(async (resolve) => {
        const ordersContainer = document.createElement("div");
        ordersContainer.className = "ordersContainer";
        const orderModalContent = document.getElementById("orderModalContent");

        if (Array.isArray(orders) && orders.length > 0) {
            for (const order of orders) {
                const orderContainer = document.createElement("div");
                orderContainer.className = "order-container";

                // Create and append elements for order ID, date, and time
                const orderInfoContainer = document.createElement("div");
                orderInfoContainer.className = "order-info-container";

                const orderIDElement = document.createElement("div");
                orderIDElement.className = "order-field";
                orderIDElement.innerHTML = `<strong> Order ID:</strong> ${order.orderId} `;

                const orderDateElement = document.createElement("div");
                orderDateElement.className = "order-field";
                orderDateElement.innerHTML = `<strong> Order Date:</strong> ${order.orderDate || ""} `;

                const orderTimeElement = document.createElement("div");
                orderTimeElement.className = "order-field";
                orderTimeElement.innerHTML = `<strong> Order Time:</strong> ${order.orderTime || ""} `;

                orderInfoContainer.appendChild(orderIDElement);
                orderInfoContainer.appendChild(orderDateElement);
                orderInfoContainer.appendChild(orderTimeElement);

                orderContainer.appendChild(orderInfoContainer);

                // Create and append elements for order details
                const orderDetailsContainer = document.createElement("div");
                orderDetailsContainer.className = "order-details";

                // Iterate through the productsDetails array and display product information
                for (const product of order.productsDetails) {
                    const productElement = document.createElement("div");
                    productElement.innerHTML = `<strong>Product ID:</strong> ${product.productId}<br>
                     <strong>Quantity:</strong> ${product.quantity}`;
                    orderDetailsContainer.appendChild(productElement);
                }
                orderContainer.appendChild(orderDetailsContainer);

                // Create and append elements for bill details
                const billDetailsContainer = document.createElement("div");
                billDetailsContainer.className = "bill-details";

                const deliveryFeeElement = document.createElement("div");
                deliveryFeeElement.innerHTML = `<strong>Delivery Fee:</strong> ${order.bill.deliveryFee || ""}`;

                const subTotalElement = document.createElement("div");
                subTotalElement.innerHTML = `<strong>Subtotal:</strong> ${order.bill.subTotal || ""}`;

                const totalElement = document.createElement("div");
                totalElement.innerHTML = `<strong>Total:</strong> ${order.bill.total || ""}`;

                billDetailsContainer.appendChild(deliveryFeeElement);
                billDetailsContainer.appendChild(subTotalElement);
                billDetailsContainer.appendChild(totalElement);
                orderContainer.appendChild(billDetailsContainer);

                // Create and append elements for payment details
                const paymentDetailsContainer = document.createElement("div");
                paymentDetailsContainer.className = "payment-details";
                const mopElement = document.createElement("div");
                if (order.mop.length > 1) {
                    const razorpayPaymentIdElement = document.createElement("div");
                    razorpayPaymentIdElement.innerHTML = `<strong>Razorpay Payment ID:</strong> ${order.mop[1].razorpay_payment_id || ""}`;
                    paymentDetailsContainer.appendChild(razorpayPaymentIdElement);
                }
                paymentDetailsContainer.appendChild(mopElement);
                orderContainer.appendChild(paymentDetailsContainer);

                // Append a horizontal line after each order
                const horizontalLine = document.createElement("hr");
                horizontalLine.className = "impressive-hr";
                orderContainer.appendChild(horizontalLine);

                // Append the order container to the orders container
                ordersContainer.appendChild(orderContainer);
            }

            orderModalContent.innerHTML = "";
            orderModalContent.appendChild(ordersContainer);
        } else {
            orderModalContent.innerHTML = "<p>No orders found for this customer.</p>";
            // console.log("1");
        }
        resolve();
    });
}


// Function to convert date and time strings to a Date object
function convertToDate(dateString, timeString) {
    // Split the date and time strings
    const dateParts = dateString.split("/");
    const timeParts = timeString.split(" ");

    // Parse the time parts
    const time = timeParts[0];
    const isPM = timeParts[1] === "pm";

    // Extract hours, minutes, and seconds
    const timeParts2 = time.split(":");
    let hours = parseInt(timeParts2[0]);
    const minutes = parseInt(timeParts2[1]);

    // Convert to 24-hour format if PM
    if (isPM && hours !== 12) {
        hours += 12;
    } else if (!isPM && hours === 12) {
        hours = 0;
    }

    // Format the time as HH:mm for proper sorting
    const formattedTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    return `${dateParts[2]}-${dateParts[1]}-${dateParts[0]} ${formattedTime}`;
}

// Function to fetch and display order details for a specific order
async function fetchAndDisplayOrderDetails(order, orderDetailsContainer) {
    // console.log(order)
    try {
        if (order) {

            // Create HTML to display order details
            const orderDetailsHTML = `
                        <div class="order-field">
                            <strong>Order State:</strong> ${order.state || ""}
                        </div>
                        <div class="order-field">
                            <strong>Payment Method:</strong> ${order.paymentMethod || ""}
                        </div>
                        <div class="order-field">
                            <strong>Shipping Address:</strong> <pre>${order.address || ""}</pre>
                        </div>
                        <h3>Items Purchased</h3>
                        <ul>
                            ${order.summary.items && Array.isArray(order.summary.items)
                    ? order.summary.items.map((item) => `
                                    <li>
                                        <strong>Product ID:</strong> ${item.productId || ""}<br>
                                        <strong>Product Name:</strong> ${item.productName || ""}<br>
                                        <strong>Product Category:</strong> ${item.productCategory || ""}<br>
                                        <strong>Product Color:</strong> ${item.productColor || ""}<br>
                                        <strong>Product Color Shade:</strong> ${item.productColorShade || ""}<br>
                                        <strong>Product Size:</strong> ${item.productSize || ""} Ltrs. <br>
                                        <strong>Product Price:</strong> Rs. ${item.productPrice || ""}<br>
                                        <strong>Product Quantity:</strong> ${item.productQuantity || ""} No's
                                    </li><br>`
                    ).join('')
                    : "<li>No items found</li>"
                }
                        </ul>
                        <h3>Bill Summary</h3>
                        <div class="order-field">
                            <strong>Subtotal:</strong> Rs. ${order.summary.billSummary.subTotal || ""}
                        </div>
                        <div class="order-field">
                            <strong>Delivery Fee:</strong> Rs. ${order.summary.billSummary.deliveryFee || ""}
                        </div>
                        <div class="order-field">
                            <strong>Grand Total:</strong> Rs. ${order.summary.billSummary.grandTotal || ""}
                        </div><br>
                    `;
            // Set the HTML content of the order details container
            orderDetailsContainer.innerHTML = orderDetailsHTML;
            // console.log("2");
        } else {
            // Handle the case where order details are not found
        }
    } catch (error) {
        console.error("Error fetching order details:", error);
    }
}


// Function to fetch and display all orders of a customer
async function fetchAndDisplayAllOrders(userId, orderBtn) {

    // console.log("1")
    orderBtn.disabled = true
    orderBtn.innerHTML = `
                    <span class="spinner-border spinner-border-sm" aria-hidden="true"></span>
                    <span role="status">fetching orders...</span>
                `
    const orders = await fetchOrdersForUser(userId);
    // console.log("2")
    if (Array.isArray(orders) && orders.length > 0) {
        // console.log("3")
        const orderDetailsList = [];

        const orderIds = []
        //loop get the ids
        orders.forEach(async (order) => {
            orderIds.push(order.orderId)
        })
        const orderSnapshot = await getDocs(query(collection(firestore, "users", userId, 'orders')), where('orderId', 'in', orderIds))
        // const orderSnapshot = await getDocs(query(collection(firestore,userId, 'orders'), where('orderId', 'in', orderIds)))
        //return if empty
        // console.log("4")
        if (orderSnapshot.empty) {
            const orderModalContent = document.getElementById("orderModalContent");
            orderModalContent.innerHTML = "<p>No orders found for this customer.</p>";
            orderBtn.disabled = false
            orderBtn.innerHTML = `View orders`
            return
        }
        //push all json data in one list
        orderSnapshot.forEach(doc => {
            orderDetailsList.push(doc.data())
        })

        // console.log(orderDetailsList);
        // Display all order details in the modal
        await displayAllOrders(orderDetailsList);
        orderBtn.disabled = false
        orderBtn.innerHTML = `View orders`
    } else {
        // console.log("4")
        // Handle the case where there are no orders for the customer
        orderBtn.disabled = false
        orderBtn.innerHTML = `View orders`
        displayAllOrders([]);
    }
}

// Function to fetch orders for a specific user
async function fetchOrdersForUser(userId) {
    const userRef = doc(firestore, "users", userId);
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

        return orders;
    } catch (error) {
        console.error("Error fetching orders for user:", error);
        return [];
    }
}
//***********************Upload Product***********************************************************

// Add a new Manufacturer
async function addManufacturer(manufacturerName) {
    try {
        const manufacturerRef = collection(firestore, 'manufacturers');
        const docRef = await addDoc(manufacturerRef, { name: manufacturerName });
        await updateDoc(docRef, { manufacturerId: docRef.id })
        document.querySelector('#manufacturerDropdown').addEventListener('click', fetchManufacturers)
        return docRef.id; // Return the ID of the added document
    } catch (error) {
        console.error('Error adding manufacturer:', error);
        throw error; // Re-throw the error for handling at the calling code
    }
}

// Add a new Category
// async function addCategory(categoryName) {
//     try {
//         const categoryRef = collection(firestore, 'categories');
//         const docRef = await addDoc(categoryRef, { name: categoryName });
//         await updateDoc(docRef, { categoryId: docRef.id })
//         document.querySelector('#categoryDropdown').addEventListener('click', fetchCategories)
//         return docRef.id; // Return the ID of the added document
//     } catch (error) {
//         console.error('Error adding category:', error);
//         throw error; // Re-throw the error for handling at the calling code
//     }
// }

// Function to edit a manufacturer
async function editManufacturer(manufacturerId, manufacturerName) {
    // console.log(manufacturerId)
    // console.log('from editmanufacturer')
    // Implement your edit logic here
    // You can open a modal or update the manufacturer name in the same modal
    const updatedManufacturerName = prompt('Edit Manufacturer Name:', manufacturerName);
    if (updatedManufacturerName !== null) {
        const manufacturerCollection = collection(firestore, 'manufacturers')
        const manufacturerSnapshot = await getDocs(query(manufacturerCollection, where('manufacturerId', '==', manufacturerId)))
        if (!manufacturerSnapshot.empty) {
            // console.log(manufacturerSnapshot.docs[0].data())
            updateDoc(manufacturerSnapshot.docs[0].ref, { name: updatedManufacturerName })
                .then(() => {
                    console.log(`Successfully Updated to ${updatedManufacturerName}`)
                    // console.log('Manufacturer updated successfully');
                    displayMessage('Manufacturer updated successfully!', 'success');
                    document.querySelector('#manufacturerDropdown').addEventListener('click', fetchManufacturers)
                    populateManufacturerList();
                })
                .catch((error) => {
                    console.error('Error updating manufacturer:', error);
                });
        }
    }
}

// Function to delete a manufacturer
async function deleteManufacturer(manufacturerId) {
    // Implement your delete logic here
    const confirmation = confirm('Are you sure you want to delete this manufacturer?');
    if (confirmation) {
        try {
            const manufacturerCollection = collection(firestore, 'manufacturers')
            const manufacturerSnapshot = await getDocs(query(manufacturerCollection, where('manufacturerId', '==', manufacturerId)))
            if (!manufacturerSnapshot.empty) {
                await deleteDoc(manufacturerSnapshot.docs[0].ref)
            }
            console.log('Manufacturer deleted successfully');
            displayMessage('Manufacturer deleted successfully!', 'success');
            document.querySelector('#manufacturerDropdown').addEventListener('click', fetchManufacturers)
            populateManufacturerList();
        } catch (error) {
            console.error('Error deleting manufacturer:', error);
        }
    }
}

// Function to edit a category
// async function editCategory(categoryId, categoryName) {
//     // Implement your edit logic here
//     // You can open a modal or update the category name in the same modal
//     const updatedCategoryName = prompt('Edit Category Name:', categoryName);
//     if (updatedCategoryName !== null) {
//         const categoryCollection = collection(firestore, 'categories')
//         const categorySnapshot = await getDocs(query(categoryCollection, where('categoryId', '==', categoryId)))
//         if (!categorySnapshot.empty) {
//             updateDoc(categorySnapshot.docs[0].ref, { name: updatedCategoryName })
//                 .then(() => {
//                     console.log('Category updated successfully');
//                     displayMessage('Category updated successfully!', 'success');
//                     document.querySelector('#categoryDropdown').addEventListener('click', fetchCategories)
//                     populateCategoryList();
//                 })
//                 .catch((error) => {
//                     console.error('Error updating category:', error);
//                 });
//         }
//     }
// }

// Function to delete a category
// async function deleteCategory(categoryId) {
//     // Implement your delete logic here
//     const confirmation = confirm('Are you sure you want to delete this category?');
//     if (confirmation) {
//         try {
//             const categoryCollection = collection(firestore, 'categories')
//             const categorySnapshot = await getDocs(query(categoryCollection, where('categoryId', '==', categoryId)))
//             if (!categorySnapshot.empty) {
//                 await deleteDoc(categorySnapshot.docs[0].ref);
//             }
//             console.log('Category deleted successfully');
//             displayMessage('Category deleted successfully!', 'success');
//             document.querySelector('#categoryDropdown').addEventListener('click', fetchCategories)
//             populateCategoryList();
//         } catch (error) {
//             console.error('Error deleting category:', error);
//         }
//     }
// }

async function fetchManufacturers() {
    const select = document.querySelector('#manufacturerDropdown')
    select.innerHTML = `<option value="">
                                Loading ...
                            </option>`
    const manufacturerSnapshot = await getDocs(collection(firestore, 'manufacturers'))
    if (!manufacturerSnapshot.empty) {
        select.removeEventListener('click', fetchManufacturers)
        select.innerHTML = ``
        const option = document.createElement('option')
        option.innerHTML = `Please select`
        select.appendChild(option)
        manufacturerSnapshot.forEach(doc => {
            const option = document.createElement('option')
            option.setAttribute('value', doc.data().name)
            option.setAttribute('data-id', doc.data().manufacturerId)
            option.innerHTML = `${doc.data().name}`
            select.appendChild(option)
        })
        // document.querySelector('#colorShadeDropdown').click()
    }
    else {
        select.innerHTML = `<option value="">Please select</option>`
        displayMessage('No manufactures added!', 'danger')
    }
}

// async function fetchCategories() {
//     const select = document.querySelector('#categoryDropdown')
//     select.innerHTML = `<option value="">
//                                 Loading ...
//                             </option>`
//     const categorySnapshot = await getDocs(collection(firestore, 'categories'))
//     if (!categorySnapshot.empty) {
//         select.removeEventListener('click', fetchCategories)
//         select.innerHTML = ``
//         const option = document.createElement('option')
//         option.innerHTML = `Please select`
//         select.appendChild(option)
//         categorySnapshot.forEach(doc => {
//             const option = document.createElement('option')
//             option.setAttribute('value', doc.data().name)
//             option.setAttribute('data-id', doc.data().categoryId)
//             option.innerHTML = `${doc.data().name}`
//             select.appendChild(option)
//         })
//     }
//     else {
//         select.innerHTML = `<option value="">Please select</option>`
//         displayMessage('No categories added!', 'danger')
//     }
// }

// Add a click event listener to open the manufacturer modal
const openManufacturerModalButton = document.getElementById('addManufacturerButton');
openManufacturerModalButton.addEventListener('click', () => {
    // Clear the manufacturer form
    document.getElementById('manufacturerName').value = '';
    populateManufacturerList();
    // $('#manufacturerModal').modal('show');
});

// Add a click event listener to open the category modal
// const openCategoryModalButton = document.getElementById('addCategoryButton');
// openCategoryModalButton.addEventListener('click', () => {
//     // Clear the category form
//     console.log('from addBtn')
//     document.getElementById('categoryName').value = '';
//     populateCategoryList();
//     // $('#categoryModal').modal('show');
// });

// Populate Manufacturer List
function populateManufacturerList() {
    const manufacturerList = document.getElementById('manufacturerList');
    getDocs(collection(firestore, 'manufacturers'))
        .then((manufacturers) => {
            manufacturerList.innerHTML = ''; // Clear the list
            manufacturers.forEach((manufacturerDoc) => {
                const manufacturer = manufacturerDoc.data();
                const row = document.createElement('tr');
                row.innerHTML = `
                                <td>${manufacturer.name}</td>
                                <td>
                                    <button class="btn btn-sm btn-primary edit">Edit</button>
                                    <button class="btn btn-sm btn-danger delete" >Delete</button>
                                </td>
                            `;
                manufacturerList.appendChild(row);
                row.querySelector('.edit').addEventListener('click', () => editManufacturer(manufacturer.manufacturerId, manufacturer.name))
                row.querySelector('.delete').addEventListener('click', () => deleteManufacturer(manufacturer.manufacturerId))
            });
        })
        .catch((error) => {
            console.error('Error getting manufacturers:', error);
        });
}

// Populate Category List
// function populateCategoryList() {
//     const categoryList = document.getElementById('categoryList');
//     getDocs(collection(firestore, 'categories'))
//         .then((categories) => {
//             categoryList.innerHTML = ''; // Clear the list
//             categories.forEach((categoryDoc) => {
//                 const category = categoryDoc.data();
//                 const row = document.createElement('tr');
//                 row.innerHTML = `
//                     <td>${category.name}</td>
//                     <td>
//                         <button class="btn btn-sm btn-primary edit">Edit</button>
//                         <button class="btn btn-sm btn-danger delete">Delete</button>
//                     </td>
//                 `;
//                 categoryList.appendChild(row);
//                 row.querySelector('.edit').addEventListener('click', () => editCategory(category.categoryId, category.name))
//                 row.querySelector('.delete').addEventListener('click', () => deleteCategory(category.categoryId))
//             });
//         })
//         .catch((error) => {
//             console.error('Error getting categories:', error);
//         });
// }

// Add Manufacturer
document.getElementById('saveManufacturerButton').addEventListener('click', async () => {
    const manufacturerName = document.getElementById('manufacturerName').value;
    if (manufacturerName) {
        try {
            const manufacturerId = await addManufacturer(manufacturerName);
            console.log('Manufacturer added successfully');
            displayMessage('Manufacturer added successfully!', 'success');
            populateManufacturerList(); // Update the manufacturer list
            document.getElementById('manufacturerName').value = ''; // Clear the input field
        } catch (error) {
            console.error('Error adding manufacturer:', error);
        }
    }
});

// Add Category
// document.getElementById('saveCategoryButton').addEventListener('click', async () => {
//     const categoryName = document.getElementById('categoryName').value;
//     if (categoryName) {
//         try {
//             const categoryId = await addCategory(categoryName);
//             console.log('Category added successfully');
//             displayMessage('Category added successfully!', 'success');
//             populateCategoryList(); // Update the category list
//             document.getElementById('categoryName').value = ''; // Clear the input field
//         } catch (error) {
//             console.error('Error adding category:', error);
//         }
//     }
// });


// Function to populate the manufacturer dropdown in the modal
function populateManufacturerDropdown(targetDropdownId) {
    const select = document.querySelector(`#${targetDropdownId}`);
    select.innerHTML = `<option value="">
                                Loading ...
                            </option>`;

    // Fetch and populate the manufacturers list
    getDocs(collection(firestore, 'manufacturers'))
        .then((manufacturers) => {
            select.innerHTML = '';
            const option = document.createElement('option');
            option.innerHTML = 'Please select';
            select.appendChild(option);

            manufacturers.forEach((manufacturerDoc) => {
                const manufacturer = manufacturerDoc.data();
                const option = document.createElement('option');
                option.setAttribute('value', manufacturer.manufacturerId);
                option.innerHTML = `${manufacturer.name}`;
                select.appendChild(option);
            });
        })
        .catch((error) => {
            console.error('Error getting manufacturers:', error);
        });
}
//----------------------------- Product Size in Ltr-----------------------------
const openProductSizemodal = document.getElementById('addProductSizeButton');
openProductSizemodal.addEventListener('click', () => {
    // console.log("1");
    document.getElementById('productSizeName').value = '';
    populateProductSizeList();
})

//populate product sizelist
function populateProductSizeList() {
    const productSizeList = document.querySelector('#productSizeList');
    getDocs(collection(firestore, 'sizes'))
        .then((sizes) => {
            productSizeList.innerHTML = '';
            sizes.forEach((productSizeDoc) => {
                const productSize = productSizeDoc.data();
                // console.log(productSize);
                const row = document.createElement('tr');
                row.innerHTML = `
             <td>${productSize.size}</td>
             <button class="btn btn-sm btn-primary edit ms-2">Edit</button>&nbsp
             <button class="btn btn-sm btn-danger delete ms-2">Delete</button>
            `
                productSizeList.appendChild(row);
                row.querySelector('.edit').addEventListener('click', async () => editProductSize(productSize.sizeId, productSize.size));
                row.querySelector('.delete').addEventListener('click', async () => deleteProductSize(productSize.sizeId, productSize.size))
            })
        })
}

// Add the productSize Inside the Model
document.querySelector('#saveProductSizeButton').addEventListener('click', async () => {
    const productSizeName = document.querySelector('#productSizeName').value;
    if (productSizeName) {
        try {
            const ProductSizeId = await addProductSize(productSizeName);
            console.log('product Size uploaded successfully');
            displayMessage('Product Size Uploaded', 'success');
            populateProductSizeList();
            document.querySelector('#productSizeName').value = '';
        } catch (error) {
            console.log('Error adding product:', error);
        }
    }
})

async function addProductSize(productSizeName) {
    try {
        const productSizeRef = collection(firestore, 'sizes');
        const docRef = await addDoc(productSizeRef, { size: productSizeName });
        await updateDoc(docRef, { sizeId: docRef.id })
        document.querySelector('#productSizeDropdown').addEventListener('click', fetchProductSizes)
        return docRef.id;
    } catch (error) {
        console.error('Error adding productsize:', error);
        throw error;
    }
}

// Edit product Size 
async function editProductSize(productsizeId, productSizeName) {
    const updateProductSizeName = prompt('Edit productSize Name', productSizeName);
    if (updateProductSizeName !== null) {
        const productSizeCollection = collection(firestore, 'sizes');
        const productSizeSnapshot = await getDocs(query(productSizeCollection, where('sizeId', '==', productsizeId)));
        //  console.log(productSizeSnapshot);
        if (!productSizeSnapshot.empty) {
            // console.log("5")
            updateDoc(productSizeSnapshot.docs[0].ref, { size: updateProductSizeName })
                .then(() => {
                    console.log('Product Size updated successfully');
                    displayMessage('Product Size updated successfully!', 'success');
                    document.querySelector('#productSizeDropdown').addEventListener('click', fetchProductSizes)
                    populateProductSizeList();
                })
                .catch((error) => {
                    console.error('Error updating productSize:', error);
                });
        }
    }
}

// delete Product Size
async function deleteProductSize(productSizeId, productSizeName) {
    const confirmation = confirm("Are you sure you want delete this productSize?", productSizeName);
    if (confirmation) {
        try {
            const productSizeCollection = collection(firestore, 'sizes');
            const productSizeSnapshot = await getDocs(query(productSizeCollection, where('sizeId', '==', productSizeId)));
            if (!productSizeSnapshot.empty) {
                await deleteDoc(productSizeSnapshot.docs[0].ref);
            }
            console.log('Product Size deleted successfully');
            displayMessage('Product Size deleted successfully!', 'success');
            document.querySelector('#productSizeDropdown').addEventListener('click', fetchProductSizes)
            populateProductSizeList();
        } catch (error) {
            console.error('Error deleting productsize:', error);
        }
    }
}

// Fetch product Size 
async function fetchProductSizes() {
    const select = document.querySelector('#productSizeDropdown')
    select.innerHTML = `<option value="">
                                Loading ...
                            </option>`
    const productSizeSnapshot = await getDocs(collection(firestore, 'sizes'))
    if (!productSizeSnapshot.empty) {
        select.removeEventListener('click', fetchProductSizes)
        select.innerHTML = ``
        const option = document.createElement('option')
        option.innerHTML = `Please select`
        select.appendChild(option)
        productSizeSnapshot.forEach(doc => {
            const option = document.createElement('option')
            option.setAttribute('value', doc.data().size)
            option.setAttribute('data-id', doc.data().sizeId)
            option.innerHTML = `${doc.data().size}`
            // console.log(option);
            select.appendChild(option)
        })
    }
    else {
        select.innerHTML = `<option value="">Please select</option>`
        displayMessage('No categories added!', 'danger')
    }
}
//------------------------------------------------------------------------------
// Function to remove a selected color
function removeSelectedColor(index) {
    selectedColors.splice(index, 1);
    updateSelectedColorsList();
}

// Function to clear the selected colors array
function clearSelectedColors() {
    selectedColors.length = 0;
    updateSelectedColorsList();
}

//------------------ Function to upload image and product information---------------------------------
var newProductArrivalStatusYes = document.querySelector('#new-product-arrival-yes');
var newProductArrivalStatusNo = document.querySelector('#new-product-arrival-no');
var newProductArrivalStatus = false;
newProductArrivalStatusYes.addEventListener('change', function () {
    if (this.checked) {
        newProductArrivalStatus = true;
        newProductArrivalStatusNo.checked = false;
    }
});

newProductArrivalStatusNo.addEventListener('change', function () {
    if (this.checked) {
        newProductArrivalStatus = false;
        newProductArrivalStatusYes.checked = false;
    }
});
async function uploadProduct() {
    if (newProductArrivalStatusYes.checked) {
        newProductArrivalStatus = true;
        newProductArrivalStatusNo.checked = false;
    }
    else if (newProductArrivalStatusNo.checked) {
        newProductArrivalStatus = false;
    }

    // console.log(newProductArrivalStatus)

    document.querySelector('#uploadProductButton').disabled = true;
    document.querySelector('#uploadProductButton').textContent = 'Uploading ...';
    const productId = generateUniqueProductId();
    // console.log(productId);
    const productName = document.getElementById('productName').value;
    const productTagLine = document.getElementById('productTagLine').value;
    const productQuantity = document.getElementById('productQuantity').value;
    const productPrice = document.getElementById('productPrice').value;
    const fileInput = document.getElementById('productImage');
    const manufacturerOption = document.getElementById('manufacturerDropdown').options[document.getElementById('manufacturerDropdown').selectedIndex];
    // const categoryOption = document.getElementById('categoryDropdown').options[document.getElementById('categoryDropdown').selectedIndex];
    // const colorShadeOption = document.getElementById('colorShadeDropdown').options[document.getElementById('colorShadeDropdown').selectedIndex];
    const productSizeOption = document.getElementById('productSizeDropdown').options[document.getElementById('productSizeDropdown').selectedIndex];
    const productDescriptionTextarea = document.querySelector('#product-description');
    const productDetailsTextarea = document.querySelector('#product-details');
    const productSpecificationsTextarea = document.querySelector('#product-specifications')
    const selectedFile = fileInput.files[0];

    if (productName && productTagLine && productQuantity && productPrice && manufacturerOption
        && productSizeOption && selectedFile && productDescriptionTextarea && productDetailsTextarea
        && productSpecificationsTextarea && (newProductArrivalStatus === true || newProductArrivalStatus === false)) {
        // const fileName = selectedFile.name;
        const fileName = `${productId}-${selectedFile.name}`;
        // // console.log(fileName);
        const folderRef = ref(storage, 'product-images');
        const imageRef = ref(folderRef, fileName);
        // Add the Manufacturer

        // Upload the image to Firebase Storage
        uploadBytes(imageRef, selectedFile)
            .then(async (snapshot) => {
                // Get the download URL of the uploaded image
                getDownloadURL(imageRef)
                    .then(async (downloadURL) => {
                        let productData = ''

                        productData = {
                            productId: productId,
                            name: productName,
                            tagLine: productTagLine,
                            // size: productSize,
                            quantity: productQuantity,
                            price: parseFloat(productPrice),
                            imageUrl: downloadURL,
                            manufacturerName: manufacturerOption.value,
                            manufacturerId: manufacturerOption.getAttribute('data-id'),
                            // categoryName: categoryOption.value,
                            // categoryId: categoryOption.getAttribute('data-id'),
                            size: productSizeOption.value,
                            sizeId: productSizeOption.getAttribute('data-id'),
                            ProductDescription: productDescriptionTextarea.value,
                            productDetails: productDetailsTextarea.value,
                            productSpecifications: productSpecificationsTextarea.value,
                            newProductArrivalStatus: newProductArrivalStatus
                        };
                        // console.log(productData);
                        const productsRef = collection(firestore, 'products');
                        const docRef = await addDoc(productsRef, productData);
                        await updateDoc(docRef, { productId: docRef.id })
                            .then(() => {
                                displayMessage('Product Uploaded Successfully!', 'success')
                                // Clear selected colors after successful upload
                                document.querySelector('#uploadProductButton').disabled = false;
                                document.querySelector('#uploadProductButton').textContent = 'Upload Product';
                                document.getElementById('productInfoForm').reset();
                            })
                            .catch((error) => {
                                document.querySelector('#uploadProductButton').disabled = false;
                                document.querySelector('#uploadProductButton').textContent = 'Upload Product';
                                console.error('Error adding product information to Firestore:', error);
                            });
                    })
                    .catch((error) => {
                        document.querySelector('#uploadProductButton').disabled = false;
                        document.querySelector('#uploadProductButton').textContent = 'Upload Product';
                        console.error('Error getting image download URL:', error);
                    });
            })
            .catch((error) => {
                document.querySelector('#uploadProductButton').disabled = false;
                document.querySelector('#uploadProductButton').textContent = 'Upload Product';
                console.error('Error uploading image: ', error);
            });
    } else {
        displayMessage('Please fill in all product information and select an image.', 'danger')

        document.querySelector('#uploadProductButton').disabled = false;
        document.querySelector('#uploadProductButton').textContent = 'Upload Product';
        // alert('Please fill in all product information and select an image.');
    }
}

// Add a click event listener to the Upload Product
const uploadProductButton = document.getElementById('uploadProductButton');
uploadProductButton.addEventListener('click', uploadProduct);

//******************************** Membership id *****************************************

//Generate unique membershipId
function generateUniqueMembershipId() {
    const currentDate = new Date();
    const formattedDate = formatDate(currentDate);
    const formattedTime = formatTime(currentDate);

    // Generate a random alphanumeric string
    const randomString = generateRandomString(6);

    // Combine date, time, and random string to create the unique ID
    const membershipId = `${formattedDate}${formattedTime}${randomString}`;
    return membershipId;
}

function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}${month}${day}`;
}

function formatTime(date) {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${hours}${minutes}${seconds}`;
}

function generateRandomString(length) {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * charset.length);
        result += charset.charAt(randomIndex);
    }
    return result;
}

//****************************** GenerateUniqueProdcutId **************************************** 

//Unique productId
function generateUniqueProductId() {
    const timestamp = new Date().getTime();
    const randomPart = Math.random().toString(36).substring(2, 10);
    return `${timestamp}_${randomPart}`;
}

function editProduct() {
    // Redirect to product-edit.html with the product ID as a query parameter
    window.location.href = 'product-edit.html';
}

//************************************* toast message **********************************

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

//************************************************************************************

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