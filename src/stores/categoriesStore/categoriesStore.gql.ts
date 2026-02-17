/**
 * GraphQL queries for CategoriesStore
 * Matching web frontend pattern
 */

export const CATEGORIES_QUERY = `
  query GetCategories {
    categories {
      id
      name
      nameAr
      slug
      isActive
      icon
      supportedListingTypes
    }
  }
`;
