/**
 * GraphQL queries for user's own listings
 * PORTED FROM WEB FRONTEND
 */

export const MY_LISTINGS_QUERY = `
  query MyListings($status: ListingStatus, $limit: Int, $offset: Int) {
    myListings(status: $status, limit: $limit, offset: $offset) {
      id
      title
      priceMinor
      status
      imageKeys
      viewCount
      createdAt
      updatedAt
      rejectionReason
      rejectionMessage
      location {
        province
      }
      category {
        id
        name
        nameAr
        slug
      }
    }
  }
`;

export const MY_LISTINGS_COUNT_QUERY = `
  query MyListingsCount($status: ListingStatus) {
    myListingsCount(status: $status)
  }
`;

export const MY_LISTING_BY_ID_QUERY = `
  query MyListingByIdV2($id: ID!) {
    myListingById(id: $id) {
      id
      title
      description
      priceMinor
      status
      imageKeys
      videoUrl
      listingType
      condition
      specs
      specsDisplay
      location {
        province
        city
        area
        link
      }
      allowBidding
      biddingStartPrice
      rejectionReason
      rejectionMessage
      createdAt
      updatedAt
      category {
        id
        name
        nameAr
        slug
      }
    }
  }
`;

export const UPDATE_MY_LISTING_MUTATION = `
  mutation UpdateMyListing($id: ID!, $input: UpdateListingInput!) {
    updateMyListing(id: $id, input: $input) {
      id
      title
      description
      priceMinor
      status
      allowBidding
      biddingStartPrice
      listingType
      condition
      imageKeys
      videoUrl
      location {
        province
        city
        area
        link
      }
      updatedAt
    }
  }
`;

export const DELETE_MY_LISTING_MUTATION = `
  mutation DeleteMyListing($id: ID!, $archivalReason: ArchivalReason!) {
    deleteMyListing(id: $id, archivalReason: $archivalReason)
  }
`;

// Create image upload URL (Cloudflare Images)
export const CREATE_IMAGE_UPLOAD_URL_MUTATION = `
  mutation CreateImageUploadUrl {
    createImageUploadUrl {
      uploadUrl
      assetKey
    }
  }
`;

// Get attributes for a category (for edit form)
export const GET_ATTRIBUTES_BY_CATEGORY = `
  query GetAttributesByCategory($categoryId: String!) {
    getAttributesByCategory(categoryId: $categoryId) {
      id
      key
      name
      type
      validation
      sortOrder
      group
      groupOrder
      storageType
      isActive
      isGlobal
      config
      options {
        id
        key
        value
        sortOrder
        isActive
      }
    }
  }
`;

// Get brands by category
export const GET_BRANDS_QUERY = `
  query GetBrands($categoryId: String!) {
    brands(categoryId: $categoryId) {
      id
      name
      nameAr
      slug
      logoUrl
      isActive
    }
  }
`;

// Get models by brand
export const GET_MODELS_QUERY = `
  query GetModels($brandId: String!) {
    models(brandId: $brandId) {
      id
      name
      slug
      isActive
    }
  }
`;

// Get variants by model
export const GET_VARIANTS_BY_MODEL_QUERY = `
  query GetVariants($modelId: String!) {
    variants(modelId: $modelId) {
      id
      modelId
      name
      slug
      isActive
    }
  }
`;
