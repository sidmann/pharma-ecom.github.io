import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/10.3.1/firebase-app.js";

import {
    ref,
    uploadBytes,
    getDownloadURL,
    getStorage
} from "https://www.gstatic.com/firebasejs/10.3.1/firebase-storage.js";

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
    orderBy,
    getCountFromServer,
    deleteField
} from "https://www.gstatic.com/firebasejs/10.3.1/firebase-firestore.js";

import {
    getAuth,
    signOut,
    onAuthStateChanged,
    updatePassword,
    EmailAuthProvider,
    reauthenticateWithCredential,
    signInWithEmailAndPassword,
    sendPasswordResetEmail,
    createUserWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.3.1/firebase-auth.js";

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
export const firestore = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

//auth
export {
    signOut,
    onAuthStateChanged,
    updatePassword,
    EmailAuthProvider,
    reauthenticateWithCredential,
    signInWithEmailAndPassword,
    sendPasswordResetEmail,
    createUserWithEmailAndPassword
}

//firstore
export {
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
    orderBy,
    getCountFromServer,
    deleteField
}

//storage
export {
    ref,
    uploadBytes,
    getDownloadURL
}
