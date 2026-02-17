/**
 * GraphQL queries for FiltersStore
 * All filter-related queries for attributes and aggregations
 */

// Get dynamic attributes for a specific category
export const GET_CATEGORY_ATTRIBUTES_QUERY = `
  query GetAttributesByCategorySlug($categorySlug: String!) {
    getAttributesByCategorySlug(categorySlug: $categorySlug) {
      id
      key
      name
      type
      validation
      sortOrder
      group
      groupOrder
      isActive
      isGlobal
      showInGrid
      showInList
      showInDetail
      showInFilter
      config
      options {
        id
        key
        value
        sortOrder
        isActive
        showInGrid
        showInList
        showInDetail
        showInFilter
      }
    }
  }
`;

// Get listing aggregations for filter counts and options
export const GET_LISTING_AGGREGATIONS_QUERY = `
  query GetListingAggregations($filter: ListingFilterInput) {
    listingsAggregations(filter: $filter) {
      totalResults
      provinces {
        value
        count
      }
      attributes {
        field
        totalCount
        options {
          value
          count
          key
        }
      }
    }
  }
`;
