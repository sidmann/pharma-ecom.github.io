/**
 * @description
 * 
 * Respository for User cart
 * @author dev
 */
//firestore
import {
    firestore,
    collection,
    getCountFromServer
} from "../initialize.js";

/**
 * 
 * @param {*} loggedIn | to check the user logged in status
 * @param {*} userId | userId if logged in
 * @returns no of items in cart
 * 
 * @author dev
 */
export async function getCartCount(loggedIn, userId = null) {
    if (loggedIn) {
        const collRef = collection(firestore, 'users', userId, 'cart')
        const countSnapshot = await getCountFromServer(collRef)
        return countSnapshot.data().count
    }
    else {
        const cart = JSON.parse(sessionStorage.getItem('cart'))
        if (cart){
            return cart.length
        }
        else return 0
    }
}