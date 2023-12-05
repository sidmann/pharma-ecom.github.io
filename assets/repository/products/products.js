import { firestore, auth, getCountFromServer, collection, query, where } from '../initialize.js'

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