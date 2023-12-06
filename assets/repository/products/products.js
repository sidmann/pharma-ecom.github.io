/**
 * @description
 * 
 * Respository for products
 * @author dev
 */

import { 
    firestore, 
    auth, 
    getCountFromServer, 
    collection, 
    query, 
    where,
    getDoc,
    getDocs,
    doc
} from '../initialize.js'

const produtcsColRef = collection(firestore, 'products')

/**
 * 
 * @param {*} categoryId 
 * @returns category count
 * 
 * @author dev
 */
export async function getCategoryCount(categoryId) {
    const q = query(produtcsColRef, where('categoryId', '==', categoryId))
    const count = await getCountFromServer(q)
    return count.data().count
}

/**
 * 
 * @param {*} productId 
 * @returns 
 * Product Detials - {imageUrl, name, category, productDetails, manufacturerName}
 */
export async function getProductDetails(productId){
    const productSnapshot = await getDoc(doc(produtcsColRef, productId))
    if (productSnapshot.exists()){
        return productSnapshot.data()
    }
    return false
}