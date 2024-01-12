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
const confirmLogoutBtn = document.getElementById("confirmLogoutBtn");
var loggedIn = false;

// Function to check if the user is logged in
function isUserLoggedIn() {
    return !!auth.currentUser;
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

//*****************************loading and role access************************************
// Use onAuthStateChanged to control access to admin dashboard
onAuthStateChanged(auth, (user) => {
    if (user) {
        loggedIn = true;
        onLoggedIn();
        document.querySelectorAll('.logout-btn').forEach((btn) => {
            btn.classList.remove('d-none');
        });
        // User is authenticated
        // console.log("onAuthStateChanged")
        const docRef = doc(firestore, "users", user.uid);
        const docSnap = getDoc(docRef);
        docSnap.then((docSnapshot) => {
            if (docSnapshot.exists()) {
                userData = docSnapshot.data();
                roleAccess(userData.role);
                fetchAndDisplayProducts();
                updateProfileName(userData.role, userData.firstName)
                updateProfilePicture(userData.role, userData.profilePicture)
                updateCart();
                // fetchNavCategories();
            }
        });
    } else {
        document.querySelectorAll('.logout-btn').forEach((btn) => {
            btn.classList.add('d-none');
        });
        // User is not authenticated, redirect to login page
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
    // console.log(appbarList)
    appbarList.forEach((appbar) => {
        // console.log(appbar);
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

//stop the loader show the main body
function stopLoader() {
    document.querySelector('#overlay').classList.add('hidden')
    document.querySelector('#main').classList.remove('hidden')
}

//***************************************************************
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

//*****************************************************************************

//Display the products in admin side and manage    
function fetchAndDisplayProducts() {
    const productsRef = collection(firestore, 'products');


    getDocs(productsRef)
        .then((querySnapshot) => {
            const productTableBody = document.getElementById('productTableBody');
            productTableBody.innerHTML = ''
            querySnapshot.forEach((doc) => {
                const productData = doc.data();
                const productId = productData.productId;
                // console.log(productData);
                // console.log(productId); 

                const productRow = createProductRow(productId, productData);
                productTableBody.appendChild(productRow);
            });
        })
        .catch((error) => {
            console.error('Error fetching products:', error);
        });
}

function createProductRow(productId, productData) {
    // Create a table row for each product
    const productRow = document.createElement('tr');

    // Create a div to display the selected colors
    const colorContainer = document.createElement('div');
    colorContainer.classList.add('color-container');

    // Check if productData has the 'color' property and it is an array
    if (Array.isArray(productData.color)) {
        productData.color.forEach((hexCode, index) => {
            const colorBox = document.createElement('div');
            colorBox.style.backgroundColor = hexCode;
            colorBox.style.width = '40px';
            colorBox.style.height = '20px';
            colorBox.classList.add('color-box');

            const hexLabel = document.createElement('label');
            hexLabel.textContent = hexCode;

            const colorBoxContainer = document.createElement('div');
            colorBoxContainer.appendChild(colorBox);
            colorBoxContainer.appendChild(hexLabel);

            // Append the color box and hex code label to the color container
            colorContainer.appendChild(colorBoxContainer);

            // Add a line break after each color (optional)
            if (index < productData.color.length - 1) {
                colorContainer.appendChild(document.createElement('br'));
            }
        });
    }

    productRow.innerHTML = `
            <td>${productData.manufacturerName}</td>
            <td>${productData.name}</td>
            <td>${productData.tagLine}</td>
            <td>${productData.size}</td>
            <td>${productData.price}</td>
            <td>${productData.quantity}</td>
            <td><img src="${productData.imageUrl}" width="100" height="100" /></td>
            <td>
                <button class="update-button-${productData.productId} btn btn-primary mb-2" data-product-id="${productData.productId}" data-bs-toggle="modal" data-bs-target="#exampleModal">Update Product</button>
                <button class="delete-button-${productData.productId} btn btn-danger" data-product-id="${productData.productId}">Delete Product</button>
            </td>
        `;

    const updateButton = productRow.querySelector(`.update-button-${productData.productId}`);
    const deleteButton = productRow.querySelector(`.delete-button-${productData.productId}`);

    updateButton.addEventListener('click', (event) => {
        event.preventDefault();
        const clickedProductId = event.target.getAttribute('data-product-id');
        openUpdateModal(clickedProductId);
    });

    deleteButton.addEventListener('click', (event) => {
        event.preventDefault();
        const clickedProductId = event.target.getAttribute('data-product-id');
        deleteProduct(clickedProductId, event.target);
    });

    return productRow;
}

function deleteProduct(productId, deleteButton) {
    const confirmation = confirm('Are you sure you want to delete this product?');
    if (confirmation) {
        deleteButton.disabled = true
        deleteButton.textContent = 'Deleting...'
        const productsRef = collection(firestore, 'products');

        // Create a query to find the product with the specified productId
        const queryRef = query(productsRef, where("productId", "==", productId));

        getDocs(queryRef)
            .then((querySnapshot) => {
                if (!querySnapshot.empty) {
                    const productDoc = querySnapshot.docs[0];
                    const imageUrl = productDoc.data().imageUrl;

                    // Delete the product document
                    deleteDoc(productDoc.ref)
                        .then(() => {
                            // Product deleted successfully
                            displayMessage('Product deleted successfully!', 'success');
                            deleteButton.disabled = false
                            deleteButton.textContent = 'Delete Product'
                            // Remove the product row from the table
                            const productRow = document.querySelector(`[data-product-id="${productId}"]`).closest('tr');
                            if (productRow) {
                                productRow.remove();
                            }

                            // Delete the image from storage (if it exists)
                            if (imageUrl) {
                                const storageRef = ref(getStorage(app), imageUrl);
                                deleteObject(storageRef)
                                    .then(() => {
                                        console.log('Image deleted from storage successfully.');
                                    })
                                    .catch((error) => {
                                        console.error('Error deleting image from storage:', error);
                                    });
                            }
                        })
                        .catch((error) => {
                            console.error('Error deleting product:', error);
                            displayMessage('Error deleting product', 'danger');
                        });
                } else {
                    console.log('No product found with the specified ID.');
                    displayMessage('No product found with the specified ID.', 'danger');
                }
            })
            .catch((error) => {
                console.error('Error fetching product details:', error);
                displayMessage('Error fetching product details', 'danger');
            });
    }
}

// Function to update the list of selected colors
function updateColorDisplay() {
    const colorContainer = document.querySelector('#colorContainer');
    colorContainer.innerHTML = '';

    const colorInputs = colorInputsContainer.querySelectorAll('input[type="color"]');
    colorInputs.forEach((colorInput, index) => {
        const color = colorInput.value;
        colors[index] = color; // Update the color in the array
        const colorElement = document.createElement('div');
        colorElement.style.backgroundColor = color;
        colorElement.classList.add('color-box');
        colorContainer.appendChild(colorElement);
    });
}

//----------------------------- Update Product--------------------------------
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

//Open the Update Product model
async function openUpdateModal(productId) {

    const productNameInput = document.querySelector('#productName');
    const productTagLineInput = document.querySelector('#productTagLine');
    const manufacturerInput = document.querySelector('#manufacturerName');
    // const categoryDropdown = document.querySelector('#categoryDropdown');
    // const productColorInput = document.querySelector('#productColor');
    // const colorShadeInput = document.querySelector('#colorShadeDropdown');
    const productSizeInput = document.querySelector('#productSize');
    const productPriceInput = document.querySelector('#productPrice');
    const productQuantityInput = document.querySelector('#productQuantity');
    const productImageInput = document.querySelector('#productImage');
    const productImagePreview = document.querySelector('#productImagePreview');
    const previousProductImagePreview = document.querySelector('#previousProductImagePreview');
    let productDescriptionTextarea = document.querySelector('#product-description');
    let productDetailsTextarea = document.querySelector('#product-details');
    let productSpecificationsTextarea = document.querySelector('#product-specifications')


    // const updateProductModal = document.getElementById('updateProductModal');
    const updateForm = document.getElementById('#updateProductForm');
    if (newProductArrivalStatusYes.checked) {
        newProductArrivalStatus = true;
        newProductArrivalStatusNo.checked = false;
    }
    else if (newProductArrivalStatusNo.checked) {
        newProductArrivalStatus = false;
    }
    // console.log(updateForm);

    //reset input file
    productImageInput.value = ""
    const productRef = collection(firestore, 'products');
    const queryRef = query(productRef, where("productId", "==", productId))
    // console.log('inside open model')
    getDocs(queryRef)
        .then(async (querySnapshot) => {
            if (!querySnapshot.empty) {
                const productDoc = querySnapshot.docs[0];
                const productData = productDoc.data();
                // console.log('inside getdocs')
                // console.log(productData);
                manufacturerInput.innerHTML = productData.manufacturerName;
                // console.log(17)
                // if (await fetchCategories())
                //     categoryDropdown.value = productData.categoryId;

                // productColorInput.value = productData.color;
                productNameInput.value = productData.name;
                productTagLineInput.value = productData.tagLine;
                productSizeInput.value = productData.size;
                productPriceInput.value = productData.price;
                productQuantityInput.value = productData.quantity;
                // productIdInput.value = productData.productId;
                const existingImageUrl = productData.imageUrl;

                // Display the existing product image
                productImagePreview.src = productData.imageUrl;
                productDescriptionTextarea.value = productData.ProductDescription;
                productDetailsTextarea.value = productData.productDetails;
                productSpecificationsTextarea.value = productData.productSpecifications;

                //Display the Admin choose image here
                productImageInput.addEventListener('change', () => {
                    const file = productImageInput.files[0];
                    if (file) {
                        const reader = new FileReader();
                        reader.onload = (e) => {
                            // Set the 'src' attribute of the preview image to the data URL
                            productImagePreview.src = e.target.result;
                        };
                        reader.readAsDataURL(file);
                    } else {
                        // Set to an empty string or a placeholder image URL
                        productImagePreview.src = productData.imageUrl;
                    }
                });

                function removeUpdateEvent() {
                    document.querySelector('#updateButton').removeEventListener('click', updateEvent);
                    document.querySelector('#modal-close').removeEventListener('click', removeUpdateEvent)
                    document.querySelector('#modal-close-cross').removeEventListener('click', removeUpdateEvent)
                }

                document.querySelector('#modal-close').addEventListener('click', removeUpdateEvent)
                document.querySelector('#modal-close-cross').addEventListener('click', removeUpdateEvent)
                document.querySelector('#updateButton').addEventListener('click', updateEvent);

                function updateEvent() {
                    // console.log('inside update1')
                    document.querySelector('#updateButton').disabled = true
                    document.querySelector('#updateButton').textContent = 'Saving...'

                    // const manufacturerOption = document.getElementById('manufacturerDropdown').options[document.getElementById('manufacturerDropdown').selectedIndex];
                    // const categoryOption = document.getElementById('categoryDropdown').options[document.getElementById('categoryDropdown').selectedIndex];
                    // const colorShadeOption = document.getElementById('colorShadeDropdown').options[document.getElementById('colorShadeDropdown').selectedIndex];

                    if (productImageInput.files.length > 0) {
                        // console.log("if")
                        const newImageFile = productImageInput.files[0];
                        const storageRefOne = ref(getStorage(app), existingImageUrl);

                        // Delete the old file
                        deleteObject(storageRefOne)
                            .then(() => {
                                // console.log('inside delete')
                                uploadBytes(storageRefOne, newImageFile).then((snapshot) => {
                                    getDownloadURL(snapshot.ref).then((downloadURL) => {
                                        let newProductData = ''
                                        if (newProductArrivalStatus === true || newProductArrivalStatus === false) {

                                            newProductData = {
                                                // productId: productIdInput.value,
                                                // manufacturerName: manufacturerInput.textContent,
                                                // categoryName: categoryOption.getAttribute('data-name'),
                                                // manufacturerId: manufacturerInput.value,
                                                // categoryId: categoryOption.value,
                                                name: productNameInput.value,
                                                tagLine: productTagLineInput.value,
                                                // color: productColors,
                                                size: productSizeInput.value,
                                                price: parseFloat(productPriceInput.value),
                                                quantity: productQuantityInput.value,
                                                imageUrl: downloadURL,
                                                ProductDescription: productDescriptionTextarea.value,
                                                productDetails: productDetailsTextarea.value,
                                                productSpecifications: productSpecificationsTextarea.value,
                                                newProductArrivalStatus: newProductArrivalStatus
                                            };
                                        }
                                        // console.log(newProductData);
                                        updateDoc(productDoc.ref, newProductData)
                                            .then((result) => {
                                                // console.log(result)
                                                displayMessage("Product updated!", 'success')
                                                document.querySelector('#updateButton').disabled = false
                                                document.querySelector('#updateButton').textContent = 'Save changes'
                                                productImageInput.value = ''
                                                fetchAndDisplayProducts();
                                            })
                                            .catch((error) => {
                                                console.error('Error updating product:', error);
                                            });
                                    });
                                });
                            })
                    }
                    else {
                        // console.log("else")
                        // console.log(newProductArrivalStatus)
                        let newProductData = ''
                        if (newProductArrivalStatus === true || newProductArrivalStatus === false) {
                            newProductData = {
                                // productId: productIdInput.value,
                                // manufacturerName: manufacturerInput.textContent,
                                // categoryName: categoryOption.getAttribute('data-name'),
                                // manufacturerId: manufacturerInput.value,
                                // categoryId: categoryOption.value,
                                name: productNameInput.value,
                                tagLine: productTagLineInput.value,
                                // color: productColors,
                                size: productSizeInput.value,
                                price: parseFloat(productPriceInput.value),
                                quantity: productQuantityInput.value,
                                // imageUrl: downloadURL,
                                ProductDescription: productDescriptionTextarea.value,
                                productDetails: productDetailsTextarea.value,
                                productSpecifications: productSpecificationsTextarea.value,
                                newProductArrivalStatus: newProductArrivalStatus
                            };
                        }
                        // console.log(newProductData);
                        updateDoc(productDoc.ref, newProductData).then((result) => {
                            console.log(result)
                            displayMessage('Product Updated successfully!', 'success')
                            document.querySelector('#updateButton').disabled = false
                            document.querySelector('#updateButton').textContent = 'Save changes'
                            fetchAndDisplayProducts();
                        })
                    }
                }
            } else {
                // console.log('No product found with the specified ID.');
                displayMessage('No product found with the specified ID.', 'danger')
                document.querySelector('#updateButton').disabled = false
                document.querySelector('#updateButton').textContent = 'Save changes'
            }
        })
        .catch((error) => {
            console.error('Error fetching product details:', error);
            document.querySelector('#updateButton').disabled = false
            document.querySelector('#updateButton').textContent = 'Save changes'
        });
}
//**********************************************************************************************************

//**************************************fetch operaions*****************************************************
async function fetchManufacturers() {
    return new Promise(async (resolve) => {
        const select = document.querySelector('#manufacturerName')
        select.innerHTML = `<option value="">
                        Loading ...
                    </option>`
        const manufacturerSnapshot = await getDocs(collection(firestore, 'manufacturers'))
        if (!manufacturerSnapshot.empty) {
            select.removeEventListener('click', fetchManufacturers)
            select.innerHTML = ``
            const option = document.createElement('option')
            option.innerHTML = `Please select`
            option.setAttribute('value', ' ')
            select.appendChild(option)
            manufacturerSnapshot.forEach(doc => {
                const option = document.createElement('option')
                option.setAttribute('value', doc.data().manufacturerId)
                option.setAttribute('data-name', doc.data().name)
                option.innerHTML = `${doc.data().name}`
                select.appendChild(option)

                // Set the selected option if the manufacturer matches the selectedManufacturerId
                if (manufacturerId === selectedManufacturerId) {
                    option.selected = true;
                }
            })
        }
        else {
            select.innerHTML = `<option value="">Please select</option>`
            displayMessage('No manufactures added!', 'danger')
            resolve(false)
        }
        resolve(true)
    })
}

// async function fetchCategories() {
//     return new Promise(async (resolve) => {
//         const select = document.querySelector('#categoryDropdown')
//         select.innerHTML = `<option value="">
//                         Loading ...
//                     </option>`
//         const categorySnapshot = await getDocs(collection(firestore, 'categories'))
//         if (!categorySnapshot.empty) {
//             select.removeEventListener('click', fetchCategories)
//             select.innerHTML = ``
//             const option = document.createElement('option')
//             option.innerHTML = `Please select`
//             option.setAttribute('value', ' ')
//             select.appendChild(option)
//             categorySnapshot.forEach(doc => {
//                 const option = document.createElement('option')
//                 option.setAttribute('value', doc.data().categoryId)
//                 option.setAttribute('data-name', doc.data().name)
//                 option.innerHTML = `${doc.data().name}`
//                 select.appendChild(option)
//             })
//         }
//         else {
//             select.innerHTML = `<option value="">Please select</option>`
//             displayMessage('No categories added!', 'danger')
//             resolve(false)
//         }
//         resolve(true)
//     })
// }

async function fetchColorShades(manufacturerId) {
    // console.log(17.1)
    const select = document.querySelector(`#colorShadeDropdown`);
    select.innerHTML = `<option value="">
            Loading ...
        </option>`;
    const colorShadeSnapshot = await getDocs(query(collection(firestore, 'colorShades'), where('manufacturerId', '==', manufacturerId)));
    if (!colorShadeSnapshot.empty) {
        // select.removeEventListener('click', fetchColorShades);
        select.innerHTML = '';
        const option = document.createElement('option');
        option.innerHTML = 'Please select';
        select.appendChild(option);
        colorShadeSnapshot.forEach(doc => {
            const option = document.createElement('option');
            option.setAttribute('value', doc.data().name);
            option.setAttribute('data-id', doc.data().colorShadeId);
            option.innerHTML = `${doc.data().name}`;
            select.appendChild(option);
        });
    } else {
        select.innerHTML = `<option value="">Please select</option>`;
        displayMessage('No color shades added for this manufacturer!', 'danger');
    }
}
//*******************************************************************************************

//************toast message***********
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
//***********************************************************************************************

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