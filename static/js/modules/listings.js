import * as listingsApi from '../api/listings.js';

export async function loadListings(params = {}) {
    const data = await listingsApi.getListings(params);
    return data;
}

export async function loadMyListings() {
    const data = await listingsApi.getMyListings();
    return data.listings || [];
}

export async function createListing(listing) {
    return listingsApi.createListing(listing);
}

export async function updateListing(id, listing) {
    return listingsApi.updateListing(id, listing);
}

export async function deleteListing(id) {
    return listingsApi.deleteListing(id);
}

export async function updateListingStatus(id, status) {
    return listingsApi.updateListingStatus(id, status);
}

export async function uploadImage(file) {
    return listingsApi.uploadImage(file);
}